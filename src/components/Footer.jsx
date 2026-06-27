// src/components/Footer.jsx
//
// Shared site footer. Replaces the copy-pasted <footer> blocks in Home, Products,
// ProductDetail, OrderSuccess, and Login.
//
// Usage:
//   import Footer from '../../components/Footer'   // adjust depth per file
//   ...
//   <Footer />
//
// The legal links point to /legal (one page, section deep-links). The
// ABOUT/ARTISANS/SELL links point to pages that exist today; CONTACT scrolls to
// nothing yet, so it's left as a mailto you can change.

import { useNavigate } from 'react-router-dom'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function Footer() {
  const navigate = useNavigate()

  const linkStyle = {
    fontSize: '11px', letterSpacing: '.1em', color: S.muted,
    cursor: 'pointer', fontFamily: S.sans, background: 'none', border: 'none', padding: 0,
  }

  // Existing nav-style links (point where it makes sense today)
  const mainLinks = [
    { label: 'PRODUCTS', onClick: () => navigate('/products') },
    { label: 'SELL',     onClick: () => navigate('/seller/register') },
    { label: 'CONTACT',  onClick: () => { window.location.href = 'mailto:support@bihaan.in' } },
  ]

  // Legal links — these pages exist (/legal with section deep-links)
  const legalLinks = [
    { label: 'PRIVACY',   section: 'privacy' },
    { label: 'TERMS',     section: 'terms' },
    { label: 'REFUNDS',   section: 'refund' },
    { label: 'SHIPPING',  section: 'shipping' },
    { label: 'GRIEVANCE', section: 'grievance' },
  ]

  return (
    <footer style={{ background: S.white, borderTop: `1px solid ${S.border}` }}>
      {/* top row: wordmark + main links */}
      <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: `1px solid ${S.border}` }}>
        <div onClick={() => navigate('/')} style={{ fontFamily: S.serif, fontSize: '17px', color: S.accent, fontWeight: 600, cursor: 'pointer' }}>
          Bihaan
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {mainLinks.map(l => (
            <button key={l.label} onClick={l.onClick} style={linkStyle}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* bottom row: legal links + copyright */}
      <div style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', letterSpacing: '.12em', color: '#b0a498', fontFamily: S.sans }}>POLICIES</span>
          {legalLinks.map(l => (
            <button key={l.label} onClick={() => navigate(`/legal?section=${l.section}`)} style={linkStyle}>
              {l.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>
          © 2026 BIHAAN · NORTHEAST INDIA
        </p>
      </div>
    </footer>
  )
}