import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const CATEGORIES = [
  'Bedroom', 'Clothes', 'Shoes', 'Purses', 'Makeup', 'Skincare',
  'Hair Products', 'Hair Tools', 'Body Hygiene', 'Home Cleaning',
  'Tools', 'Canned Food', 'Seasonings', 'Crafts', 'Tech',
  'House Misc', 'Clothes Accessories', 'Kitchen', 'Cooking Oils', 'Kitchen Tools',
  'Garage', 'Car & Auto', 'Sports & Outdoor', 'Garden & Outdoor Living',
  'Stationery', 'Wellness & Supplements', 'Books', 'Office Supplies',
]
const DECISIONS = ['Keep', 'Sell', 'Donate', 'Toss', 'Needs Repair', 'Undecided']
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Fair', 'Poor']
const HOW_ACQUIRED = ['Bought', 'Gifted', 'Inherited', 'Impulse buy']

const DECISION_COLORS = {
  Keep:         '#4ade80',   // mint green
  Sell:         '#fb7185',   // coral
  Donate:       '#c084fc',   // lavender
  Toss:         '#fbbf24',   // warm yellow
  'Needs Repair': '#60a5fa', // sky blue
  Undecided:    '#f9a8d4',   // blush pink
}

const DECISION_BG = {
  Keep:         '#f0fdf4',
  Sell:         '#fff1f2',
  Donate:       '#faf5ff',
  Toss:         '#fffbeb',
  'Needs Repair': '#eff6ff',
  Undecided:    '#fdf2f8',
}

const PALETTE = {
  coral:    '#fb7185',
  blush:    '#f9a8d4',
  lavender: '#c084fc',
  mint:     '#4ade80',
  yellow:   '#fbbf24',
  sky:      '#60a5fa',
  cream:    '#fdf8f0',
  white:    '#ffffff',
  text:     '#3d2c2c',
  muted:    '#9d8080',
  border:   '#f3e8e8',
}

const emptyForm = {
  name: '', category: 'Clothes', location: '', estimated_value: '',
  decision: 'Undecided', poshmark: false,
  how_acquired: '', date_acquired: '', emotional_attachment: 3,
  original_price: '', date_resolved: '',
  brand: '', size: '', color: '', condition: '',
  asking_price: '', flaws: '',
}

const DEBT = [
  { name: 'Aspire', balance: 703,     apr: 36.00 },
  { name: 'Prosper', balance: 4890,   apr: 30.49 },
  { name: 'Citi',    balance: 2103,   apr: 29.49 },
  { name: 'Capital One', balance: 413, apr: 28.99 },
]
const DEBT_TOTAL = DEBT.reduce((s, d) => s + d.balance, 0)

