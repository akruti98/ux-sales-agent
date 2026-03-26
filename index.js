// pages/index.js
import { useState, useCallback } from 'react'
import Head from 'next/head'

// ── Constants ────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'all',      label: 'Best Fit',      color: '#1A936F', icon: '✦', price: 'AI picks' },
  { id: 'audit',    label: 'UX Audit',      color: '#FF6B35', icon: '🔍', price: '₹15K–50K' },
  { id: 'landing',  label: 'Landing Page',  color: '#2E86AB', icon: '🎯', price: '₹20K–60K' },
  { id: 'retainer', label: 'UX Consulting', color: '#7B2D8B', icon: '🤝', price: '₹10K–30K/mo' },
]
const BUDGETS    = [{ id: 'mix', label: 'Any Budget', c: '#FF6B35' }, { id: 'small', label: '₹10K–30K', c: '#1A936F' }, { id: 'mid', label: '₹30K–80K', c: '#2E86AB' }, { id: 'premium', label: '₹80K+', c: '#7B2D8B' }]
const INDUSTRIES = ['Any', 'FinTech / BFSI', 'EdTech', 'D2C / E-comm', 'SaaS / B2B', 'Health Tech', 'Real Estate', 'Legal']
const REGIONS    = ['India', 'US', 'UK', 'Global']
const SOURCES    = [
  { id: 'internshala', label: 'Internshala', emoji: '🇮🇳', note: 'Indian jobs & internships' },
  { id: 'wellfound',   label: 'Wellfound',   emoji: '🌐', note: 'Global startup jobs' },
  { id: 'contra',      label: 'Contra',      emoji: '💼', note: 'Freelance projects' },
  { id: 'freelancer',  label: 'Freelancer',  emoji: '🔗', note: 'Freelancer.com RSS' },
]
const SVC_COLORS = { 'UX Audit': '#FF6B35', 'Landing Page': '#2E86AB', 'UX Consulting': '#7B2D8B' }
const BUDGET_LABELS = { small: '₹10K–30K', mid: '₹30K–80K', premium: '₹80K+', mix: 'Flexible' }

