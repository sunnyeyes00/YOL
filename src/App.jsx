import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Bedroom', 'Clothes', 'Shoes', 'Purses', 'Makeup', 'Skincare',
  'Hair Products', 'Hair Tools', 'Body Hygiene', 'Home Cleaning',
  'Tools', 'Canned Food', 'Seasonings', 'Crafts', 'Tech',
  'House Misc', 'Clothes Accessories', 'Kitchen', 'Cooking Oils', 'Kitchen Tools',
  'Garage', 'Car & Auto', 'Sports & Outdoor', 'Garden & Outdoor Living',
  'Stationery', 'Wellness & Supplements', 'Books', 'Office Supplies',
  'Furniture', 'Dry Goods & Pantry',
]
const DECISIONS = ['Keep', 'Sell', 'Donate', 'Toss', 'Needs Repair', 'Undecided']
const CONDITIONS = ['New with tags', 'Like new', 'Good', 'Fair', 'Poor']
const HOW_ACQUIRED = ['Bought', 'Gifted', 'Inherited', 'Impulse buy']

const DECISION_COLORS = {
  Keep: '#4ade80', Sell: '#fb7185', Donate: '#c084fc',
  Toss: '#fbbf24', 'Needs Repair': '#60a5fa', Undecided: '#f9a8d4',
}
const DECISION_BG = {
  Keep: '#f0fdf4', Sell: '#fff1f2', Donate: '#faf5ff',
  Toss: '#fffbeb', 'Needs Repair': '#eff6ff', Undecided: '#fdf2f8',
}

const P = {
  coral: '#fb7185', blush: '#f9a8d4', lavender: '#c084fc',
  mint: '#4ade80', yellow: '#fbbf24', sky: '#60a5fa',
  gold: '#f59e0b', amber: '#d97706', emerald: '#10b981',
  text: '#3d2c2c', muted: '#9d8080', border: '#f3e8e8',
}

const START_DATE = new Date('2026-04-01')

const AFFIRMATIONS = [
  'Releasing this makes space for abundance ✨',
  "That's one step closer to freedom, Alejandra 🌸",
  'You\'re flourishing. Keep going 🌿',
  'Less stuff, more life. Yes! 💛',
  'Money is flowing back to you 🌊',
  'You did that. Abundant & free 🦋',
  'Space created. Blessings incoming ✨',
  'Soltar. Release. Bloom. 🌺',
]

const DAILY_AFFIRMATIONS = [
  'Today you choose freedom over stuff. That\'s power. 🌸',
  'Every item released is a blessing returned to the world 🌿',
  'You are not your things. You are so much more. ✨',
  'Abundance flows toward those who make room 🌊',
  'Alejandra, you are building a lighter, freer life 💛',
  'What you release, the universe replaces tenfold 🦋',
  'Soltar is brave. You are brave. 🌺',
  'Less clutter, clearer mind, bigger dreams 🌙',
  'You\'re blooming. One item at a time 🌸',
  'This is your Year of Less — and so much more ✨',
]

const MILESTONES = [
  { id: 'first', check: (r) => r === 1,   msg: 'Your first release! The journey begins, Alejandra 🌱', emoji: '🌱' },
  { id: 'ten',   check: (r) => r === 10,  msg: '10 items released! You\'re on fire 🔥', emoji: '🔥' },
  { id: 'g25',   check: (_, pct) => pct >= 25 && pct < 26, msg: '25% to your goal! One quarter of the way there 🌸', emoji: '🎉' },
  { id: 'g50',   check: (_, pct) => pct >= 50 && pct < 51, msg: 'Halfway there!! You are DOING it, Alejandra 🦋', emoji: '🦋' },
  { id: 'g70',   check: (_, pct) => pct >= 70 && pct < 71, msg: '🎊 70% GOAL REACHED! You are FREE! 🎊', emoji: '🎊' },
  { id: '$100',  check: (_, __, money) => money >= 100 && money < 110, msg: '$100 recovered! Money is flowing back to you 💰', emoji: '💰' },
]

const emptyForm = {
  name: '', category: 'Clothes', location: '', estimated_value: '',
  decision: 'Undecided', poshmark: false,
  how_acquired: '', date_acquired: '', emotional_attachment: 3,
  original_price: '', date_resolved: '',
  brand: '', size: '', color: '', condition: '',
  asking_price: '', flaws: '',
}

const DEBT = [
  { name: 'Aspire',      balance: 703,   apr: 36.00 },
  { name: 'Prosper',     balance: 4890,  apr: 30.49 },
  { name: 'Citi',        balance: 2103,  apr: 29.49 },
  { name: 'Capital One', balance: 413,   apr: 28.99 },
]
const DEBT_TOTAL = DEBT.reduce((s, d) => s + d.balance, 0)

