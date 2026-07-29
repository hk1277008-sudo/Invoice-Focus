import { useMemo, useState } from 'react'

type TemplateId =
  | 'modern'
  | 'minimal'
  | 'corporate'
  | 'executive'
  | 'elegant'
  | 'creative'
  | 'clean'
  | 'professional'

const templates: Array<{ id: TemplateId; name: string; tier: string; description: string }> = [
  { id: 'modern', name: 'Modern', tier: 'Free', description: 'Confident color rail with crisp metrics.' },
  { id: 'minimal', name: 'Minimal', tier: 'Free', description: 'Quiet whitespace and editorial precision.' },
  { id: 'corporate', name: 'Corporate', tier: 'Pro', description: 'Structured sections for larger teams.' },
  { id: 'executive', name: 'Executive', tier: 'Pro', description: 'High-trust dark header and premium hierarchy.' },
  { id: 'elegant', name: 'Elegant', tier: 'Pro', description: 'Serif-led details with refined contrast.' },
  { id: 'creative', name: 'Creative', tier: 'Premium', description: 'Expressive blocks for studios and makers.' },
  { id: 'clean', name: 'Clean', tier: 'Premium', description: 'Airy utility with an efficient table.' },
  { id: 'professional', name: 'Professional', tier: 'Premium', description: 'Balanced all-rounder for every client.' },
]

const sampleItems = [
  ['Brand strategy workshop', '12 hrs', '$1,800.00'],
  ['Visual identity system', '1', '$2,400.00'],
  ['Launch collateral', '1', '$950.00'],
]

const swatches = ['#2e5bff', '#13a6a6', '#8a5cf6', '#d97745', '#1d2939']