// ── Small components ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#888', display: 'inline-block', animation: `sp 1.1s ease-in-out ${i*0.18}s infinite` }} />
      ))}
    </span>
  )
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2000) }}
      style={{ padding: '4px 12px', fontSize: 11, fontFamily: "'DM Mono',monospace", background: done ? '#1A936F' : '#111', color: done ? '#fff' : '#aaa', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
      {done ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function Tag({ label, color }) {
  return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono',monospace", background: color + '18', color, border: `1px solid ${color}35` }}>{label}</span>
}

function FilterBtn({ active, color = '#FF6B35', onClick, children, block }) {
  return (
    <button onClick={onClick} style={{
      display: block ? 'block' : 'inline-block', width: block ? '100%' : undefined,
      padding: '6px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
      border: `1.5px solid ${active ? color : '#222'}`,
      background: active ? color + '14' : 'transparent',
      color: active ? color : '#3a3a3a',
      fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 12, transition: 'all .15s',
      marginBottom: block ? 4 : 0,
    }}>{children}</button>
  )
}

// ── Inbound listing card ──────────────────────────────────────────────────────
function InboundCard({ listing, index }) {
  const [enriched, setEnriched]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [openMsg, setOpenMsg]     = useState(null)
  const [err, setErr]             = useState('')

  const accent = SVC_COLORS[enriched?.suggestedService] || '#2E86AB'
  const srcColor = { Internshala: '#1A936F', Wellfound: '#2E86AB', Contra: '#7B2D8B', 'Freelancer.com': '#FF6B35' }[listing.source] || '#888'

  const enrich = async () => {
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/enrich', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listing }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setEnriched(d.enriched)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }

  const msgs = [
    { id: 'linkedinDM',   icon: '💼', label: 'LinkedIn DM' },
    { id: 'coldEmail',    icon: '📧', label: 'Cold Email'  },
    { id: 'whatsappMsg',  icon: '💬', label: 'WhatsApp'    },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #ECEAE6', overflow: 'hidden', animation: `fsi .3s ease ${Math.min(index,6) * 0.04}s both` }}>
      <div style={{ height: 4, background: `linear-gradient(90deg,${srcColor},${accent})` }} />
      <div style={{ padding: '16px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0F0F0F', fontFamily: "'Fraunces',serif", marginBottom: 2 }}>{listing.title}</div>
            <div style={{ fontSize: 12, color: '#777' }}>{listing.company} · <span style={{ color: srcColor, fontWeight: 600 }}>{listing.source}</span> · {listing.type}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
            <Tag label={listing.budget} color={srcColor} />
            <span style={{ fontSize: 10, color: '#bbb' }}>{listing.postedOn}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 12, color: '#999' }}>
          <span>📍 {listing.location}</span>
          {listing.url && <a href={listing.url} target="_blank" rel="noreferrer" style={{ color: '#2E86AB', textDecoration: 'none' }}>🔗 View listing</a>}
        </div>

        {listing.description && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.55, borderLeft: '2px solid #eee', paddingLeft: 10 }}>
            {listing.description.slice(0, 160)}{listing.description.length > 160 ? '…' : ''}
          </div>
        )}

        {err && <div style={{ fontSize: 12, color: '#ff6060', marginBottom: 8 }}>⚠️ {err}</div>}

        {!enriched ? (
          <button onClick={enrich} disabled={loading} style={{
            width: '100%', padding: '9px', borderRadius: 9, border: 'none',
            background: loading ? '#f5f5f5' : 'linear-gradient(135deg,#FF6B35,#FF9A6C)',
            color: loading ? '#aaa' : '#fff', fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? <><Spinner /> Generating with Gemini…</> : '⚡ Generate My Pitch'}
          </button>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <Tag label={enriched.suggestedService} color={accent} />
              <Tag label={BUDGET_LABELS[enriched.budgetTier] || enriched.budgetTier} color="#888" />
            </div>

            <div style={{ background: '#FFF8F5', border: '1px solid #FFE0CC', borderRadius: 9, padding: '9px 12px', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#FF6B35', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Why You Fit</div>
              <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{enriched.whyFit}</div>
            </div>

            <div style={{ background: '#F4FFF9', border: '1px solid #B8EDCF', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#1A936F', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Their UX Pain</div>
              <div style={{ fontSize: 12, color: '#1a3a2a', lineHeight: 1.5 }}>{enriched.painPoint}</div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {msgs.map(m => enriched[m.id] ? (
                <button key={m.id} onClick={() => setOpenMsg(openMsg === m.id ? null : m.id)} style={{
                  padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                  border: `1.5px solid ${openMsg === m.id ? accent : '#E8E5E0'}`,
                  background: openMsg === m.id ? accent + '10' : '#F7F5F2',
                  color: openMsg === m.id ? accent : '#555',
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: 'all .15s',
                }}>{m.icon} {m.label}</button>
              ) : null)}
            </div>

            {openMsg && enriched[openMsg] && (
              <div style={{ background: '#F7F5F2', border: '1px solid #E5E2DC', borderRadius: 9, padding: '11px 13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>Ready to send</span>
                  <CopyBtn text={enriched[openMsg]} />
                </div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{enriched[openMsg]}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Outbound prospect card ────────────────────────────────────────────────────
function OutboundCard({ p, index }) {
  const [openMsg, setOpenMsg] = useState(null)
  const accent = SVC_COLORS[p.service] || '#FF6B35'

  const msgs = [
    { id: 'linkedinDM',  icon: '💼', label: 'LinkedIn' },
    { id: 'coldEmail',   icon: '📧', label: 'Email'    },
    { id: 'whatsappMsg', icon: '💬', label: 'WhatsApp' },
  ]

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #ECEAE6', overflow: 'hidden', animation: `fsi .3s ease ${Math.min(index,9) * 0.04}s both` }}>
      <div style={{ height: 4, background: accent }} />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 15, color: accent, flexShrink: 0 }}>{(p.name || '?').charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F0F0F', fontFamily: "'Fraunces',serif" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{p.industry} · {p.region}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
            <Tag label={p.service} color={accent} />
            <Tag label={BUDGET_LABELS[p.budgetTier] || p.budgetTier} color="#888" />
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#555', marginBottom: 10, lineHeight: 1.5 }}>{p.tagline}</div>

        <div style={{ background: '#FFF8F5', border: '1px solid #FFE0CC', borderRadius: 9, padding: '9px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#FF6B35', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>Why They Need You Now</div>
          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{p.whyNow}</div>
        </div>

        <div style={{ background: '#F4FFF9', border: '1px solid #B8EDCF', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#1A936F', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 }}>How to Find & Reach Them</div>
          <div style={{ fontSize: 12, color: '#1a3a2a', lineHeight: 1.5 }}>{p.howToFind}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {msgs.map(m => p[m.id] ? (
            <button key={m.id} onClick={() => setOpenMsg(openMsg === m.id ? null : m.id)} style={{
              padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
              border: `1.5px solid ${openMsg === m.id ? accent : '#E8E5E0'}`,
              background: openMsg === m.id ? accent + '10' : '#F7F5F2',
              color: openMsg === m.id ? accent : '#555',
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: 'all .15s',
            }}>{m.icon} {m.label}</button>
          ) : null)}
        </div>

        {openMsg && p[openMsg] && (
          <div style={{ background: '#F7F5F2', border: '1px solid #E5E2DC', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase', letterSpacing: 1 }}>Ready to send</span>
              <CopyBtn text={p[openMsg]} />
            </div>
            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{p[openMsg]}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [mode,     setMode]     = useState('inbound')
  const [service,  setService]  = useState('all')
  const [budget,   setBudget]   = useState('mix')
  const [industry, setIndustry] = useState('Any')
  const [region,   setRegion]   = useState('India')
  const [sources,  setSources]  = useState(['internshala', 'wellfound', 'contra', 'freelancer'])
  const [keyword,  setKeyword]  = useState('UX designer freelance')
  const [loading,  setLoading]  = useState(false)
  const [listings, setListings] = useState([])
  const [prospects,setProspects]= useState([])
  const [summary,  setSummary]  = useState('')
  const [error,    setError]    = useState('')
  const [stats,    setStats]    = useState(null)
  const isInbound = mode === 'inbound'

  const toggleSrc = id => setSources(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const run = useCallback(async () => {
    setLoading(true); setError(''); setListings([]); setProspects([]); setSummary(''); setStats(null)
    try {
      if (isInbound) {
        const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, sources }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Scrape failed')
        if (!d.listings?.length) throw new Error('No listings found. Try different keywords or enable more sources.')
        setListings(d.listings)
        setStats({ count: d.count, sourceCounts: d.sourceCounts, fetchedAt: d.fetchedAt })
      } else {
        const r = await fetch('/api/outbound', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service, budget, industry, region }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to generate prospects')
        setProspects(d.prospects || [])
        setSummary(d.summary || '')
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [isInbound, keyword, sources, service, budget, industry, region])

  return (
    <>
      <Head>
        <title>UX Sales Agent · Akruti Bagla</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0A0A0A;color:#fff;font-family:'DM Sans',sans-serif}
        @keyframes fsi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sp{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#111}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
      `}</style>

      {/* Hero */}
      <div style={{ padding: '38px 24px 26px', textAlign: 'center', borderBottom: '1px solid #161616', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 0%, #FF6B3512 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#FF6B35', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>◈ UX Sales Agent · Powered by Gemini Flash</div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 32, color: '#fff', margin: '0 0 10px', fontWeight: 900, lineHeight: 1.05 }}>
          Freelance Client Finder<br /><em style={{ color: '#FF6B35' }}>Real Leads. Real Pitches.</em>
        </h1>
        <p style={{ color: '#444', fontSize: 13, maxWidth: 420, margin: '0 auto 14px', lineHeight: 1.6 }}>
          Inbound: real jobs scraped live from Internshala, Wellfound, Contra & Freelancer.com<br />
          Outbound: AI-researched warm prospects — 10 per fetch, 3× a day, always free.
        </p>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {SERVICES.slice(1).map(s => <span key={s.id} style={{ padding: '3px 11px', borderRadius: 20, fontSize: 11, fontFamily: "'DM Mono',monospace", background: s.color + '18', color: s.color, border: `1px solid ${s.color}28` }}>{s.icon} {s.label} · {s.price}</span>)}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '22px 16px' }}>

        {/* Mode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[
            { id: 'inbound',  icon: '📢', label: 'Inbound — Live Scrape',     desc: 'Real listings from job platforms', color: '#2E86AB' },
            { id: 'outbound', icon: '🎯', label: 'Outbound — AI Prospects',   desc: '10 warm prospects per fetch',      color: '#FF6B35' },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setListings([]); setProspects([]); setError('') }} style={{
              padding: '13px 15px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${mode === m.id ? m.color : '#1a1a1a'}`,
              background: mode === m.id ? m.color + '10' : '#0f0f0f', transition: 'all .2s',
            }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{m.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: mode === m.id ? m.color : '#444', fontFamily: "'Fraunces',serif" }}>{m.label}</div>
              <div style={{ fontSize: 11, color: mode === m.id ? m.color + '88' : '#2a2a2a', marginTop: 1 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 18, padding: '20px 18px 16px', marginBottom: 14 }}>
          {isInbound ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Search Keyword</div>
                <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && run()}
                  placeholder="e.g. UX designer freelance, UI designer contract India..."
                  style={{ width: '100%', padding: '10px 13px', background: '#0a0a0a', border: '1.5px solid #1e1e1e', borderRadius: 10, color: '#ccc', fontSize: 13, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#FF6B35'}
                  onBlur={e => e.target.style.borderColor = '#1e1e1e'} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Scrape Sources</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {SOURCES.map(s => (
                    <button key={s.id} onClick={() => toggleSrc(s.id)} style={{
                      padding: '8px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      border: `1.5px solid ${sources.includes(s.id) ? '#2E86AB' : '#1e1e1e'}`,
                      background: sources.includes(s.id) ? '#2E86AB12' : 'transparent',
                      transition: 'all .15s',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: sources.includes(s.id) ? '#2E86AB' : '#444', fontFamily: "'DM Sans',sans-serif" }}>{s.emoji} {s.label} {sources.includes(s.id) ? '✓' : ''}</div>
                      <div style={{ fontSize: 10, color: '#333', marginTop: 1 }}>{s.note}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Service</div>
                {SERVICES.map(s => <FilterBtn key={s.id} active={service === s.id} color={s.color} onClick={() => setService(s.id)} block>{s.icon} {s.label}</FilterBtn>)}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Budget</div>
                {BUDGETS.map(b => <FilterBtn key={b.id} active={budget === b.id} color={b.c} onClick={() => setBudget(b.id)} block>{b.label}</FilterBtn>)}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Industry</div>
                {INDUSTRIES.map(i => <FilterBtn key={i} active={industry === i} onClick={() => setIndustry(i)} block>{i}</FilterBtn>)}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Region</div>
                {REGIONS.map(r => <FilterBtn key={r} active={region === r} onClick={() => setRegion(r)} block>{r}</FilterBtn>)}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button onClick={run} disabled={loading || (isInbound && !sources.length)} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: loading ? '#151515' : isInbound ? 'linear-gradient(135deg,#2E86AB,#1A6FAB)' : 'linear-gradient(135deg,#FF6B35,#FF9A6C)',
          color: loading ? '#333' : '#fff',
          fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s',
          boxShadow: loading ? 'none' : '0 4px 24px #FF6B3518', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {loading ? <><Spinner />{isInbound ? ' Scraping live listings…' : ' Finding prospects with Gemini…'}</> : isInbound ? '📢 Scrape Live Job Listings' : '🎯 Find 10 Outbound Prospects'}
        </button>

        {/* Error */}
        {error && <div style={{ marginBottom: 14, padding: '11px 15px', background: '#160606', border: '1px solid #ff444418', borderRadius: 10, color: '#ff6060', fontSize: 13 }}>⚠️ {error}</div>}

        {/* Scrape stats bar */}
        {stats && (
          <div style={{ marginBottom: 14, padding: '9px 14px', background: '#0f0f0f', border: '1px solid #2E86AB28', borderLeft: '3px solid #2E86AB', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <div>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#2E86AB', textTransform: 'uppercase', letterSpacing: 1 }}>Live Scrape — </span>
              <span style={{ fontSize: 12, color: '#555' }}>{stats.count} real listings fetched</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(stats.sourceCounts || {}).map(([src, cnt]) => (
                <span key={src} style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: '#444' }}>{src}: {cnt}</span>
              ))}
            </div>
            <span style={{ fontSize: 10, color: '#333' }}>{new Date(stats.fetchedAt).toLocaleTimeString('en-IN')}</span>
          </div>
        )}

        {/* Outbound summary */}
        {summary && (
          <div style={{ marginBottom: 14, padding: '9px 14px', background: '#0f0f0f', border: '1px solid #1A936F22', borderLeft: '3px solid #1A936F', borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: '#1A936F', textTransform: 'uppercase', letterSpacing: 1 }}>Agent Note — </span>
            <span style={{ fontSize: 12, color: '#444' }}>{summary}</span>
          </div>
        )}

        {/* Results */}
        {listings.length > 0 && (
          <>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: '#fff', fontWeight: 800, marginBottom: 12 }}>📢 {listings.length} Live Listings — Click any to generate your pitch</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listings.map((l, i) => <InboundCard key={l.id || i} listing={l} index={i} />)}
            </div>
          </>
        )}

        {prospects.length > 0 && (
          <>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: '#fff', fontWeight: 800, marginBottom: 12 }}>🎯 {prospects.length} Warm Prospects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prospects.map((p, i) => <OutboundCard key={i} p={p} index={i} />)}
            </div>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <button onClick={run} style={{ padding: '8px 22px', background: 'transparent', border: '1.5px solid #1e1e1e', borderRadius: 10, color: '#444', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.target.style.borderColor = '#FF6B35'; e.target.style.color = '#FF6B35' }}
                onMouseLeave={e => { e.target.style.borderColor = '#1e1e1e'; e.target.style.color = '#444' }}>
                ↻ Fetch 10 More
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
