import { useIsMobile } from '../../hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useAuth }     from '../../context/AuthContext'
import { useCart }     from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency()
  return (
    <div style={{ display: 'flex', gap: '2px', background: '#f0e8e4', borderRadius: '4px', padding: '3px' }}>
      {['INR','USD','GBP','EUR'].map(c => (
        <button key={c} onClick={() => setCurrency(c)}
          style={{ padding: '3px 7px', fontSize: '10px', border: 'none', cursor: 'pointer', fontFamily: S.sans, borderRadius: '3px', background: currency === c ? S.dark : 'transparent', color: currency === c ? '#fff' : S.muted, transition: 'all .15s' }}>
          {c === 'INR' ? '₹' : c === 'USD' ? '$' : c === 'GBP' ? '£' : '€'}
        </button>
      ))}
    </div>
  )
}

export default function OrderSuccess() {
  const navigate           = useNavigate()
  const { user, role, signOut } = useAuth()
  const { totalItems }     = useCart()
  const { wishlist }       = useWishlist()

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: S.sans, overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        AUTHENTIC NORTHEAST INDIA · 50+ VERIFIED ARTISANS
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CurrencyToggle />

          {/* Wishlist */}
          <span onClick={() => navigate('/wishlist')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🤍
            {wishlist.length > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
                {wishlist.length}
              </span>
            )}
          </span>

          {/* Cart */}
          <span onClick={() => navigate('/cart')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🛒
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
                {totalItems}
              </span>
            )}
          </span>

          {/* Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
                {user.email?.split('@')[0] || user.phone}
              </span>
              {role === 'seller' && (
                <span onClick={() => navigate('/seller/dashboard')}
                  style={{ fontSize: '11px', color: S.accent, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>
                  MY DASHBOARD
                </span>
              )}
              {user?.email === 'bikidutta319@gmail.com' && (
                <span onClick={() => navigate('/admin')}
                  style={{ fontSize: '11px', color: S.gold, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>
                  ADMIN ⚙️
                </span>
              )}
              <button onClick={signOut}
                style={{ fontSize: '11px', letterSpacing: '.08em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '7px 12px', cursor: 'pointer', fontFamily: S.sans }}>
                SIGN OUT
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')}
              style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              SIGN IN
            </button>
          )}
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
            Thank you for supporting Northeast Indian artisans. Your order has been received and the artisan has been notified. You'll receive a confirmation email shortly.
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