// ─── Confetti ────────────────────────────────────────────────────────────────

function Confetti({ active }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 160 + 20,
      color: [P.coral, P.lavender, P.gold, P.mint, P.yellow, '#fff'][Math.floor(Math.random() * 6)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngle: 0,
      tiltSpeed: Math.random() * 0.1 + 0.05,
    }))

    let angle = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      angle += 0.01
      pieces.forEach(p => {
        p.tiltAngle += p.tiltSpeed
        p.y += (Math.cos(angle + p.d) + 3 + p.r / 2) * 0.8
        p.x += Math.sin(angle) * 1.2
        p.tilt = Math.sin(p.tiltAngle) * 12
        ctx.beginPath()
        ctx.lineWidth = p.r / 2
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4)
        ctx.stroke()
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  if (!active) return null
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [items,          setItems]          = useState([])
  const [form,           setForm]           = useState(emptyForm)
  const [loading,        setLoading]        = useState(false)
  const [tab,            setTab]            = useState('dashboard')
  const [filterDecision, setFilterDecision] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [search,         setSearch]         = useState('')
  const [listingModal,   setListingModal]   = useState(null)
  const [error,          setError]          = useState(null)
  const [expandedItem,   setExpandedItem]   = useState(null)
  const [intention,      setIntention]      = useState('')
  const [intentionSaved, setIntentionSaved] = useState(false)
  const [affirmation,    setAffirmation]    = useState(null)   // { text, key }
  const [milestone,      setMilestone]      = useState(null)   // { msg, emoji }
  const [confetti,       setConfetti]       = useState(false)
  const seenMilestones = useRef(new Set())
  const [dayCount,       setDayCount]       = useState(1)

  // Day counter
  useEffect(() => {
    const diff = Math.floor((Date.now() - START_DATE.getTime()) / 86400000) + 1
    setDayCount(Math.max(1, diff))
  }, [])

  // Daily affirmation — keyed to day-of-year
  const dailyAffirmation = DAILY_AFFIRMATIONS[new Date().getDate() % DAILY_AFFIRMATIONS.length]

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

  function showAffirmation() {
    const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
    const key  = Date.now()
    setAffirmation({ text, key })
    setTimeout(() => setAffirmation(null), 3200)
  }

  function checkMilestones(nextItems) {
    const rel   = nextItems.filter(i => ['Sell', 'Donate', 'Toss'].includes(i.decision))
    const pct   = nextItems.length > 0 ? Math.round(rel.length / nextItems.length * 100) : 0
    const money = rel.reduce((s, i) => s + (i.asking_price || i.estimated_value || 0), 0)

    for (const m of MILESTONES) {
      if (!seenMilestones.current.has(m.id) && m.check(rel.length, pct, money)) {
        seenMilestones.current.add(m.id)
        setMilestone({ msg: m.msg, emoji: m.emoji })
        setConfetti(true)
        setTimeout(() => { setMilestone(null); setConfetti(false) }, 5000)
        break
      }
    }
  }

  async function addItem(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const payload = {
      ...form,
      estimated_value:    form.estimated_value    ? parseFloat(form.estimated_value)    : null,
      original_price:     form.original_price     ? parseFloat(form.original_price)     : null,
      asking_price:       form.asking_price       ? parseFloat(form.asking_price)       : null,
      emotional_attachment: form.emotional_attachment ? parseInt(form.emotional_attachment) : null,
      date_resolved: shouldHaveDateResolved(form.decision) && form.date_resolved ? form.date_resolved : null,
      brand:     form.poshmark ? form.brand     : null,
      size:      form.poshmark ? form.size      : null,
      color:     form.poshmark ? form.color     : null,
      condition: form.poshmark ? (form.condition || null) : null,
      flaws:     form.poshmark ? form.flaws     : null,
    }
    const { error } = await supabase.from('items').insert([payload])
    if (error) { setError(error.message) } else {
      if (shouldHaveDateResolved(form.decision)) showAffirmation()
      setForm(emptyForm)
      const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
      const next = data || []
      setItems(next)
      checkMilestones(next)
    }
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
    const next = items.map(i => i.id === id ? { ...i, ...updates } : i)
    setItems(next)
    if (field === 'decision' && shouldHaveDateResolved(value)) {
      showAffirmation()
      checkMilestones(next)
    }
  }

  function generateListing(item) {
    const price = item.asking_price
      ? `$${parseFloat(item.asking_price).toFixed(2)}`
      : item.estimated_value ? `$${parseFloat(item.estimated_value).toFixed(2)}` : 'Price TBD'
    const conditionLine = item.condition === 'New with tags' ? 'Brand new with tags! Never worn/used.'
      : item.condition === 'Like new'  ? 'Like new! Barely used, no flaws.'
      : item.condition === 'Good'      ? 'Gently used with minimal wear.'
      : item.condition === 'Fair'      ? 'Shows some signs of use but fully functional.'
      : item.condition ? 'As-is condition, priced accordingly.' : ''
    const text = `🛍️ ${item.brand ? item.brand + ' ' : ''}${item.name}

Condition: ${item.condition || 'See description'}
${item.size  ? `Size: ${item.size}`   : ''}
${item.color ? `Color: ${item.color}` : ''}
${item.category ? `Category: ${item.category}` : ''}
${item.flaws ? `\nNotes: ${item.flaws}` : ''}

${conditionLine}

Asking: ${price}

✨ Message me with any questions! Bundle discounts available. 💕`
    setListingModal({ item, text })
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const total        = items.length
  const released     = items.filter(i => ['Sell', 'Donate', 'Toss'].includes(i.decision))
  const sold         = items.filter(i => i.decision === 'Sell')
  const donated      = items.filter(i => i.decision === 'Donate')
  const tossed       = items.filter(i => i.decision === 'Toss')
  const poshmarkQueue = items.filter(i => i.poshmark && i.decision === 'Sell')

  const goalPct = total > 0 ? Math.min(100, Math.round(released.length / total * 100)) : 0
  const GOAL    = 70

  const moneyRecovered    = sold.reduce((s, i) => s + (i.asking_price || i.estimated_value || 0), 0)
  const moneyLeftOnTable  = sold.reduce((s, i) => Math.max(0, (i.original_price || 0) - (i.asking_price || i.estimated_value || 0)) + s, 0)

  const decisionStats = DECISIONS.map(d => ({
    label: d,
    count: items.filter(i => i.decision === d).length,
    pct:   total ? Math.round(items.filter(i => i.decision === d).length / total * 100) : 0,
    color: DECISION_COLORS[d],
    bg:    DECISION_BG[d],
  }))

  const catReleasedCounts = {}
  released.forEach(i => { catReleasedCounts[i.category] = (catReleasedCounts[i.category] || 0) + 1 })
  const mostReleasedCat = Object.entries(catReleasedCounts).sort((a, b) => b[1] - a[1])[0]

  const monthCounts = {}
  released.forEach(i => {
    if (i.date_resolved) { const k = i.date_resolved.slice(0, 7); monthCounts[k] = (monthCounts[k] || 0) + 1 }
  })
  const monthData     = Object.entries(monthCounts).sort()
  const maxMonthCount = Math.max(...monthData.map(([, c]) => c), 1)

  const releasedWithEA = released.filter(i => i.emotional_attachment)
  const avgEA = releasedWithEA.length
    ? (releasedWithEA.reduce((s, i) => s + i.emotional_attachment, 0) / releasedWithEA.length).toFixed(1)
    : '—'

  const filteredItems = items.filter(i => {
    if (filterDecision !== 'All' && i.decision !== filterDecision) return false
    if (filterCategory !== 'All' && i.category !== filterCategory) return false
    if (search) {
      const q = search.toLowerCase()
      if (!i.name?.toLowerCase().includes(q) && !i.category?.toLowerCase().includes(q) && !i.location?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s = {
    app:   { fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg, #fff5f7 0%, #fdf4ff 50%, #f0fff4 100%)', color: P.text },
    nav:   { background: 'white', borderBottom: `2px solid ${P.border}`, padding: '0 24px', display: 'flex', gap: '2px', overflowX: 'auto' },
    navBtn: (a) => ({ padding: '14px 18px', border: 'none', background: a ? 'linear-gradient(135deg,#fff1f2,#fdf4ff)' : 'none', cursor: 'pointer', fontSize: '13px', fontWeight: a ? 700 : 500, color: a ? P.coral : P.muted, borderBottom: a ? `3px solid ${P.coral}` : '3px solid transparent', whiteSpace: 'nowrap', borderRadius: a ? '8px 8px 0 0' : '0' }),
    main:  { maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' },
    card:  { background: 'white', border: `1px solid ${P.border}`, borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(251,113,133,0.06)' },
    label: { display: 'block', fontSize: '13px', fontWeight: 600, color: P.muted, marginBottom: '5px' },
    input: { width: '100%', padding: '10px 14px', border: `1.5px solid ${P.border}`, borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', background: '#fffbfb', color: P.text, outline: 'none' },
    select:{ width: '100%', padding: '10px 14px', border: `1.5px solid ${P.border}`, borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', background: '#fffbfb', color: P.text },
    btn:   (bg = P.coral, fg = 'white') => ({ padding: '10px 20px', background: bg, color: fg, border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, boxShadow: `0 2px 8px ${bg}40` }),
    sectionTitle: { fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: P.text },
    th: { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: P.muted, borderBottom: `2px solid ${P.border}`, background: '#fffbfb', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' },
    td: { padding: '10px 12px', borderBottom: `1px solid ${P.border}`, verticalAlign: 'middle', fontSize: '13px' },
  }

  const StatBox = ({ label, value, color = P.text, sub, emoji, gold }) => (
    <div style={{ background: gold ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'white', border: `1.5px solid ${gold ? P.gold+'40' : P.border}`, borderRadius: '16px', padding: '18px', boxShadow: gold ? `0 2px 12px ${P.gold}20` : '0 2px 8px rgba(251,113,133,0.05)' }}>
      {emoji && <div style={{ fontSize: '22px', marginBottom: '6px' }}>{emoji}</div>}
      <div style={{ fontSize: '24px', fontWeight: 800, color: gold ? P.amber : color }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: P.muted, marginTop: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: '#c4a5a5', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={s.app}>
      {/* ── Confetti ── */}
      <Confetti active={confetti} />

      {/* ── Affirmation overlay ── */}
      {affirmation && (
        <div key={affirmation.key} style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #fb7185, #c084fc)',
          color: 'white', borderRadius: '20px', padding: '18px 28px',
          fontSize: '16px', fontWeight: 700, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(251,113,133,0.4)',
          zIndex: 9000, maxWidth: '420px', width: 'calc(100% - 48px)',
          animation: 'fadeInDown 0.4s ease, fadeOutUp 0.4s ease 2.8s forwards',
        }}>
          {affirmation.text}
        </div>
      )}

      {/* ── Milestone overlay ── */}
      {milestone && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9500, pointerEvents: 'none',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed, #fdf2f8, #faf5ff)',
            border: `3px solid ${P.gold}`,
            borderRadius: '24px', padding: '36px 48px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(245,158,11,0.3)',
            maxWidth: '440px',
          }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>{milestone.emoji}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: P.amber, lineHeight: 1.3 }}>{milestone.msg}</div>
          </div>
        </div>
      )}

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translate(-50%,-20px) } to { opacity:1; transform:translate(-50%,0) } }
        @keyframes fadeOutUp  { from { opacity:1 } to { opacity:0; transform:translate(-50%,-20px) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.7 } }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ background: 'linear-gradient(135deg, #fb7185 0%, #c084fc 50%, #60a5fa 100%)', color: 'white', padding: '0' }}>
        {/* Daily affirmation strip */}
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 28px', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          ✨ {dailyAffirmation}
        </div>
        <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>Soltar</h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.85, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>
              release · bloom · abound
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>Alejandra</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>Day {dayCount} of 365</div>
            <div style={{ fontSize: '11px', opacity: 0.75 }}>Started April 1, 2026</div>
          </div>
        </div>
      </header>

      {/* ── NAV ── */}
      <nav style={s.nav}>
        {[['dashboard','🌸 Dashboard'],['items','📦 All Items'],['add','✨ Add Item'],['poshmark','👗 Poshmark'],['rules','💸 My Rules & Money']].map(([key, label]) => (
          <button key={key} style={s.navBtn(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      <main style={s.main}>
        {error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#e11d48', fontSize: '14px' }}>
            ⚠️ {error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48' }}>✕</button>
          </div>
        )}

        {/* ══════════════ DASHBOARD ══════════════ */}
        {tab === 'dashboard' && (<>

          {/* Monthly Intention */}
          <div style={{ ...s.card, background: 'linear-gradient(135deg,#fdf2f8,#faf5ff)', border: `1.5px solid #f3e8f8` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: P.lavender, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>🌷 Monthly Intention</div>
            <textarea value={intention} onChange={e => setIntention(e.target.value)}
              placeholder="What's your intention this month? e.g. April — use up all pantry items before buying new food"
              style={{ ...s.input, height: '68px', resize: 'none', fontStyle: intention ? 'normal' : 'italic' }}
            />
            <button onClick={saveIntention} style={{ ...s.btn(P.lavender), marginTop: '10px', fontSize: '13px', padding: '8px 16px' }}>
              {intentionSaved ? '✓ Saved!' : 'Save Intention'}
            </button>
          </div>

          {/* 70% Goal */}
          <div style={{ ...s.card, background: 'linear-gradient(135deg,#f0fdf4,#fdf2f8)', border: `1.5px solid ${P.emerald}30` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: P.emerald, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎯 Year of Less — 70% Goal</div>
                <div style={{ fontSize: '13px', color: P.muted, marginTop: '3px' }}>{released.length} of {total} items released · {goalPct}% toward your goal</div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 900, color: goalPct >= GOAL ? P.emerald : P.coral }}>{goalPct}%</div>
            </div>
            <div style={{ background: P.border, borderRadius: '999px', height: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ background: goalPct >= GOAL ? `linear-gradient(90deg,${P.emerald},#34d399)` : `linear-gradient(90deg,${P.coral},${P.lavender})`, width: `${goalPct}%`, height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' }} />
              <div style={{ position: 'absolute', top: 0, left: '70%', width: '2px', height: '100%', background: P.text, opacity: 0.2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: P.muted, marginTop: '6px' }}>
              <span>0%</span>
              <span style={{ color: goalPct >= GOAL ? P.emerald : P.coral, fontWeight: 700 }}>
                {goalPct >= GOAL ? '🎉 Goal reached, Alejandra!' : `${GOAL - goalPct}% more to freedom`}
              </span>
              <span>70%</span>
            </div>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '14px', marginBottom: '20px' }}>
            <StatBox emoji="📦" label="Total Items"    value={total} />
            <StatBox emoji="🚀" label="Released"       value={released.length} color={P.emerald} sub={total ? goalPct + '% of inventory' : ''} />
            <StatBox emoji="💰" label="Recovered"      value={'$' + moneyRecovered.toLocaleString()} gold />
            <StatBox emoji="💸" label="Left on Table"  value={'$' + moneyLeftOnTable.toLocaleString()} gold sub="orig – sell" />
            <StatBox emoji="💜" label="Avg Attachment" value={avgEA} color={P.lavender} sub="of released" />
            <StatBox emoji="👗" label="Poshmark"       value={poshmarkQueue.length} color={P.coral} sub="in queue" />
          </div>

          {/* Exit paths */}
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Exit Paths 🚪</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              {[['Sold 💙', sold.length, P.coral], ['Donated 💜', donated.length, P.lavender], ['Tossed 💛', tossed.length, P.yellow]].map(([label, count, color]) => (
                <div key={label} style={{ background: color + '15', border: `1.5px solid ${color}40`, borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color }}>{label}</div>
                  <div style={{ fontSize: '12px', color: P.muted, marginTop: '2px' }}>{released.length ? Math.round(count / released.length * 100) : 0}% of released</div>
                </div>
              ))}
            </div>
            <h3 style={{ ...s.sectionTitle, fontSize: '14px' }}>All Decisions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '10px' }}>
              {decisionStats.map(st => (
                <div key={st.label} style={{ background: st.bg, border: `1.5px solid ${st.color}30`, borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: st.color }}>{st.count}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: st.color }}>{st.label}</div>
                  <div style={{ marginTop: '8px', background: '#f0e8e8', borderRadius: '999px', height: '5px' }}>
                    <div style={{ background: st.color, width: st.pct + '%', height: '5px', borderRadius: '999px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: P.muted, marginTop: '4px' }}>{st.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Released by Month 📅</h2>
              {monthData.length === 0
                ? <div style={{ color: P.muted, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>🌱 No resolved items yet!</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {monthData.map(([month, count]) => (
                      <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '64px', fontSize: '12px', color: P.muted, flexShrink: 0 }}>{month}</div>
                        <div style={{ flex: 1, background: P.border, borderRadius: '999px', height: '18px' }}>
                          <div style={{ background: `linear-gradient(90deg,${P.emerald},${P.lavender})`, width: Math.round(count / maxMonthCount * 100) + '%', height: '100%', borderRadius: '999px' }} />
                        </div>
                        <div style={{ width: '20px', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>{count}</div>
                      </div>
                    ))}
                  </div>}
            </div>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Top Categories 🏆</h2>
              {mostReleasedCat
                ? <>
                    <div style={{ fontSize: '30px', fontWeight: 800, color: P.emerald }}>{mostReleasedCat[1]}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{mostReleasedCat[0]}</div>
                    <div style={{ fontSize: '12px', color: P.muted, marginBottom: '14px' }}>most released</div>
                    {Object.entries(catReleasedCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, cnt]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '5px 0', borderBottom: `1px solid ${P.border}` }}>
                        <span>{cat}</span><span style={{ fontWeight: 700, color: P.emerald }}>{cnt}</span>
                      </div>
                    ))}
                  </>
                : <div style={{ color: P.muted, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>🌱 Start releasing items!</div>}
            </div>
          </div>
        </>)}

        {/* ══════════════ ADD ITEM ══════════════ */}
        {tab === 'add' && (
          <div style={s.card}>
            <h2 style={{ ...s.sectionTitle, fontSize: '20px', marginBottom: '4px' }}>✨ Add New Item</h2>
            <p style={{ fontSize: '13px', color: P.muted, marginBottom: '20px' }}>Only Item Name, Category, and Decision are required.</p>
            <form onSubmit={addItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={s.label}>Item Name <span style={{ color: P.coral }}>*</span></label>
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Blue cashmere sweater" required />
                </div>
                <div>
                  <label style={s.label}>Category <span style={{ color: P.coral }}>*</span></label>
                  <select style={s.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Decision <span style={{ color: P.coral }}>*</span></label>
                  <select style={s.select} value={form.decision} onChange={e => setForm({ ...form, decision: e.target.value })}>
                    {DECISIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: '#fffbfb', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Optional Details</div>
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
                    <input type="range" min="1" max="5" value={form.emotional_attachment} onChange={e => setForm({ ...form, emotional_attachment: e.target.value })} style={{ width: '100%', accentColor: P.lavender }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: P.muted }}>
                      <span>1 — Don't care</span><span>5 — Very attached</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Poshmark toggle */}
              <div style={{ marginBottom: '16px' }}>
                <button type="button" onClick={() => setForm({ ...form, poshmark: !form.poshmark })}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', border: `2px solid ${form.poshmark ? P.coral : P.border}`, borderRadius: '14px', background: form.poshmark ? '#fff1f2' : 'white', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}>
                  <div style={{ width: '40px', height: '22px', borderRadius: '999px', background: form.poshmark ? P.coral : '#e2e8f0', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: '3px', left: form.poshmark ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: form.poshmark ? P.coral : P.muted }}>👗 List on Poshmark?</div>
                    {form.poshmark && <div style={{ fontSize: '12px', color: P.muted, marginTop: '1px' }}>Fill in listing details below</div>}
                  </div>
                </button>
              </div>

              {form.poshmark && (
                <div style={{ background: '#fff1f2', border: `1.5px solid ${P.coral}30`, borderRadius: '14px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={s.label}>Brand</label><input style={s.input} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Zara, Nike" /></div>
                  <div><label style={s.label}>Condition</label><select style={s.select} value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option value="">— select —</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div><label style={s.label}>Size</label><input style={s.input} value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="e.g. M, 8.5" /></div>
                  <div><label style={s.label}>Color</label><input style={s.input} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="e.g. Navy blue" /></div>
                  <div><label style={s.label}>Original Price ($)</label><input style={s.input} type="number" min="0" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="0.00" /></div>
                  <div><label style={s.label}>Asking Price ($)</label><input style={s.input} type="number" min="0" step="0.01" value={form.asking_price} onChange={e => setForm({ ...form, asking_price: e.target.value })} placeholder="0.00" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label style={s.label}>Flaws or Notes</label><input style={s.input} value={form.flaws} onChange={e => setForm({ ...form, flaws: e.target.value })} placeholder="Any flaws to mention in the listing?" /></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={s.btn(P.coral)} disabled={loading}>{loading ? 'Adding...' : '✨ Add Item'}</button>
                <button type="button" style={s.btn('#e2e8f0', P.text)} onClick={() => setForm(emptyForm)}>Clear</button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════ ALL ITEMS ══════════════ */}
        {tab === 'items' && (
          <div style={s.card}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ margin: 0, ...s.sectionTitle, marginRight: 'auto' }}>📦 All Items ({filteredItems.length})</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <input style={{ ...s.input, flex: '1', minWidth: '180px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search name, category, location..." />
              <select style={{ ...s.select, width: 'auto' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '7px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['All', ...DECISIONS].map(d => {
                const count  = d === 'All' ? items.length : items.filter(i => i.decision === d).length
                const active = filterDecision === d
                return (
                  <button key={d} onClick={() => setFilterDecision(d)} style={{ padding: '5px 12px', border: `1.5px solid ${active ? (DECISION_COLORS[d] || P.coral) : P.border}`, borderRadius: '999px', background: active ? (DECISION_BG[d] || '#fff1f2') : 'white', color: active ? (DECISION_COLORS[d] || P.coral) : P.muted, cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                    {d} ({count})
                  </button>
                )
              })}
            </div>

            {filteredItems.length === 0
              ? <div style={{ textAlign: 'center', padding: '48px', color: P.muted }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>🌸</div>No items found.</div>
              : <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr>{['Name','Category','Brand','Size','Condition','Decision','🌸','EA',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filteredItems.map(item => (<>
                        <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                          <td style={s.td}><strong>{item.name}</strong></td>
                          <td style={s.td}><span style={{ fontSize: '11px', background: P.border, padding: '2px 8px', borderRadius: '8px' }}>{item.category}</span></td>
                          <td style={s.td}>{item.brand || '—'}</td>
                          <td style={s.td}>{item.size || '—'}</td>
                          <td style={s.td}>{item.condition || '—'}</td>
                          <td style={s.td} onClick={e => e.stopPropagation()}>
                            <select value={item.decision} onChange={e => updateField(item.id, 'decision', e.target.value)} style={{ padding: '4px 8px', border: `1.5px solid ${DECISION_COLORS[item.decision]}`, borderRadius: '8px', background: DECISION_BG[item.decision], color: DECISION_COLORS[item.decision], fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              {DECISIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                          </td>
                          <td style={s.td} onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!item.poshmark} onChange={e => updateField(item.id, 'poshmark', e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: P.coral }} />
                          </td>
                          <td style={s.td}>{item.emotional_attachment ? '⭐'.repeat(item.emotional_attachment) : '—'}</td>
                          <td style={s.td} onClick={e => e.stopPropagation()}>
                            <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.coral, fontSize: '16px' }}>🗑️</button>
                          </td>
                        </tr>
                        {expandedItem === item.id && (
                          <tr key={item.id + '-exp'}>
                            <td colSpan={9} style={{ padding: '14px 16px', background: '#fffbfb', borderBottom: `1px solid ${P.border}` }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '10px', fontSize: '13px' }}>
                                {item.original_price && <div><span style={{ color: P.muted }}>Original:</span> <strong style={{ color: P.amber }}>${parseFloat(item.original_price).toFixed(2)}</strong></div>}
                                {item.asking_price   && <div><span style={{ color: P.muted }}>Asking:</span>   <strong style={{ color: P.amber }}>${parseFloat(item.asking_price).toFixed(2)}</strong></div>}
                                {item.how_acquired   && <div><span style={{ color: P.muted }}>Acquired:</span> <strong>{item.how_acquired}</strong></div>}
                                {item.date_acquired  && <div><span style={{ color: P.muted }}>When:</span>     <strong>{item.date_acquired}</strong></div>}
                                {item.location       && <div><span style={{ color: P.muted }}>Location:</span> <strong>{item.location}</strong></div>}
                                {item.color          && <div><span style={{ color: P.muted }}>Color:</span>    <strong>{item.color}</strong></div>}
                                {item.date_resolved  && <div><span style={{ color: P.muted }}>Left home:</span><strong>{item.date_resolved}</strong></div>}
                                {item.flaws          && <div style={{ gridColumn: '1/-1' }}><span style={{ color: P.muted }}>Flaws:</span> <strong>{item.flaws}</strong></div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>))}
                    </tbody>
                  </table>
                </div>}
          </div>
        )}

        {/* ══════════════ POSHMARK ══════════════ */}
        {tab === 'poshmark' && (
          <div style={s.card}>
            <h2 style={{ ...s.sectionTitle, fontSize: '20px', marginBottom: '4px' }}>👗 Poshmark Queue</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: P.muted }}>{poshmarkQueue.length} items ready to list</p>
            {poshmarkQueue.length === 0
              ? <div style={{ textAlign: 'center', padding: '48px', color: P.muted }}><div style={{ fontSize: '48px', marginBottom: '12px' }}>👗</div><div style={{ fontWeight: 600 }}>No items in queue yet</div><div style={{ fontSize: '13px', marginTop: '8px' }}>Mark items as "Sell" and toggle the Poshmark switch</div></div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
                  {poshmarkQueue.map(item => (
                    <div key={item.id} style={{ border: `1.5px solid ${P.coral}30`, borderRadius: '16px', padding: '18px', background: 'linear-gradient(135deg,#fff1f2,#fdf4ff)' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{item.brand ? `${item.brand} ` : ''}{item.name}</div>
                      <div style={{ fontSize: '13px', color: P.muted, display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '14px' }}>
                        <span>📦 {item.category}{item.condition ? ` · ${item.condition}` : ''}</span>
                        {item.size  && <span>📐 {item.size}</span>}
                        {item.color && <span>🎨 {item.color}</span>}
                        {item.asking_price   && <span style={{ color: P.amber, fontWeight: 700 }}>💰 ${parseFloat(item.asking_price).toFixed(2)}</span>}
                        {item.original_price && <span style={{ color: P.muted }}>Orig. ${parseFloat(item.original_price).toFixed(2)}</span>}
                        {item.flaws && <span>📝 {item.flaws}</span>}
                      </div>
                      <button onClick={() => generateListing(item)} style={{ ...s.btn(P.coral), width: '100%' }}>✨ Generate Listing</button>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════════ RULES & MONEY ══════════════ */}
        {tab === 'rules' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ ...s.card, borderTop: `4px solid ${P.emerald}` }}>
              <h2 style={{ ...s.sectionTitle, color: P.emerald }}>✅ Allowed</h2>
              {['Experiences and events','Races and race fees','Race gear','Replacement items (one in, one out)','Essentials fully used up','Event clothing that can be reworn','Groceries','Toiletries','Gas'].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${P.border}`, fontSize: '14px' }}>
                  <span style={{ color: P.emerald }}>✓</span> {r}
                </div>
              ))}
            </div>
            <div style={{ ...s.card, borderTop: `4px solid ${P.coral}` }}>
              <h2 style={{ ...s.sectionTitle, color: P.coral }}>🚫 Not Allowed</h2>
              {['Impulse purchases','New clothes unless replacing','New subscriptions','Amazon purchases','TikTok Shop','New food until pantry is used up','Uber/Lyft (use CTA)','Eating out over $150/month'].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${P.border}`, fontSize: '14px' }}>
                  <span style={{ color: P.coral }}>✗</span> {r}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.card, borderTop: `4px solid ${P.lavender}` }}>
            <h2 style={{ ...s.sectionTitle, color: P.lavender }}>💜 Budget Snapshot</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
              {[['Income', 4453, P.emerald],['Home Essentials', 2418, P.coral],['Food', 480, P.yellow],['Debt Payments', 1136.95, P.coral],['Lifestyle', 245.98, P.lavender],['Wellbeing', 122, P.sky]].map(([label, amt, color]) => (
                <div key={label} style={{ background: color + '12', border: `1.5px solid ${color}30`, borderRadius: '14px', padding: '14px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: label === 'Income' ? P.emerald : P.amber }}>${Number(amt).toLocaleString()}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: P.muted, marginTop: '3px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#faf5ff)', borderRadius: '14px', padding: '18px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '28px', fontWeight: 800, color: P.emerald }}>$531</div><div style={{ fontSize: '13px', color: P.muted, fontWeight: 600 }}>freed up / month</div></div>
              <div><div style={{ fontSize: '28px', fontWeight: 800, color: P.emerald }}>$6,378</div><div style={{ fontSize: '13px', color: P.muted, fontWeight: 600 }}>freed up / year</div></div>
            </div>
          </div>

          <div style={{ ...s.card, borderTop: `4px solid ${P.amber}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ ...s.sectionTitle, color: P.amber, marginBottom: '4px' }}>🎯 Debt Avalanche</h2>
                <p style={{ margin: 0, fontSize: '13px', color: P.muted }}>Highest APR first — the fastest path to freedom</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: P.amber }}>${DEBT_TOTAL.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: P.muted, fontWeight: 600 }}>total remaining</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {DEBT.map((d, i) => {
                const pct = Math.round(d.balance / DEBT_TOTAL * 100)
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>{d.name}</span>
                        <span style={{ fontSize: '12px', background: P.amber + '20', color: P.amber, padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>{d.apr}% APR</span>
                        {i === 0 && <span style={{ fontSize: '11px', background: P.emerald + '20', color: P.emerald, padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>ATTACK FIRST</span>}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: P.amber }}>${d.balance.toLocaleString()}</span>
                    </div>
                    <div style={{ background: P.border, borderRadius: '999px', height: '10px' }}>
                      <div style={{ background: i === 0 ? `linear-gradient(90deg,${P.amber},${P.gold})` : `linear-gradient(90deg,${P.lavender},${P.blush})`, width: pct + '%', height: '100%', borderRadius: '999px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: P.muted, marginTop: '4px' }}>${d.balance.toLocaleString()} remaining · {pct}% of total</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>)}
      </main>

      {/* ── Listing Modal ── */}
      {listingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(61,44,44,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(251,113,133,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>✨ Poshmark Listing</h3>
              <button onClick={() => setListingModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: P.muted }}>✕</button>
            </div>
            <textarea value={listingModal.text} readOnly style={{ ...s.input, height: '240px', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => navigator.clipboard.writeText(listingModal.text)} style={s.btn(P.coral)}>📋 Copy</button>
              <button onClick={() => setListingModal(null)} style={s.btn('#e2e8f0', P.text)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
