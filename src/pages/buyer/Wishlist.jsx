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

export default function Wishlist() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const { user, role, signOut }            = useAuth()
  const { addToCart, totalItems }          = useCart()
  const { wishlist, toggleWishlist }       = useWishlist()
  const { formatPrice }                    = useCurrency()

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans, overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 · AUTHENTIC NORTHEAST INDIA
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Products','Artisans','Our Story','States'].map(item => (
            <span key={item} onClick={() => item === 'Products' && navigate('/products')}
              style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CurrencyToggle />
          <span onClick={() => navigate('/wishlist')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            ❤️
            {wishlist.length > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>{wishlist.length}</span>
            )}
          </span>
          <span onClick={() => navigate('/cart')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🛒
            {totalItems > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>{totalItems}</span>
            )}
          </span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>{user.email.split('@')[0]}</span>
              {role === 'seller' && (
                <span onClick={() => navigate('/seller/dashboard')} style={{ fontSize: '11px', color: S.accent, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>MY DASHBOARD</span>
              )}
              {user?.email === 'bikidutta319@gmail.com' && (
                <span onClick={() => navigate('/admin')} style={{ fontSize: '11px', color: S.gold, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>ADMIN ⚙️</span>
              )}
              <button onClick={signOut} style={{ fontSize: '11px', letterSpacing: '.08em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '7px 12px', cursor: 'pointer', fontFamily: S.sans }}>SIGN OUT</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>SIGN IN</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, marginBottom: '8px', fontFamily: S.sans }}>HOME / WISHLIST</p>
        <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '32px' }}>
          My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
        </h1>

        {wishlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>🤍</p>
            <p style={{ fontFamily: S.serif, fontSize: '1.4rem', color: S.dark, marginBottom: '12px' }}>Your wishlist is empty</p>
            <p style={{ fontSize: '14px', color: S.muted, marginBottom: '28px', fontFamily: S.sans }}>
              Save products you love by clicking the heart icon
            </p>
            <button onClick={() => navigate('/products')}
              style={{ background: S.dark, color: '#fff', padding: '13px 32px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              EXPLORE PRODUCTS
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '24px' }}>
            {wishlist.map(product => (
              <div key={product.id} style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', overflow: 'hidden' }}>
                <div onClick={() => navigate(`/product/${product.id}`)}
                  style={{ aspectRatio: '3/4', background: product.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ fontSize: '56px', opacity: .6 }}>{product.emoji}</span>
                  {product.stock <= 3 && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(26,18,8,0.85)', color: '#fff', fontSize: '9px', padding: '3px 7px', fontFamily: S.sans }}>
                      ONLY {product.stock} LEFT
                    </div>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '4px', fontFamily: S.sans }}>{product.state?.toUpperCase()}</p>
                  <p style={{ fontFamily: S.serif, fontSize: '15px', color: S.dark, marginBottom: '4px' }}>{product.name}</p>
                  <p style={{ fontSize: '11px', color: S.muted, marginBottom: '12px', fontFamily: S.sans }}>by {product.seller}</p>
                  <p style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark, marginBottom: '12px' }}>{formatPrice(product.price)}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => addToCart(product, 1)}
                      style={{ flex: 1, background: S.dark, color: '#fff', padding: '10px', fontSize: '11px', letterSpacing: '.08em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                      ADD TO CART
                    </button>
                    <button onClick={() => toggleWishlist(product)}
                      style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '14px', borderRadius: '3px' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: isMobile ? '16px' : '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <div style={{ fontFamily: S.serif, fontSize: '17px', color: S.accent, fontWeight: 600 }}>Bihaan</div>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>© 2026 BIHAAN · NORTHEAST INDIA</p>
      </footer>
    </div>
  )
}