import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const DECISIONS = ['Keep', 'Sell', 'Donate', 'Toss', 'Undecided']
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor']
const CATEGORIES = ['Home', 'Digital']

const DECISION_COLORS = {
  Keep: '#22c55e',
  Sell: '#3b82f6',
  Donate: '#a855f7',
  Toss: '#ef4444',
  Undecided: '#94a3b8',
}

const emptyForm = {
  name: '',
  category: 'Home',
  location: '',
  estimated_value: '',
  condition: 'Good',
  decision: 'Undecided',
  poshmark: false,
}

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [filterDecision, setFilterDecision] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [listingModal, setListingModal] = useState(null) // { item, text }
  const [error, setError] = useState(null)

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
    }
    const { error } = await supabase.from('items').insert([payload])
    if (error) { setError(error.message) }
    else { setForm(emptyForm); await fetchItems() }
    setLoading(false)
  }

  async function deleteItem(id) {
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function updateField(id, field, value) {
    await supabase.from('items').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function generateListing(item) {
    const text = `🛍️ ${item.name}

Category: ${item.category}
Condition: ${item.condition}
${item.location ? `Originally from: ${item.location}` : ''}
${item.estimated_value ? `Estimated Value: $${item.estimated_value}` : ''}

${item.condition === 'Excellent' ? 'Like new! Barely used.' : item.condition === 'Good' ? 'Gently used with minimal wear.' : item.condition === 'Fair' ? 'Shows some signs of use but fully functional.' : 'As-is condition, priced accordingly.'}

✨ Message me with any questions! Bundle discounts available. 💕`
    setListingModal({ item, text })
  }

  const filteredItems = items.filter(i => {
    if (filterDecision !== 'All' && i.decision !== filterDecision) return false
    if (filterCategory !== 'All' && i.category !== filterCategory) return false
    return true
  })

  const poshmarkQueue = items.filter(i => i.poshmark && i.decision === 'Sell')

  // Stats
  const total = items.length
  const stats = DECISIONS.map(d => ({
    label: d,
    count: items.filter(i => i.decision === d).length,
    pct: total ? Math.round((items.filter(i => i.decision === d).length / total) * 100) : 0,
    color: DECISION_COLORS[d],
  }))

  const styles = {
    app: { fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#f8fafc', color: '#1e293b' },
    header: { background: '#1e293b', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' },
    headerTitle: { margin: 0, fontSize: '20px', fontWeight: 700 },
    headerSub: { margin: 0, fontSize: '13px', color: '#94a3b8' },
    nav: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', gap: '4px' },
    navBtn: (active) => ({ padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? '#3b82f6' : '#64748b', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.15s' }),
    main: { maxWidth: '1100px', margin: '0 auto', padding: '24px' },
    card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '4px' },
    input: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
    select: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white' },
    btn: (color='#3b82f6') => ({ padding: '8px 16px', background: color, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
    statCard: (color) => ({ background: color + '15', border: `1px solid ${color}30`, borderRadius: '10px', padding: '16px', textAlign: 'center' }),
    badge: (color) => ({ display: 'inline-block', padding: '2px 8px', background: color + '20', color: color, borderRadius: '999px', fontSize: '12px', fontWeight: 600 }),
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
    td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>YOL — Your Own Life</h1>
          <p style={styles.headerSub}>Home & Digital Life Inventory</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>{total} items tracked</div>
      </header>

      <nav style={styles.nav}>
        {[['dashboard','📊 Dashboard'],['items','📦 All Items'],['add','➕ Add Item'],['poshmark','👗 Poshmark Queue']].map(([key,label]) => (
          <button key={key} style={styles.navBtn(tab===key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      <main style={styles.main}>
        {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626' }}>Error: {error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Overview</h2>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>{total}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Total Items</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6' }}>{poshmarkQueue.length}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Poshmark Queue</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#22c55e' }}>${items.reduce((s,i) => s+(i.estimated_value||0), 0).toLocaleString()}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Est. Total Value</div>
                </div>
              </div>
              <div style={styles.grid}>
                {stats.map(s => (
                  <div key={s.label} style={styles.statCard(s.color)}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{s.pct}% of total</div>
                    <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '4px', height: '4px' }}>
                      <div style={{ background: s.color, width: s.pct+'%', height: '4px', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.card}>
              <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>By Category</h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                {CATEGORIES.map(c => {
                  const count = items.filter(i => i.category === c).length
                  const pct = total ? Math.round(count/total*100) : 0
                  return (
                    <div key={c} style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700 }}>{count}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>{c}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>{pct}% of total</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ADD ITEM */}
        {tab === 'add' && (
          <div style={styles.card}>
            <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>Add New Item</h2>
            <form onSubmit={addItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={styles.label}>Item Name *</label>
                  <input style={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Blue cashmere sweater" required />
                </div>
                <div>
                  <label style={styles.label}>Category</label>
                  <select style={styles.select} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Bedroom closet" />
                </div>
                <div>
                  <label style={styles.label}>Estimated Value ($)</label>
                  <input style={styles.input} type="number" min="0" step="0.01" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <label style={styles.label}>Condition</label>
                  <select style={styles.select} value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Decision</label>
                  <select style={styles.select} value={form.decision} onChange={e => setForm({...form, decision: e.target.value})}>
                    {DECISIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input type="checkbox" id="poshmark" checked={form.poshmark} onChange={e => setForm({...form, poshmark: e.target.checked})} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="poshmark" style={{ fontSize: '14px', cursor: 'pointer' }}>Add to Poshmark Queue</label>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button type="submit" style={styles.btn()} disabled={loading}>{loading ? 'Adding...' : 'Add Item'}</button>
                <button type="button" style={{ ...styles.btn('#94a3b8') }} onClick={() => setForm(emptyForm)}>Clear</button>
              </div>
            </form>
          </div>
        )}

        {/* ALL ITEMS */}
        {tab === 'items' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginRight: 'auto' }}>All Items ({filteredItems.length})</h2>
              <div>
                <select style={{ ...styles.select, width: 'auto' }} value={filterDecision} onChange={e => setFilterDecision(e.target.value)}>
                  <option value="All">All Decisions</option>
                  {DECISIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <select style={{ ...styles.select, width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No items found. Add your first item!</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Name','Category','Location','Value','Condition','Decision','Poshmark',''].map(h => <th key={h} style={styles.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={{ transition: 'background 0.1s' }}>
                        <td style={styles.td}><strong>{item.name}</strong></td>
                        <td style={styles.td}><span style={styles.badge(item.category === 'Home' ? '#f59e0b' : '#6366f1')}>{item.category}</span></td>
                        <td style={styles.td}>{item.location || '—'}</td>
                        <td style={styles.td}>{item.estimated_value ? '$'+parseFloat(item.estimated_value).toFixed(2) : '—'}</td>
                        <td style={styles.td}>{item.condition || '—'}</td>
                        <td style={styles.td}>
                          <select value={item.decision} onChange={e => updateField(item.id, 'decision', e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${DECISION_COLORS[item.decision]}`, borderRadius: '6px', background: DECISION_COLORS[item.decision]+'15', color: DECISION_COLORS[item.decision], fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                            {DECISIONS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input type="checkbox" checked={!!item.poshmark} onChange={e => updateField(item.id, 'poshmark', e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }} title="Delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* POSHMARK QUEUE */}
        {tab === 'poshmark' && (
          <div style={styles.card}>
            <h2 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Poshmark Queue</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>Items marked for Poshmark with decision = Sell ({poshmarkQueue.length} items)</p>
            {poshmarkQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>👗</div>
                <div>No items in Poshmark queue yet.</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Add items with decision "Sell" and check the Poshmark flag.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {poshmarkQueue.map(item => (
                  <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>📦 {item.category} · {item.condition}</span>
                      {item.location && <span>📍 {item.location}</span>}
                      {item.estimated_value && <span>💰 Est. ${parseFloat(item.estimated_value).toFixed(2)}</span>}
                    </div>
                    <button onClick={() => generateListing(item)} style={{ ...styles.btn('#ec4899'), marginTop: '12px', width: '100%' }}>✨ Generate Listing</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* LISTING MODAL */}
      {listingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Poshmark Listing — {listingModal.item.name}</h3>
              <button onClick={() => setListingModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>✕</button>
            </div>
            <textarea value={listingModal.text} readOnly style={{ width: '100%', height: '220px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', background: '#f8fafc' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => { navigator.clipboard.writeText(listingModal.text); }} style={styles.btn('#ec4899')}>📋 Copy to Clipboard</button>
              <button onClick={() => setListingModal(null)} style={styles.btn('#94a3b8')}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
