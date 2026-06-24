// src/components/ExportBar.jsx
//
// Reusable export toolbar: a date-range filter + "Download CSV" + "Print".
// The PARENT owns the data; this is just the controls. Helpers travel with it:
//   - filterByDate(rows, getDate, from, to)
//   - printTable(title, headers, rows, subtitle)

const S = {
    white: '#ffffff', dark: '#1a1208', accent: '#8b2500',
    muted: '#7a6e62', border: '#e2d8ce', bg: '#f8f4ef',
    sans: "'Inter', system-ui, sans-serif",
  }
  
  export function filterByDate(rows, getDate, from, to) {
    if (!from && !to) return rows
    const fromT = from ? new Date(from + 'T00:00:00').getTime()     : -Infinity
    const toT   = to   ? new Date(to   + 'T23:59:59.999').getTime() :  Infinity
    return rows.filter(row => {
      const raw = getDate(row)
      if (!raw) return false
      const t = new Date(raw).getTime()
      return t >= fromT && t <= toT
    })
  }
  
  function escapeHtml(value) {
    const s = (value === null || value === undefined) ? '' : String(value)
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  
  export function printTable(title, headers, rows, subtitle = '') {
    if (!rows || rows.length === 0) { alert('Nothing to print in this range'); return }
  
    const headCells = headers.map(h => `<th>${escapeHtml(h.label)}</th>`).join('')
    const bodyRows  = rows.map(row =>
      '<tr>' + headers.map(h => `<td>${escapeHtml(h.value(row))}</td>`).join('') + '</tr>'
    ).join('')
    const printedOn = new Date().toLocaleString('en-IN')
  
    const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Inter', system-ui, sans-serif; color: #1a1208; padding: 28px; }
      h1 { font-family: 'Playfair Display', Georgia, serif; font-weight: 400; font-size: 22px; margin: 0 0 4px; }
      .sub  { color: #7a6e62; font-size: 12px; margin: 0 0 2px; }
      .meta { color: #7a6e62; font-size: 11px; margin: 0 0 18px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; background: #f8f4ef; color: #7a6e62; font-size: 10px;
           letter-spacing: .06em; text-transform: uppercase; padding: 8px 10px;
           border-bottom: 2px solid #8b2500; }
      td { padding: 8px 10px; border-bottom: 1px solid #e2d8ce; vertical-align: top; }
      tr:nth-child(even) td { background: #faf7f3; }
      @media print { body { padding: 0; } @page { margin: 14mm; } }
    </style>
  </head>
  <body onload="window.print()">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ''}
    <p class="meta">${rows.length} row(s) · printed ${escapeHtml(printedOn)} · Bihaan</p>
    <table>
      <thead><tr>${headCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
  </html>`
  
    const w = window.open('', '_blank')
    if (!w) { alert('Please allow pop-ups for this site to print.'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
  }
  
  export default function ExportBar({
    from, setFrom, to, setTo,
    onDownload, onPrint,
    count, total,
    downloadLabel = 'DOWNLOAD CSV',
  }) {
    const active = Boolean(from || to)
  
    const input = {
      padding: '7px 9px', border: `1px solid ${S.border}`, background: S.white,
      fontSize: '12px', color: S.dark, fontFamily: S.sans, outline: 'none', borderRadius: '3px',
    }
    const btn = {
      fontSize: '11px', letterSpacing: '.08em', color: S.dark, background: S.white,
      border: `1px solid ${S.border}`, padding: '8px 16px', cursor: 'pointer', fontFamily: S.sans,
    }
    const lbl = { fontSize: '10px', letterSpacing: '.1em', color: S.muted, fontFamily: S.sans }
  
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <span style={{ ...lbl, marginRight: 'auto' }}>
          {active ? `SHOWING ${count} OF ${total}` : `${total} TOTAL`}
        </span>
  
        <span style={lbl}>FROM</span>
        <input type="date" value={from} max={to || undefined}
          onChange={e => setFrom(e.target.value)} style={input} />
  
        <span style={lbl}>TO</span>
        <input type="date" value={to} min={from || undefined}
          onChange={e => setTo(e.target.value)} style={input} />
  
        {active && (
          <button onClick={() => { setFrom(''); setTo('') }}
            style={{ ...btn, color: S.accent, border: `1px solid ${S.accent}` }}>
            CLEAR
          </button>
        )}
  
        <button onClick={onPrint} style={btn}>🖨 PRINT</button>
        <button onClick={onDownload} style={btn}>⬇ {downloadLabel}</button>
      </div>
    )
  }