import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const CATEGORIES = [
  'Bedroom', 'Clothes', 'Shoes', 'Purses', 'Makeup', 'Skincare',
  'Hair Products', 'Hair Tools', 'Body Hygiene', 'Home Cleaning',
  'Tools', 'Canned Food', 'Seasonings', 'Crafts', 'Tech',
  'House Misc', 'Clothes Accessories', 'Kitchen', 'Cooking Oils', 'Kitchen Tools'
]
const DECISIONS = ['Keep', 'Sell', 'Donate', 'Toss', 'Undecided']
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Fair', 'Poor']
const HOW_ACQUIRED = ['Bought', 'Gifted', 'Inherited', 'Impulse buy']

const DECISION_COLORS = {
  Keep: '#22c55e',
  Sell: '#3b82f6',
  Donate: '#a855f7',
  Toss: '#ef4444',
  Undecided: '#94a3b8',
}

const emptyForm = {
  name: '', category: 'Clothes', location: '', estimated_value: '',
  decision: 'Undecided', poshmark: false,
  how_acquired: 'Bought', date_acquired: '', emotional_attachment: 3,
  original_price: '', date_resolved: '',
  // Poshmark-only fields
  brand: '', size: '', color: '', condition: 'Good',
  asking_price: '', flaws: '',
}

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [filterDecision, setFilterDecision] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [listingModal, setListingModal] = useState(null)
  const [error, setError] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    if (error) { setError(error.message); return }
    setItems(data || [])
  }

  async function addItem(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const payload = {
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      emotional_attachment: parseInt(form.emotional_attachment),
      date_resolved: shouldHaveDateResolved(form.decision) && form.date_resolved ? form.date_resolved : null,
      // Only send poshmark fields if flagged
      brand: form.poshmark ? form.brand : null,
      size: form.poshmark ? form.size : null,
      color: form.poshmark ? form.color : null,
      condition: form.poshmark ? form.condition : null,
      flaws: form.poshmark ? form.flaws : null,
    }
    const { error } = await supabase.from('items').insert([payload])
    if (error) { setError(error.message) }
    else { setForm(emptyForm); await fetchItems() }
    setLoading(false)
  }

  function shouldHaveDateResolved(decision) {
    return ['Sell', 'Donate', 'Toss'].includes(decision)
  }

  async function deleteItem(id) {
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function updateField(id, field, value) {
    const updates = { [field]: value, updated_at: new Date().toISOString() }
    // Auto-set date_resolved when decision changes to exit path
    if (field === 'decision' && shouldHaveDateResolved(value)) {
      const item = items.find(i => i.id === id)
      if (!item?.date_resolved) {
        updates.date_resolved = new Date().toISOString().split('T')[0]
      }
    }
    await supabase.from('items').update(updates).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function generateListing(item) {
    const price = item.asking_price ? `$${parseFloat(item.asking_price).toFixed(2)}` : (item.estimated_value ? `$${parseFloat(item.estimated_value).toFixed(2)}` : 'Price TBD')
    const text = `🛍️ ${item.brand ? item.brand + ' ' : ''}${item.name}

Condition: ${item.condition || 'See description'}
${item.size ? `Size: ${item.size}` : ''}
${item.color ? `Color: ${item.color}` : ''}
${item.category ? `Category: ${item.category}` : ''}
${item.flaws ? `\nNotes: ${item.flaws}` : ''}

${item.condition === 'New with tags' ? 'Brand new with tags! Never worn/used.' : item.condition === 'Like new' ? 'Like new! Barely used, no flaws.' : item.condition === 'Good' ? 'Gently used with minimal wear.' : item.condition === 'Fair' ? 'Shows some signs of use but fully functional.' : 'As-is condition, priced accordingly.'}

Asking: ${price}

✨ Message me with any questions! Bundle discounts available. 💕`
    setListingModal({ item, text })
  }

  const filteredItems = items.filter(i => {
    if (filterDecision !== 'All' && i.decision !== filterDecision) return false
    if (filterCategory !== 'All' && i.category !== filterCategory) return false
    return true
  })

  const poshmarkQueue = items.filter(i => i.poshmark && i.decision === 'Sell')

  // --- Dashboard stats ---
  const total = items.length
  const released = items.filter(i => ['Sell', 'Donate', 'Toss'].includes(i.decision))
  const sold = items.filter(i => i.decision === 'Sell')
  const donated = items.filter(i => i.decision === 'Donate')
  const tossed = items.filter(i => i.decision === 'Toss')

  const moneyRecovered = sold.reduce((s, i) => s + (i.asking_price || i.estimated_value || 0), 0)
  const moneyLeftOnTable = sold.reduce((s, i) => {
    const orig = i.original_price || 0
    const sell = i.asking_price || i.estimated_value || 0
    return s + Math.max(0, orig - sell)
  }, 0)

  const decisionStats = DECISIONS.map(d => ({
    label: d, count: items.filter(i => i.decision === d).length,
    pct: total ? Math.round(items.filter(i => i.decision === d).length / total * 100) : 0,
    color: DECISION_COLORS[d],
  }))

  // Most released category
  const catReleasedCounts = {}
  released.forEach(i => { catReleasedCounts[i.category] = (catReleasedCounts[i.category] || 0) + 1 })
  const mostReleasedCat = Object.entries(catReleasedCounts).sort((a,b) => b[1]-a[1])[0]

  // Released by month
  const monthCounts = {}
  released.forEach(i => {
    if (i.date_resolved) {
      const key = i.date_resolved.slice(0, 7) // YYYY-MM
      monthCounts[key] = (monthCounts[key] || 0) + 1
    }
  })
  const monthData = Object.entries(monthCounts).sort()

  // Avg emotional attachment of released
  const releasedWithEA = released.filter(i => i.emotional_attachment)
  const avgEA = releasedWithEA.length ? (releasedWithEA.reduce((s,i) => s + i.emotional_attachment, 0) / releasedWithEA.length).toFixed(1) : '—'

  const s = {
    app: { fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#1e293b' },
    header: { background: '#1e293b', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' },
    nav: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: '4px', overflowX: 'auto' },
    navBtn: (active) => ({ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#3b82f6' : '#64748b', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', whiteSpace: 'nowrap' }),
    main: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '4px' },
    input: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' },
    btn: (color='#3b82f6') => ({ padding: '8px 16px', background: color, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }),
    badge: (color) => ({ display: 'inline-block', padding: '2px 8px', background: color+'20', color, borderRadius: '999px', fontSize: '12px', fontWeight: 600 }),
    statNum: (color='#1e293b') => ({ fontSize: '28px', fontWeight: 700, color }),
    th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap' },
    td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', fontSize: '13px' },
    sectionTitle: { fontSize: '15px', fontWeight: 600, margin: '0 0 16px', color: '#1e293b' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' },
  }

  const StatBox = ({ label, value, color, sub }) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
      <div style={s.statNum(color)}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  // Simple bar chart for released by month
  const maxMonthCount = Math.max(...monthData.map(([,c]) => c), 1)

  return (
    <div style={s.app}>
      <header style={s.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>YOL — Year of Less</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Home & Life Inventory</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>{total} items tracked</div>
      </header>

      <nav style={s.nav}>
        {[['dashboard','📊 Dashboard'],['items','📦 All Items'],['add','➕ Add Item'],['poshmark','👗 Poshmark Queue']].map(([key,label]) => (
          <button key={key} style={s.navBtn(tab===key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      <main style={s.main}>
        {error && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:'8px', padding:'12px', marginBottom:'16px', color:'#dc2626' }}>
          {error} <button onClick={() => setError(null)} style={{ float:'right', background:'none', border:'none', cursor:'pointer' }}>✕</button>
        </div>}

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (<>
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Inventory Overview</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'12px', marginBottom:'24px' }}>
              <StatBox label="Total Items" value={total} />
              <StatBox label="Total Released" value={released.length} color="#3b82f6" sub={total ? Math.round(released.length/total*100)+'% of inventory' : ''} />
              <StatBox label="Money Recovered" value={'$'+moneyRecovered.toLocaleString()} color="#22c55e" />
              <StatBox label="Left on Table" value={'$'+moneyLeftOnTable.toLocaleString()} color="#f59e0b" sub="orig price – sell price" />
              <StatBox label="Avg Attachment" value={avgEA} color="#a855f7" sub="of released items" />
              <StatBox label="Poshmark Queue" value={poshmarkQueue.length} color="#ec4899" />
            </div>

            <h3 style={{ ...s.sectionTitle, marginBottom:'12px' }}>Exit Paths</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
              {[['Sold',sold.length,'#3b82f6'],['Donated',donated.length,'#a855f7'],['Tossed',tossed.length,'#ef4444']].map(([label,count,color]) => (
                <div key={label} style={{ background:color+'10', border:`1px solid ${color}30`, borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:'28px', fontWeight:700, color }}>{count}</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color }}>{label}</div>
                  <div style={{ fontSize:'12px', color:'#94a3b8' }}>{released.length ? Math.round(count/released.length*100) : 0}% of released</div>
                </div>
              ))}
            </div>

            <h3 style={{ ...s.sectionTitle, marginBottom:'12px' }}>Decision Breakdown</h3>
            <div style={s.grid4}>
              {decisionStats.map(st => (
                <div key={st.label} style={{ background:st.color+'12', border:`1px solid ${st.color}30`, borderRadius:'10px', padding:'14px' }}>
                  <div style={{ fontSize:'24px', fontWeight:700, color:st.color }}>{st.count}</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:st.color }}>{st.label}</div>
                  <div style={{ marginTop:'8px', background:'#e2e8f0', borderRadius:'4px', height:'4px' }}>
                    <div style={{ background:st.color, width:st.pct+'%', height:'4px', borderRadius:'4px' }} />
                  </div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px' }}>{st.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Items Released by Month</h2>
              {monthData.length === 0 ? (
                <div style={{ color:'#94a3b8', fontSize:'13px', padding:'20px 0' }}>No resolved items yet. Set a "date resolved" when items leave your home.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {monthData.map(([month, count]) => (
                    <div key={month} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'60px', fontSize:'12px', color:'#64748b', flexShrink:0 }}>{month}</div>
                      <div style={{ flex:1, background:'#f1f5f9', borderRadius:'4px', height:'20px', position:'relative' }}>
                        <div style={{ background:'#3b82f6', width:Math.round(count/maxMonthCount*100)+'%', height:'100%', borderRadius:'4px', transition:'width 0.3s' }} />
                      </div>
                      <div style={{ width:'24px', fontSize:'12px', fontWeight:600, color:'#1e293b', textAlign:'right' }}>{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Most Released Category</h2>
              {mostReleasedCat ? (
                <div>
                  <div style={{ fontSize:'32px', fontWeight:700, color:'#3b82f6', marginBottom:'4px' }}>{mostReleasedCat[1]}</div>
                  <div style={{ fontSize:'16px', fontWeight:600 }}>{mostReleasedCat[0]}</div>
                  <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>items released</div>
                  <div style={{ marginTop:'20px' }}>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#64748b', marginBottom:'10px' }}>All categories:</div>
                    {Object.entries(catReleasedCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([cat,cnt]) => (
                      <div key={cat} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid #f1f5f9' }}>
                        <span>{cat}</span><span style={{ fontWeight:600 }}>{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div style={{ color:'#94a3b8', fontSize:'13px', padding:'20px 0' }}>No released items yet.</div>}
            </div>
          </div>
        </>)}

        {/* ── ADD ITEM ── */}
        {tab === 'add' && (
          <div style={s.card}>
            <h2 style={{ ...s.sectionTitle, marginBottom:'20px' }}>Add New Item</h2>
            <form onSubmit={addItem}>

              {/* Required fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={s.label}>Item Name <span style={{ color:'#ef4444' }}>*</span></label>
                  <input style={s.input} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Blue cashmere sweater" required />
                </div>
                <div>
                  <label style={s.label}>Category <span style={{ color:'#ef4444' }}>*</span></label>
                  <select style={s.select} value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Decision <span style={{ color:'#ef4444' }}>*</span></label>
                  <select style={s.select} value={form.decision} onChange={e => setForm({...form, decision:e.target.value})}>
                    {DECISIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                <div>
                  <label style={s.label}>Location <span style={{ color:'#94a3b8', fontWeight:400 }}>(optional)</span></label>
                  <input style={s.input} value={form.location} onChange={e => setForm({...form, location:e.target.value})} placeholder="e.g. Bedroom closet" />
                </div>
                <div>
                  <label style={s.label}>How Acquired <span style={{ color:'#94a3b8', fontWeight:400 }}>(optional)</span></label>
                  <select style={s.select} value={form.how_acquired} onChange={e => setForm({...form, how_acquired:e.target.value})}>
                    <option value="">— select —</option>
                    {HOW_ACQUIRED.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Date Acquired <span style={{ color:'#94a3b8', fontWeight:400 }}>(MM/YYYY, optional)</span></label>
                  <input style={s.input} value={form.date_acquired} onChange={e => setForm({...form, date_acquired:e.target.value})} placeholder="e.g. 03/2022" />
                </div>
                {shouldHaveDateResolved(form.decision) && (
                  <div>
                    <label style={s.label}>Date Left Home <span style={{ color:'#94a3b8', fontWeight:400 }}>(optional)</span></label>
                    <input style={s.input} type="date" value={form.date_resolved} onChange={e => setForm({...form, date_resolved:e.target.value})} />
                  </div>
                )}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={s.label}>Emotional Attachment: {form.emotional_attachment}/5 <span style={{ color:'#94a3b8', fontWeight:400 }}>(optional)</span></label>
                  <input type="range" min="1" max="5" value={form.emotional_attachment} onChange={e => setForm({...form, emotional_attachment:e.target.value})} style={{ width:'100%', accentColor:'#a855f7' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#94a3b8' }}>
                    <span>1 — Don't care</span><span>5 — Very attached</span>
                  </div>
                </div>
              </div>

              {/* Poshmark toggle */}
              <div style={{ marginBottom:'16px' }}>
                <button
                  type="button"
                  onClick={() => setForm({...form, poshmark: !form.poshmark})}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', border:`2px solid ${form.poshmark ? '#ec4899' : '#e2e8f0'}`, borderRadius:'10px', background: form.poshmark ? '#fdf2f8' : 'white', cursor:'pointer', width:'100%', textAlign:'left' }}
                >
                  <div style={{ width:'36px', height:'20px', borderRadius:'999px', background: form.poshmark ? '#ec4899' : '#cbd5e1', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:'2px', left: form.poshmark ? '18px' : '2px', width:'16px', height:'16px', borderRadius:'50%', background:'white', transition:'left 0.2s' }} />
                  </div>
                  <span style={{ fontWeight:600, fontSize:'14px', color: form.poshmark ? '#ec4899' : '#64748b' }}>List on Poshmark?</span>
                  {form.poshmark && <span style={{ fontSize:'12px', color:'#ec4899', marginLeft:'auto' }}>Fields below will appear in your listing</span>}
                </button>
              </div>

              {/* Poshmark fields — only shown when toggled on */}
              {form.poshmark && (
                <div style={{ background:'#fdf2f8', border:'1px solid #fbcfe8', borderRadius:'10px', padding:'16px', marginBottom:'16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <div>
                    <label style={s.label}>Brand</label>
                    <input style={s.input} value={form.brand} onChange={e => setForm({...form, brand:e.target.value})} placeholder="e.g. Zara, Nike" />
                  </div>
                  <div>
                    <label style={s.label}>Condition</label>
                    <select style={s.select} value={form.condition} onChange={e => setForm({...form, condition:e.target.value})}>
                      <option value="">— select —</option>
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Size</label>
                    <input style={s.input} value={form.size} onChange={e => setForm({...form, size:e.target.value})} placeholder="e.g. M, 8.5, 12x6 in" />
                  </div>
                  <div>
                    <label style={s.label}>Color</label>
                    <input style={s.input} value={form.color} onChange={e => setForm({...form, color:e.target.value})} placeholder="e.g. Navy blue" />
                  </div>
                  <div>
                    <label style={s.label}>Original Price Paid ($)</label>
                    <input style={s.input} type="number" min="0" step="0.01" value={form.original_price} onChange={e => setForm({...form, original_price:e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={s.label}>Asking Price ($)</label>
                    <input style={s.input} type="number" min="0" step="0.01" value={form.asking_price} onChange={e => setForm({...form, asking_price:e.target.value})} placeholder="0.00" />
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={s.label}>Flaws or Notes</label>
                    <input style={s.input} value={form.flaws} onChange={e => setForm({...form, flaws:e.target.value})} placeholder="Any flaws to mention in the listing?" />
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:'12px' }}>
                <button type="submit" style={s.btn()} disabled={loading}>{loading ? 'Adding...' : 'Add Item'}</button>
                <button type="button" style={s.btn('#94a3b8')} onClick={() => setForm(emptyForm)}>Clear</button>
              </div>
            </form>
          </div>
        )}

        {/* ── ALL ITEMS ── */}
        {tab === 'items' && (
          <div style={s.card}>
            <div style={{ display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
              <h2 style={{ margin:0, fontSize:'16px', fontWeight:600, marginRight:'auto' }}>All Items ({filteredItems.length})</h2>
              <select style={{ ...s.select, width:'auto' }} value={filterDecision} onChange={e => setFilterDecision(e.target.value)}>
                <option value="All">All Decisions</option>
                {DECISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select style={{ ...s.select, width:'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>No items found.</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead>
                    <tr>{['Name','Category','Brand','Size','Color','Condition','Decision','Poshmark','EA',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (<>
                      <tr key={item.id} style={{ cursor:'pointer' }} onClick={() => setExpandedItem(expandedItem===item.id ? null : item.id)}>
                        <td style={s.td}><strong>{item.name}</strong>{item.flaws_notes && <span style={{ marginLeft:'6px', fontSize:'11px', color:'#94a3b8' }}>📝</span>}</td>
                        <td style={s.td}><span style={{ fontSize:'12px', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px' }}>{item.category}</span></td>
                        <td style={s.td}>{item.brand || '—'}</td>
                        <td style={s.td}>{item.size || '—'}</td>
                        <td style={s.td}>{item.color || '—'}</td>
                        <td style={s.td}>{item.condition || '—'}</td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <select value={item.decision} onChange={e => updateField(item.id,'decision',e.target.value)} style={{ padding:'4px 8px', border:`1px solid ${DECISION_COLORS[item.decision]}`, borderRadius:'6px', background:DECISION_COLORS[item.decision]+'15', color:DECISION_COLORS[item.decision], fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                            {DECISIONS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={!!item.poshmark} onChange={e => updateField(item.id,'poshmark',e.target.checked)} style={{ cursor:'pointer', width:'16px', height:'16px' }} />
                        </td>
                        <td style={s.td}>
                          {item.emotional_attachment ? '⭐'.repeat(item.emotional_attachment) : '—'}
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <button onClick={() => deleteItem(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:'15px' }}>🗑️</button>
                        </td>
                      </tr>
                      {expandedItem === item.id && (
                        <tr key={item.id+'-exp'}>
                          <td colSpan={10} style={{ padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px', fontSize:'13px' }}>
                              {item.original_price && <div><span style={{ color:'#64748b' }}>Original price:</span> <strong>${parseFloat(item.original_price).toFixed(2)}</strong></div>}
                              {item.estimated_value && <div><span style={{ color:'#64748b' }}>Est. value:</span> <strong>${parseFloat(item.estimated_value).toFixed(2)}</strong></div>}
                              {item.asking_price && <div><span style={{ color:'#64748b' }}>Asking price:</span> <strong>${parseFloat(item.asking_price).toFixed(2)}</strong></div>}
                              {item.how_acquired && <div><span style={{ color:'#64748b' }}>Acquired:</span> <strong>{item.how_acquired}</strong></div>}
                              {item.date_acquired && <div><span style={{ color:'#64748b' }}>Date acquired:</span> <strong>{item.date_acquired}</strong></div>}
                              {item.location && <div><span style={{ color:'#64748b' }}>Location:</span> <strong>{item.location}</strong></div>}
                              {item.date_resolved && <div><span style={{ color:'#64748b' }}>Date resolved:</span> <strong>{item.date_resolved}</strong></div>}
                              {item.flaws && <div style={{ gridColumn:'1/-1' }}><span style={{ color:'#64748b' }}>Flaws:</span> <strong>{item.flaws}</strong></div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── POSHMARK QUEUE ── */}
        {tab === 'poshmark' && (
          <div style={s.card}>
            <h2 style={{ ...s.sectionTitle, marginBottom:'4px' }}>Poshmark Queue</h2>
            <p style={{ margin:'0 0 20px', fontSize:'13px', color:'#64748b' }}>Items flagged for Poshmark with decision = Sell ({poshmarkQueue.length} items)</p>
            {poshmarkQueue.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>👗</div>
                <div>No items in Poshmark queue.</div>
                <div style={{ fontSize:'13px', marginTop:'8px' }}>Mark items as "Sell" and check the Poshmark flag.</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'16px' }}>
                {poshmarkQueue.map(item => (
                  <div key={item.id} style={{ border:'1px solid #e2e8f0', borderRadius:'10px', padding:'16px', background:'#fdf2f8' }}>
                    <div style={{ fontWeight:600, fontSize:'15px', marginBottom:'4px' }}>{item.brand ? `${item.brand} ` : ''}{item.name}</div>
                    <div style={{ fontSize:'13px', color:'#64748b', display:'flex', flexDirection:'column', gap:'3px', marginBottom:'12px' }}>
                      <span>📦 {item.category}{item.condition ? ` · ${item.condition}` : ''}</span>
                      {item.size && <span>📐 {item.size}</span>}
                      {item.color && <span>🎨 {item.color}</span>}
                      {item.asking_price && <span style={{ color:'#ec4899', fontWeight:600 }}>💰 Asking ${parseFloat(item.asking_price).toFixed(2)}</span>}
                      {item.original_price && <span style={{ color:'#94a3b8' }}>Orig. ${parseFloat(item.original_price).toFixed(2)}</span>}
                      {item.flaws && <span>📝 {item.flaws}</span>}
                    </div>
                    <button onClick={() => generateListing(item)} style={{ ...s.btn('#ec4899'), width:'100%' }}>✨ Generate Listing</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* LISTING MODAL */}
      {listingModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' }}>
          <div style={{ background:'white', borderRadius:'16px', padding:'24px', maxWidth:'500px', width:'100%', maxHeight:'80vh', overflow:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h3 style={{ margin:0, fontSize:'16px', fontWeight:600 }}>Poshmark Listing</h3>
              <button onClick={() => setListingModal(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:'#64748b' }}>✕</button>
            </div>
            <textarea value={listingModal.text} readOnly style={{ width:'100%', height:'240px', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'13px', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', background:'#f8fafc' }} />
            <div style={{ display:'flex', gap:'12px', marginTop:'16px' }}>
              <button onClick={() => navigator.clipboard.writeText(listingModal.text)} style={s.btn('#ec4899')}>📋 Copy</button>
              <button onClick={() => setListingModal(null)} style={s.btn('#94a3b8')}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