export function InvoiceTemplates() {
  const initialTemplate = new URLSearchParams(window.location.search).get('template') as TemplateId | null
  const [selected, setSelected] = useState<TemplateId>(templates.some((template) => template.id === initialTemplate) ? initialTemplate! : 'modern')
  const [primary, setPrimary] = useState('#2e5bff')
  const [accent, setAccent] = useState('#13a6a6')
  const [font, setFont] = useState('Inter')
  const [header, setHeader] = useState('Split')
  const [footer, setFooter] = useState('Simple')
  const current = templates.find((template) => template.id === selected)!

  const style = useMemo(
    () =>
      ({
        '--primary': primary,
        '--accent': accent,
        '--font': font === 'Fraunces' ? "'Fraunces', Georgia, serif" : font === 'DM Mono' ? "'DM Mono', monospace" : "'Inter', system-ui, sans-serif",
      }) as React.CSSProperties,
    [accent, font, primary],
  )

  return (
    <main className="min-h-screen bg-[#eef2f7] p-5 text-[#172033]" style={style}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        button, select { font: inherit; }
        .invoice-paper { font-family: var(--font); }
        .template-button:focus-visible, .control:focus-visible { outline: 3px solid color-mix(in srgb, var(--primary) 35%, white); outline-offset: 2px; }
        .template-button[data-active="true"] { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, white); box-shadow: 0 10px 24px rgba(28, 43, 69, .08); }
        .template-button[data-active="true"] .template-dot { background: var(--primary); }
        .invoice-table th { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: #7c8798; text-align: left; padding: 10px 0; }
        .invoice-table td { border-top: 1px solid #e9edf3; padding: 13px 0; font-size: 11px; }
        .invoice-table .num { text-align: right; font-variant-numeric: tabular-nums; }
        .tag { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 9px; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      `}</style>
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#748198]">Sprint 10 / Template Studio</p>
            <h1 className="text-2xl font-bold tracking-[-.04em]">Professional invoice templates</h1>
            <p className="mt-1 text-sm text-[#748198]">Compare layouts, then shape the system around your brand.</p>
          </div>
          <div className="rounded-full border border-[#dce3ec] bg-white px-3 py-2 text-xs font-semibold text-[#526177]">
            Live preview · A4 / Letter safe
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[260px_minmax(540px,1fr)_280px]">
          <aside className="rounded-2xl border border-[#dce3ec] bg-white p-3 shadow-[0_10px_30px_rgba(28,43,69,.05)]">
            <div className="mb-3 px-2">
              <p className="text-xs font-bold">Template library</p>
              <p className="mt-1 text-[11px] leading-4 text-[#7c8798]">Every layout stays readable when printed.</p>
            </div>
            <div className="space-y-1.5">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="template-button flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition"
                  data-active={selected === template.id}
                  onClick={() => setSelected(template.id)}
                  aria-pressed={selected === template.id}
                >
                  <span className="template-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#c8d0dc]" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{template.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b96a6]">{template.tier}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#8893a4]">{template.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 rounded-2xl border border-[#dce3ec] bg-[#dfe5ed] p-4 shadow-[0_10px_30px_rgba(28,43,69,.05)] sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold">{current.name} template</p>
                <p className="text-[10px] text-[#718096]">{current.description}</p>
              </div>
              <span className="tag" style={{ background: `${primary}16`, color: primary }}>Selected</span>
            </div>
            <InvoicePaper template={selected} primary={primary} accent={accent} header={header} footer={footer} />
          </div>

          <aside className="rounded-2xl border border-[#dce3ec] bg-white p-4 shadow-[0_10px_30px_rgba(28,43,69,.05)]">
            <div className="mb-4">
              <p className="text-xs font-bold">Brand controls</p>
              <p className="mt-1 text-[11px] leading-4 text-[#7c8798]">Changes apply instantly to the preview.</p>
            </div>
            <div className="space-y-5">
              <ColorControl label="Primary color" value={primary} onChange={setPrimary} />
              <ColorControl label="Accent color" value={accent} onChange={setAccent} />
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-[#7c8798]">Font family</span>
                <select className="control w-full rounded-lg border border-[#dce3ec] bg-white px-3 py-2 text-xs" value={font} onChange={(event) => setFont(event.target.value)}>
                  <option>Inter</option>
                  <option>Fraunces</option>
                  <option>DM Mono</option>
                </select>
              </label>
              <SegmentControl label="Header layout" value={header} options={['Split', 'Centered', 'Band']} onChange={setHeader} />
              <SegmentControl label="Footer layout" value={footer} options={['Simple', 'Detailed', 'Bar']} onChange={setFooter} />
              <div className="border-t border-[#edf0f4] pt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#7c8798]">Quick palette</p>
                <div className="flex gap-2">
                  {swatches.map((swatch) => (
                    <button key={swatch} type="button" aria-label={`Use ${swatch} as primary color`} className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-[#d9e0e9]" style={{ background: swatch }} onClick={() => setPrimary(swatch)} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold">{label}</span>
      <span className="flex items-center gap-2 rounded-lg border border-[#dce3ec] bg-white p-1.5">
        <input className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} />
        <span className="font-mono text-[10px] uppercase text-[#7c8798]">{value}</span>
      </span>
    </label>
  )
}

function SegmentControl({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#7c8798]">{label}</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#f1f4f8] p-1">
        {options.map((option) => (
          <button key={option} type="button" className="rounded-md px-1 py-1.5 text-[10px] font-semibold transition" style={value === option ? { background: 'white', color: 'var(--primary)', boxShadow: '0 1px 4px rgba(28,43,69,.1)' } : { color: '#7c8798' }} onClick={() => onChange(option)} aria-pressed={value === option}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function InvoicePaper({ template, primary, accent, header, footer }: { template: TemplateId; primary: string; accent: string; header: string; footer: string }) {
  const isDark = template === 'executive'
  const isSerif = template === 'elegant'
  const paperClass = `invoice-paper relative mx-auto min-h-[700px] max-w-[560px] overflow-hidden bg-white p-7 text-[#172033] shadow-[0_18px_40px_rgba(29,45,69,.15)] sm:p-10 ${isSerif ? "font-['Fraunces',Georgia,serif]" : ''}`
  const title = template === 'creative' ? 'INVOICE / 2026' : 'INVOICE'
  const tableStyle = template === 'corporate' || template === 'professional' ? { borderTop: `3px solid ${primary}` } : undefined

  return (
    <article className={paperClass} style={isDark ? { background: '#182337', color: '#f5f8fc' } : undefined}>
      {template === 'creative' && <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20" style={{ background: accent }} />}
      {template === 'modern' && <div className="absolute left-0 top-0 h-full w-2" style={{ background: primary }} />}
      {template === 'corporate' && <div className="absolute left-0 top-0 h-2 w-full" style={{ background: primary }} />}
      <div className={`relative flex justify-between gap-6 ${header === 'Centered' ? 'text-center' : ''} ${header === 'Band' ? 'rounded-xl p-5 text-white' : ''}`} style={header === 'Band' ? { background: primary } : undefined}>
        <div className={header === 'Centered' ? 'mx-auto' : ''}>
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white" style={{ background: accent }}>IF</div>
            <span className="text-sm font-extrabold tracking-[-.04em]">InvoiceFocus</span>
          </div>
          <h2 className={`text-xl font-extrabold tracking-[-.05em] ${isDark || header === 'Band' ? 'text-white' : ''}`}>Northstar Studio</h2>
          <p className={`mt-1 max-w-[190px] whitespace-pre-line text-[10px] leading-4 ${isDark || header === 'Band' ? 'text-white/65' : 'text-[#7c8798]'}`}>Design systems & digital products{'\n'}hello@northstar.studio</p>
        </div>
        <div className={`text-right ${header === 'Centered' ? 'hidden' : ''}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[.2em] ${isDark || header === 'Band' ? 'text-white/60' : 'text-[#7c8798]'}`}>{title}</p>
          <p className={`mt-2 text-2xl font-black tracking-[-.06em] ${isDark || header === 'Band' ? 'text-white' : ''}`}>#2048</p>
          <span className="tag mt-2" style={{ background: isDark || header === 'Band' ? '#ffffff22' : `${primary}16`, color: isDark || header === 'Band' ? 'white' : primary }}>Due Apr 30</span>
        </div>
      </div>

      <div className={`relative mt-10 grid grid-cols-2 gap-4 border-y py-4 ${isDark ? 'border-white/10' : 'border-[#edf0f4]'}`}>
        <div><p className={`text-[9px] font-bold uppercase tracking-[.16em] ${isDark ? 'text-white/45' : 'text-[#8b96a6]'}`}>Bill to</p><p className="mt-1 text-xs font-bold">Aperture Labs</p><p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-[#7c8798]'}`}>New York, NY</p></div>
        <div className="text-right"><p className={`text-[9px] font-bold uppercase tracking-[.16em] ${isDark ? 'text-white/45' : 'text-[#8b96a6]'}`}>Issued</p><p className="mt-1 text-xs font-bold">Apr 01, 2026</p><p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-[#7c8798]'}`}>Net 30 · USD</p></div>
      </div>

      <table className={`invoice-table relative mt-7 w-full ${isDark ? '[&_*]:border-white/10' : ''}`} style={tableStyle}>
        <thead><tr><th>Description</th><th className="num">Qty</th><th className="num">Amount</th></tr></thead>
        <tbody>{sampleItems.map(([name, qty, amount]) => <tr key={name}><td><p className="font-bold">{name}</p><p className={`mt-0.5 text-[10px] ${isDark ? 'text-white/55' : 'text-[#8b96a6]'}`}>Strategy & production</p></td><td className="num">{qty}</td><td className="num font-bold">{amount}</td></tr>)}</tbody>
      </table>

      <div className={`relative mt-6 ml-auto max-w-[220px] space-y-2 text-[11px] ${isDark ? 'text-white/60' : 'text-[#7c8798]'}`}>
        <div className="flex justify-between"><span>Subtotal</span><span>$5,150.00</span></div>
        <div className="flex justify-between"><span>Tax · 8.5%</span><span>$437.75</span></div>
        <div className={`flex justify-between border-t pt-3 text-sm font-extrabold ${isDark ? 'border-white/15 text-white' : 'border-[#dce3ec] text-[#172033]'}`}><span>Total due</span><span style={{ color: isDark ? '#fff' : primary }}>$5,587.75</span></div>
      </div>

      <div className={`relative mt-12 border-t pt-4 text-[10px] ${isDark ? 'border-white/10 text-white/50' : 'border-[#edf0f4] text-[#8b96a6]'}`}>
        {footer === 'Bar' ? <div className="rounded-lg px-3 py-2 text-white" style={{ background: accent }}>Thank you for your business · northstar.studio</div> : footer === 'Detailed' ? <div className="flex justify-between gap-4"><span>Payment details available on request.</span><span className="text-right">Northstar Studio · Confidential</span></div> : <span>Thank you for your business.</span>}
      </div>
    </article>
  )
}