export default function App() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('dashboard')
  const [filterDecision, setFilterDecision] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [listingModal, setListingModal] = useState(null)
  const [error, setError] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const [intention, setIntention] = useState('')
  const [intentionSaved, setIntentionSaved] = useState(false)

  useEffect(() => { fetchItems(); fetchIntention() }, [])

  async function fetchItems() {
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    if (error) { setError(error.message); return }
    setItems(data || [])
  }

  async function fetchIntention() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'monthly_intention').single()
    if (data) setIntention(data.value || '')
  }

  async function saveIntention() {
    await supabase.from('settings').upsert({ key: 'monthly_intention', value: intention }, { onConflict: 'key' })
    setIntentionSaved(true)
    setTimeout(() => setIntentionSaved(false), 2000)
  }

  function shouldHaveDateResolved(decision) {
    return ['Sell', 'Donate', 'Toss'].includes(decision)
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
      emotional_attachment: form.emotional_attachment ? parseInt(form.emotional_attachment) : null,
      date_resolved: shouldHaveDateResolved(form.decision) && form.date_resolved ? form.date_resolved : null,
      brand: form.poshmark ? form.brand : null,
      size: form.poshmark ? form.size : null,
      color: form.poshmark ? form.color : null,
      condition: form.poshmark ? (form.condition || null) : null,
      flaws: form.poshmark ? form.flaws : null,
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
    const updates = { [field]: value, updated_at: new Date().toISOString() }
    if (field === 'decision' && shouldHaveDateResolved(value)) {
      const item = items.find(i => i.id === id)
      if (!item?.date_resolved) updates.date_resolved = new Date().toISOString().split('T')[0]
    }
    await supabase.from('items').update(updates).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  function generateListing(item) {
    const price = item.asking_price
      ? `$${parseFloat(item.asking_price).toFixed(2)}`
      : item.estimated_value ? `$${parseFloat(item.estimated_value).toFixed(2)}` : 'Price TBD'
    const conditionLine = item.condition === 'New with tags' ? 'Brand new with tags! Never worn/used.'
      : item.condition === 'Like new' ? 'Like new! Barely used, no flaws.'
      : item.condition === 'Good' ? 'Gently used with minimal wear.'
      : item.condition === 'Fair' ? 'Shows some signs of use but fully functional.'
      : item.condition ? 'As-is condition, priced accordingly.' : ''
    const text = `🛍️ ${item.brand ? item.brand + ' ' : ''}${item.name}

Condition: ${item.condition || 'See description'}
${item.size ? `Size: ${item.size}` : ''}
${item.color ? `Color: ${item.color}` : ''}
${item.category ? `Category: ${item.category}` : ''}
${item.flaws ? `\nNotes: ${item.flaws}` : ''}

${conditionLine}

Asking: ${price}

✨ Message me with any questions! Bundle discounts available. 💕`
    setListingModal({ item, text })
  }

  // --- Derived stats ---
  const total = items.length
  const released = items.filter(i => ['Sell', 'Donate', 'Toss'].includes(i.decision))
  const sold     = items.filter(i => i.decision === 'Sell')
  const donated  = items.filter(i => i.decision === 'Donate')
  const tossed   = items.filter(i => i.decision === 'Toss')
  const poshmarkQueue = items.filter(i => i.poshmark && i.decision === 'Sell')

  const goalPct = total > 0 ? Math.min(100, Math.round(released.length / total * 100)) : 0
  const GOAL = 70

  const moneyRecovered = sold.reduce((s, i) => s + (i.asking_price || i.estimated_value || 0), 0)
  const moneyLeftOnTable = sold.reduce((s, i) => {
    const orig = i.original_price || 0
    const sell = i.asking_price || i.estimated_value || 0
    return s + Math.max(0, orig - sell)
  }, 0)

  const decisionStats = DECISIONS.map(d => ({
    label: d,
    count: items.filter(i => i.decision === d).length,
    pct: total ? Math.round(items.filter(i => i.decision === d).length / total * 100) : 0,
    color: DECISION_COLORS[d],
    bg: DECISION_BG[d],
  }))

  const catReleasedCounts = {}
  released.forEach(i => { catReleasedCounts[i.category] = (catReleasedCounts[i.category] || 0) + 1 })
  const mostReleasedCat = Object.entries(catReleasedCounts).sort((a, b) => b[1] - a[1])[0]

  const monthCounts = {}
  released.forEach(i => {
    if (i.date_resolved) {
      const key = i.date_resolved.slice(0, 7)
      monthCounts[key] = (monthCounts[key] || 0) + 1
    }
  })
  const monthData = Object.entries(monthCounts).sort()
  const maxMonthCount = Math.max(...monthData.map(([, c]) => c), 1)

  const releasedWithEA = released.filter(i => i.emotional_attachment)
  const avgEA = releasedWithEA.length
    ? (releasedWithEA.reduce((s, i) => s + i.emotional_attachment, 0) / releasedWithEA.length).toFixed(1)
    : '—'

  // Filtered items
  const filteredItems = items.filter(i => {
    if (filterDecision !== 'All' && i.decision !== filterDecision) return false
    if (filterCategory !== 'All' && i.category !== filterCategory) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !i.name?.toLowerCase().includes(q) &&
        !i.category?.toLowerCase().includes(q) &&
        !i.location?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // --- Styles ---
  const s = {
    app: {
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: '100vh',
      background: `linear-gradient(135deg, #fff5f7 0%, #fdf4ff 50%, #f0fff4 100%)`,
      color: PALETTE.text,
    },
    header: {
      background: 'linear-gradient(135deg, #fb7185 0%, #c084fc 50%, #60a5fa 100%)',
      color: 'white',
      padding: '20px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    nav: {
      background: 'white',
      borderBottom: `2px solid ${PALETTE.border}`,
      padding: '0 24px',
      display: 'flex',
      gap: '2px',
      overflowX: 'auto',
    },
    navBtn: (active) => ({
      padding: '14px 18px',
      border: 'none',
      background: active ? `linear-gradient(135deg, #fff1f2, #fdf4ff)` : 'none',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: active ? 700 : 500,
      color: active ? PALETTE.coral : PALETTE.muted,
      borderBottom: active ? `3px solid ${PALETTE.coral}` : '3px solid transparent',
      whiteSpace: 'nowrap',
      borderRadius: active ? '8px 8px 0 0' : '0',
      transition: 'all 0.15s',
    }),
    main: { maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' },
    card: {
      background: 'white',
      border: `1px solid ${PALETTE.border}`,
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 12px rgba(251, 113, 133, 0.06)',
    },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: PALETTE.muted, marginBottom: '5px' },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: `1.5px solid ${PALETTE.border}`,
      borderRadius: '12px',
      fontSize: '14px',
      boxSizing: 'border-box',
      background: '#fffbfb',
      color: PALETTE.text,
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: `1.5px solid ${PALETTE.border}`,
      borderRadius: '12px',
      fontSize: '14px',
      boxSizing: 'border-box',
      background: '#fffbfb',
      color: PALETTE.text,
    },
    btn: (bg = PALETTE.coral, text = 'white') => ({
      padding: '10px 20px',
      background: bg,
      color: text,
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      boxShadow: `0 2px 8px ${bg}40`,
      transition: 'transform 0.1s',
    }),
    sectionTitle: { fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: PALETTE.text },
    th: {
      padding: '10px 12px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: 700,
      color: PALETTE.muted,
      borderBottom: `2px solid ${PALETTE.border}`,
      background: '#fffbfb',
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    td: { padding: '10px 12px', borderBottom: `1px solid ${PALETTE.border}`, verticalAlign: 'middle', fontSize: '13px' },
  }

  const DecisionPill = ({ decision }) => (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      background: DECISION_BG[decision] || '#f8fafc',
      color: DECISION_COLORS[decision] || '#94a3b8',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 700,
      border: `1px solid ${DECISION_COLORS[decision] || '#e2e8f0'}40`,
    }}>{decision}</span>
  )

  const StatBox = ({ label, value, color = PALETTE.text, sub, emoji }) => (
    <div style={{
      background: 'white',
      border: `1.5px solid ${PALETTE.border}`,
      borderRadius: '16px',
      padding: '18px',
      boxShadow: '0 2px 8px rgba(251,113,133,0.05)',
    }}>
      {emoji && <div style={{ fontSize: '24px', marginBottom: '6px' }}>{emoji}</div>}
      <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: PALETTE.muted, marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#c4a5a5', marginTop: '3px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={s.app}>
      {/* HEADER */}
      <header style={s.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            🌸 Year of Less
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>
            Your joyful declutter companion
          </p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>items tracked</div>
        </div>
      </header>

      {/* NAV */}
      <nav style={s.nav}>
        {[
          ['dashboard', '🌸 Dashboard'],
          ['items', '📦 All Items'],
          ['add', '✨ Add Item'],
          ['poshmark', '👗 Poshmark'],
          ['rules', '💸 My Rules & Money'],
        ].map(([key, label]) => (
          <button key={key} style={s.navBtn(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      <main style={s.main}>
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#e11d48', fontSize: '14px' }}>
            ⚠️ {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48' }}>✕</button>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (<>

          {/* Monthly Intention */}
          <div style={{ ...s.card, background: 'linear-gradient(135deg, #fdf2f8, #faf5ff)', border: '1.5px solid #f3e8f8' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: PALETTE.lavender, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              🌷 Monthly Intention
            </div>
            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="What's your intention this month? e.g. April — use up all pantry items before buying new food"
              style={{ ...s.input, height: '72px', resize: 'none', fontSize: '14px', fontStyle: intention ? 'normal' : 'italic' }}
            />
            <button onClick={saveIntention} style={{ ...s.btn(PALETTE.lavender), marginTop: '10px', fontSize: '13px', padding: '8px 16px' }}>
              {intentionSaved ? '✓ Saved!' : 'Save Intention'}
            </button>
          </div>

          {/* 70% Goal Tracker */}
          <div style={{ ...s.card, background: 'linear-gradient(135deg, #fff7ed, #fdf2f8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: PALETTE.coral, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎯 70% Declutter Goal</div>
                <div style={{ fontSize: '13px', color: PALETTE.muted, marginTop: '2px' }}>{released.length} of {total} items released — {goalPct}% toward goal</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: goalPct >= GOAL ? PALETTE.mint : PALETTE.coral }}>
                {goalPct}%
              </div>
            </div>
            <div style={{ background: PALETTE.border, borderRadius: '999px', height: '14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                background: goalPct >= GOAL
                  ? `linear-gradient(90deg, ${PALETTE.mint}, #22d3ee)`
                  : `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.lavender})`,
                width: `${goalPct}%`,
                height: '100%',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }} />
              {/* 70% marker */}
              <div style={{ position: 'absolute', top: 0, left: '70%', width: '2px', height: '100%', background: '#3d2c2c', opacity: 0.3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: PALETTE.muted, marginTop: '6px' }}>
              <span>0%</span>
              <span style={{ color: goalPct >= GOAL ? PALETTE.mint : PALETTE.coral, fontWeight: 700 }}>
                {goalPct >= GOAL ? '🎉 Goal reached!' : `${GOAL - goalPct}% to go`}
              </span>
              <span>70% goal</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <StatBox emoji="📦" label="Total Items" value={total} />
            <StatBox emoji="🚀" label="Released" value={released.length} color={PALETTE.coral} sub={total ? goalPct + '% of inventory' : ''} />
            <StatBox emoji="💰" label="Recovered" value={'$' + moneyRecovered.toLocaleString()} color={PALETTE.mint} />
            <StatBox emoji="💸" label="Left on Table" value={'$' + moneyLeftOnTable.toLocaleString()} color={PALETTE.yellow} sub="orig – sell" />
            <StatBox emoji="💜" label="Avg Attachment" value={avgEA} color={PALETTE.lavender} sub="of released" />
            <StatBox emoji="👗" label="Poshmark" value={poshmarkQueue.length} color={PALETTE.coral} sub="in queue" />
          </div>

          {/* Exit paths */}
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Exit Paths 🚪</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[['Sold 💙', sold.length, PALETTE.coral], ['Donated 💜', donated.length, PALETTE.lavender], ['Tossed 💛', tossed.length, PALETTE.yellow]].map(([label, count, color]) => (
                <div key={label} style={{ background: color + '15', border: `1.5px solid ${color}40`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color }}>{label}</div>
                  <div style={{ fontSize: '12px', color: PALETTE.muted, marginTop: '2px' }}>
                    {released.length ? Math.round(count / released.length * 100) : 0}% of released
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ ...s.sectionTitle, fontSize: '14px' }}>All Decisions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {decisionStats.map(st => (
                <div key={st.label} style={{ background: st.bg, border: `1.5px solid ${st.color}30`, borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: st.color }}>{st.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: st.color }}>{st.label}</div>
                  <div style={{ marginTop: '8px', background: '#f0e8e8', borderRadius: '999px', height: '5px' }}>
                    <div style={{ background: st.color, width: st.pct + '%', height: '5px', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: PALETTE.muted, marginTop: '4px' }}>{st.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Released by Month 📅</h2>
              {monthData.length === 0 ? (
                <div style={{ color: PALETTE.muted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                  🌱 No resolved items yet!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {monthData.map(([month, count]) => (
                    <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '64px', fontSize: '12px', color: PALETTE.muted, flexShrink: 0 }}>{month}</div>
                      <div style={{ flex: 1, background: PALETTE.border, borderRadius: '999px', height: '18px' }}>
                        <div style={{ background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.lavender})`, width: Math.round(count / maxMonthCount * 100) + '%', height: '100%', borderRadius: '999px' }} />
                      </div>
                      <div style={{ width: '20px', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Top Released Categories 🏆</h2>
              {mostReleasedCat ? (
                <>
                  <div style={{ fontSize: '30px', fontWeight: 800, color: PALETTE.coral }}>{mostReleasedCat[1]}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{mostReleasedCat[0]}</div>
                  <div style={{ fontSize: '12px', color: PALETTE.muted, marginBottom: '16px' }}>most released</div>
                  {Object.entries(catReleasedCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, cnt]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: `1px solid ${PALETTE.border}` }}>
                      <span>{cat}</span><span style={{ fontWeight: 700, color: PALETTE.coral }}>{cnt}</span>
                    </div>
                  ))}
                </>
              ) : <div style={{ color: PALETTE.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>🌱 Start releasing items!</div>}
            </div>
          </div>
        </>)}

        {/* ── ADD ITEM ── */}
        {tab === 'add' && (
          <div style={s.card}>
            <h2 style={{ ...s.sectionTitle, fontSize: '20px', marginBottom: '6px' }}>✨ Add New Item</h2>
            <p style={{ fontSize: '13px', color: PALETTE.muted, marginBottom: '20px' }}>Only Item Name, Category, and Decision are required.</p>
            <form onSubmit={addItem}>
              {/* Required */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={s.label}>Item Name <span style={{ color: PALETTE.coral }}>*</span></label>
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Blue cashmere sweater" required />
                </div>
                <div>
                  <label style={s.label}>Category <span style={{ color: PALETTE.coral }}>*</span></label>
                  <select style={s.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Decision <span style={{ color: PALETTE.coral }}>*</span></label>
                  <select style={s.select} value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })}>
                    {DECISIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Optional */}
              <div style={{ background: '#fffbfb', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: PALETTE.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Optional Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={s.label}>Location</label>
                    <input style={s.input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bedroom closet" />
                  </div>
                  <div>
                    <label style={s.label}>How Acquired</label>
                    <select style={s.select} value={form.how_acquired} onChange={e => setForm({ ...form, how_acquired: e.target.value })}>
                      <option value="">— select —</option>
                      {HOW_ACQUIRED.map(h => <option key={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Date Acquired (MM/YYYY)</label>
                    <input style={s.input} value={form.date_acquired} onChange={e => setForm({ ...form, date_acquired: e.target.value })} placeholder="e.g. 03/2022" />
                  </div>
                  {shouldHaveDateResolved(form.decision) && (
                    <div>
                      <label style={s.label}>Date Left Home</label>
                      <input style={s.input} type="date" value={form.date_resolved} onChange={e => setForm({ ...form, date_resolved: e.target.value })} />
                    </div>
                  )}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={s.label}>Emotional Attachment: {form.emotional_attachment}/5</label>
                    <input type="range" min="1" max="5" value={form.emotional_attachment} onChange={e => setForm({ ...form, emotional_attachment: e.target.value })} style={{ width: '100%', accentColor: PALETTE.lavender }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: PALETTE.muted }}>
                      <span>1 — Don't care</span><span>5 — Very attached</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Poshmark toggle */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, poshmark: !form.poshmark })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 18px',
                    border: `2px solid ${form.poshmark ? PALETTE.coral : PALETTE.border}`,
                    borderRadius: '14px',
                    background: form.poshmark ? '#fff1f2' : 'white',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: '40px', height: '22px', borderRadius: '999px', background: form.poshmark ? PALETTE.coral : '#e2e8f0', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: '3px', left: form.poshmark ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: form.poshmark ? PALETTE.coral : PALETTE.muted }}>👗 List on Poshmark?</div>
                    {form.poshmark && <div style={{ fontSize: '12px', color: PALETTE.muted, marginTop: '1px' }}>Fill in the details below for your listing</div>}
                  </div>
                </button>
              </div>

              {/* Poshmark fields */}
              {form.poshmark && (
                <div style={{ background: '#fff1f2', border: `1.5px solid ${PALETTE.coral}30`, borderRadius: '14px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={s.label}>Brand</label>
                    <input style={s.input} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Zara, Nike" />
                  </div>
                  <div>
                    <label style={s.label}>Condition</label>
                    <select style={s.select} value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                      <option value="">— select —</option>
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Size</label>
                    <input style={s.input} value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="e.g. M, 8.5" />
                  </div>
                  <div>
                    <label style={s.label}>Color</label>
                    <input style={s.input} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. Navy blue" />
                  </div>
                  <div>
                    <label style={s.label}>Original Price ($)</label>
                    <input style={s.input} type="number" min="0" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={s.label}>Asking Price ($)</label>
                    <input style={s.input} type="number" min="0" step="0.01" value={form.asking_price} onChange={e => setForm({ ...form, asking_price: e.target.value })} placeholder="0.00" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={s.label}>Flaws or Notes</label>
                    <input style={s.input} value={form.flaws} onChange={e => setForm({ ...form, flaws: e.target.value })} placeholder="Any flaws to mention in the listing?" />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={s.btn(PALETTE.coral)} disabled={loading}>{loading ? 'Adding...' : '✨ Add Item'}</button>
                <button type="button" style={s.btn('#e2e8f0', PALETTE.text)} onClick={() => setForm(emptyForm)}>Clear</button>
              </div>
            </form>
          </div>
        )}

        {/* ── ALL ITEMS ── */}
        {tab === 'items' && (
          <div style={s.card}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ margin: 0, ...s.sectionTitle, marginRight: 'auto' }}>📦 All Items ({filteredItems.length})</h2>
            </div>

            {/* Search + filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, flex: '1', minWidth: '180px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search by name, category, or location..."
              />
              <select style={{ ...s.select, width: 'auto' }} value={filterDecision} onChange={e => setFilterDecision(e.target.value)}>
                <option value="All">All Decisions</option>
                {DECISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select style={{ ...s.select, width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Decision filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['All', ...DECISIONS].map(d => {
                const count = d === 'All' ? items.length : items.filter(i => i.decision === d).length
                const active = filterDecision === d
                return (
                  <button key={d} onClick={() => setFilterDecision(d)} style={{
                    padding: '6px 14px', border: `1.5px solid ${active ? (DECISION_COLORS[d] || PALETTE.coral) : PALETTE.border}`,
                    borderRadius: '999px', background: active ? (DECISION_BG[d] || '#fff1f2') : 'white',
                    color: active ? (DECISION_COLORS[d] || PALETTE.coral) : PALETTE.muted,
                    cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  }}>
                    {d} <span style={{ opacity: 0.7 }}>({count})</span>
                  </button>
                )
              })}
            </div>

            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: PALETTE.muted }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌸</div>
                <div>No items found.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>{['Name', 'Category', 'Brand', 'Size', 'Condition', 'Decision', '🌸', 'EA', ''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (<>
                      <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                        <td style={s.td}><strong>{item.name}</strong></td>
                        <td style={s.td}><span style={{ fontSize: '12px', background: PALETTE.border, padding: '2px 8px', borderRadius: '8px' }}>{item.category}</span></td>
                        <td style={s.td}>{item.brand || '—'}</td>
                        <td style={s.td}>{item.size || '—'}</td>
                        <td style={s.td}>{item.condition || '—'}</td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <select
                            value={item.decision}
                            onChange={e => updateField(item.id, 'decision', e.target.value)}
                            style={{ padding: '4px 8px', border: `1.5px solid ${DECISION_COLORS[item.decision]}`, borderRadius: '8px', background: DECISION_BG[item.decision], color: DECISION_COLORS[item.decision], fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {DECISIONS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={!!item.poshmark} onChange={e => updateField(item.id, 'poshmark', e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: PALETTE.coral }} />
                        </td>
                        <td style={s.td}>{item.emotional_attachment ? '⭐'.repeat(item.emotional_attachment) : '—'}</td>
                        <td style={s.td} onClick={e => e.stopPropagation()}>
                          <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PALETTE.coral, fontSize: '16px' }}>🗑️</button>
                        </td>
                      </tr>
                      {expandedItem === item.id && (
                        <tr key={item.id + '-exp'}>
                          <td colSpan={9} style={{ padding: '14px 16px', background: '#fffbfb', borderBottom: `1px solid ${PALETTE.border}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
                              {item.original_price && <div><span style={{ color: PALETTE.muted }}>Original:</span> <strong>${parseFloat(item.original_price).toFixed(2)}</strong></div>}
                              {item.asking_price && <div><span style={{ color: PALETTE.muted }}>Asking:</span> <strong>${parseFloat(item.asking_price).toFixed(2)}</strong></div>}
                              {item.how_acquired && <div><span style={{ color: PALETTE.muted }}>Acquired:</span> <strong>{item.how_acquired}</strong></div>}
                              {item.date_acquired && <div><span style={{ color: PALETTE.muted }}>When:</span> <strong>{item.date_acquired}</strong></div>}
                              {item.location && <div><span style={{ color: PALETTE.muted }}>Location:</span> <strong>{item.location}</strong></div>}
                              {item.color && <div><span style={{ color: PALETTE.muted }}>Color:</span> <strong>{item.color}</strong></div>}
                              {item.date_resolved && <div><span style={{ color: PALETTE.muted }}>Left home:</span> <strong>{item.date_resolved}</strong></div>}
                              {item.flaws && <div style={{ gridColumn: '1/-1' }}><span style={{ color: PALETTE.muted }}>Flaws:</span> <strong>{item.flaws}</strong></div>}
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
            <h2 style={{ ...s.sectionTitle, fontSize: '20px', marginBottom: '4px' }}>👗 Poshmark Queue</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: PALETTE.muted }}>{poshmarkQueue.length} items ready to list</p>
            {poshmarkQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: PALETTE.muted }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👗</div>
                <div style={{ fontWeight: 600 }}>No items in queue yet</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Mark items as "Sell" and toggle the Poshmark switch</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {poshmarkQueue.map(item => (
                  <div key={item.id} style={{ border: `1.5px solid ${PALETTE.coral}30`, borderRadius: '16px', padding: '18px', background: 'linear-gradient(135deg, #fff1f2, #fdf4ff)' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{item.brand ? `${item.brand} ` : ''}{item.name}</div>
                    <div style={{ fontSize: '13px', color: PALETTE.muted, display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '14px' }}>
                      <span>📦 {item.category}{item.condition ? ` · ${item.condition}` : ''}</span>
                      {item.size && <span>📐 {item.size}</span>}
                      {item.color && <span>🎨 {item.color}</span>}
                      {item.asking_price && <span style={{ color: PALETTE.coral, fontWeight: 700 }}>💰 ${parseFloat(item.asking_price).toFixed(2)}</span>}
                      {item.flaws && <span>📝 {item.flaws}</span>}
                    </div>
                    <button onClick={() => generateListing(item)} style={{ ...s.btn(PALETTE.coral), width: '100%' }}>✨ Generate Listing</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY RULES & MONEY ── */}
        {tab === 'rules' && (<>
          {/* Rules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ ...s.card, borderTop: `4px solid ${PALETTE.mint}` }}>
              <h2 style={{ ...s.sectionTitle, color: PALETTE.mint }}>✅ Allowed</h2>
              {[
                'Experiences and events',
                'Races and race fees',
                'Race gear',
                'Replacement items (one in, one out)',
                'Essentials fully used up',
                'Event clothing that can be reworn',
                'Groceries',
                'Toiletries',
                'Gas',
              ].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${PALETTE.border}`, fontSize: '14px' }}>
                  <span style={{ color: PALETTE.mint, fontSize: '16px' }}>✓</span> {r}
                </div>
              ))}
            </div>
            <div style={{ ...s.card, borderTop: `4px solid ${PALETTE.coral}` }}>
              <h2 style={{ ...s.sectionTitle, color: PALETTE.coral }}>🚫 Not Allowed</h2>
              {[
                'Impulse purchases',
                'New clothes unless replacing',
                'New subscriptions',
                'Amazon purchases',
                'TikTok Shop',
                'New food until pantry is used up',
                'Uber/Lyft (use CTA)',
                'Eating out over $150/month',
              ].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${PALETTE.border}`, fontSize: '14px' }}>
                  <span style={{ color: PALETTE.coral, fontSize: '16px' }}>✗</span> {r}
                </div>
              ))}
            </div>
          </div>

          {/* Budget Snapshot */}
          <div style={{ ...s.card, borderTop: `4px solid ${PALETTE.lavender}` }}>
            <h2 style={{ ...s.sectionTitle, color: PALETTE.lavender }}>💜 Budget Snapshot</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Income', 4453, PALETTE.mint],
                ['Home Essentials', 2418, PALETTE.coral],
                ['Food', 480, PALETTE.yellow],
                ['Debt Payments', 1136.95, PALETTE.coral],
                ['Lifestyle', 245.98, PALETTE.lavender],
                ['Wellbeing', 122, PALETTE.sky],
              ].map(([label, amt, color]) => (
                <div key={label} style={{ background: color + '12', border: `1.5px solid ${color}30`, borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color }}>${amt.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: PALETTE.muted, marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #faf5ff)', borderRadius: '14px', padding: '18px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: PALETTE.mint }}>$531</div>
                <div style={{ fontSize: '13px', color: PALETTE.muted, fontWeight: 600 }}>freed up / month</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: PALETTE.mint }}>$6,378</div>
                <div style={{ fontSize: '13px', color: PALETTE.muted, fontWeight: 600 }}>freed up / year</div>
              </div>
            </div>
          </div>

          {/* Debt Tracker */}
          <div style={{ ...s.card, borderTop: `4px solid ${PALETTE.coral}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ ...s.sectionTitle, color: PALETTE.coral, marginBottom: '4px' }}>🎯 Debt Avalanche Tracker</h2>
                <p style={{ margin: 0, fontSize: '13px', color: PALETTE.muted }}>Highest APR first — the fastest path to freedom</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: PALETTE.coral }}>${DEBT_TOTAL.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: PALETTE.muted, fontWeight: 600 }}>total debt</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {DEBT.map((d, i) => {
                const pct = Math.round(d.balance / DEBT_TOTAL * 100)
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{d.name}</span>
                        <span style={{ marginLeft: '10px', fontSize: '12px', background: PALETTE.coral + '15', color: PALETTE.coral, padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>{d.apr}% APR</span>
                        {i === 0 && <span style={{ marginLeft: '6px', fontSize: '11px', background: PALETTE.mint + '20', color: PALETTE.mint, padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>ATTACK FIRST</span>}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: PALETTE.coral }}>${d.balance.toLocaleString()}</span>
                    </div>
                    <div style={{ background: PALETTE.border, borderRadius: '999px', height: '10px' }}>
                      <div style={{ background: i === 0 ? `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.yellow})` : `linear-gradient(90deg, ${PALETTE.lavender}, ${PALETTE.blush})`, width: pct + '%', height: '100%', borderRadius: '999px', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: PALETTE.muted, marginTop: '4px' }}>${d.balance.toLocaleString()} remaining · {pct}% of total debt</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>)}
      </main>

      {/* LISTING MODAL */}
      {listingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(61,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(251,113,133,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>✨ Poshmark Listing</h3>
              <button onClick={() => setListingModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: PALETTE.muted }}>✕</button>
            </div>
            <textarea value={listingModal.text} readOnly style={{ ...s.input, height: '240px', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => navigator.clipboard.writeText(listingModal.text)} style={s.btn(PALETTE.coral)}>📋 Copy</button>
              <button onClick={() => setListingModal(null)} style={s.btn('#e2e8f0', PALETTE.text)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
