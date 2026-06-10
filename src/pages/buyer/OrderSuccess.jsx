import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function OrderSuccess() {
  const navigate = useNavigate()

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: S.sans }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        AUTHENTIC NORTHEAST INDIA · 50+ VERIFIED ARTISANS
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'inline-block' }}>
          <Logo size={36} showText={true} />
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>

          <div style={{ width: '72px', height: '72px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
            ✓
          </div>

          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '12px' }}>
            Order placed!
          </h1>
          <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.8, marginBottom: '32px', fontFamily: S.sans }}>
            Thank you for supporting Northeast Indian artisans. Your order has been received and the artisan has been notified. You'll receive a confirmation shortly.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/')}
              style={{ background: S.dark, color: '#fff', padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              CONTINUE SHOPPING
            </button>
            <button onClick={() => navigate('/products')}
              style={{ background: 'transparent', color: S.dark, padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
              EXPLORE MORE
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}