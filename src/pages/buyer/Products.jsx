import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateQty, totalItems, totalAmount } = useCart()
  const { user, role, signOut } = useAuth()

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 · AUTHENTIC NORTHEAST INDIA
      </div>

      {/* Nav */}
      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Products', 'Artisans', 'Our Story', 'States'].map(item => (
            <span key={item}
              onClick={() => item === 'Products' && navigate('/products')}
              style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>
              {item}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cart icon with count */}
          <span onClick={() => navigate('/cart')}
            style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
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
                {user.email.split('@')[0]}
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

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, marginBottom: '8px', fontFamily: S.sans }}>
            HOME / CART
          </p>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark }}>
            Your cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>
        </div>

        {/* Empty cart */}
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: S.serif, fontSize: '1.4rem', color: S.dark, marginBottom: '12px' }}>
              Your cart is empty
            </p>
            <p style={{ fontSize: '14px', color: S.muted, marginBottom: '28px', fontFamily: S.sans }}>
              Discover handcrafted products from Northeast India
            </p>
            <button onClick={() => navigate('/products')}
              style={{ background: S.dark, color: '#fff', padding: '13px 32px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              EXPLORE PRODUCTS
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px', alignItems: 'start' }}>

            {/* Cart items */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '16px', padding: '0 0 12px', borderBottom: `1px solid ${S.border}` }}>
                {['Product', 'Price', 'Quantity', 'Total'].map(h => (
                  <p key={h} style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, fontFamily: S.sans, textAlign: h !== 'Product' ? 'center' : 'left' }}>{h}</p>
                ))}
              </div>

              {cart.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '16px', padding: '20px 0', borderBottom: `1px solid ${S.border}`, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '72px', height: '72px', borderRadius: '3px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '28px', opacity: .6 }}>{item.emoji}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{item.state?.toUpperCase()}</p>
                      <p style={{ fontFamily: S.serif, fontSize: '15px', color: S.dark, marginBottom: '3px' }}>{item.name}</p>
                      <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>by {item.seller}</p>
                      <button onClick={() => removeFromCart(item.id)}
                        style={{ fontSize: '11px', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.05em', padding: '4px 0', marginTop: '4px' }}>
                        REMOVE
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans, textAlign: 'center' }}>
                    ₹{item.price.toLocaleString()}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${S.border}` }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)}
                      style={{ padding: '6px 10px', background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer', color: S.dark }}>−</button>
                    <span style={{ padding: '6px 12px', fontSize: '13px', color: S.dark, fontFamily: S.sans, minWidth: '32px', textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{ padding: '6px 10px', background: 'transparent', border: 'none', fontSize: '14px', cursor: 'pointer', color: S.dark }}>+</button>
                  </div>

                  <p style={{ fontSize: '14px', fontWeight: 500, color: S.dark, fontFamily: S.sans, textAlign: 'center' }}>
                    ₹{(item.price * item.qty).toLocaleString()}
                  </p>
                </div>
              ))}

              <button onClick={() => navigate('/products')}
                style={{ marginTop: '20px', fontSize: '11px', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.1em' }}>
                ← CONTINUE SHOPPING
              </button>
            </div>

            {/* Order summary */}
            <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '28px', position: 'sticky', top: '80px' }}>
              <h2 style={{ fontFamily: S.serif, fontSize: '1.3rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>
                Order summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${S.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: S.sans }}>
                  <span style={{ color: S.muted }}>Subtotal ({totalItems} items)</span>
                  <span style={{ color: S.dark }}>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: S.sans }}>
                  <span style={{ color: S.muted }}>Shipping</span>
                  <span style={{ color: totalAmount >= 999 ? '#2d6a4f' : S.dark }}>
                    {totalAmount >= 999 ? 'FREE' : '₹99'}
                  </span>
                </div>
                {totalAmount < 999 && (
                  <p style={{ fontSize: '11px', color: S.accent, fontFamily: S.sans }}>
                    Add ₹{(999 - totalAmount).toLocaleString()} more for free shipping
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>Total</span>
                <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>
                  ₹{(totalAmount + (totalAmount >= 999 ? 0 : 99)).toLocaleString()}
                </span>
              </div>

              <button onClick={() => navigate('/checkout')}
                style={{ width: '100%', background: S.accent, color: '#fff', padding: '14px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans, marginBottom: '12px' }}>
                PROCEED TO CHECKOUT
              </button>

              <button onClick={() => navigate('/products')}
                style={{ width: '100%', background: 'transparent', color: S.dark, padding: '13px', fontSize: '12px', letterSpacing: '.12em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
                CONTINUE SHOPPING
              </button>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${S.border}` }}>
                {['🔒 Secure checkout', '✓ Verified artisans', '⟳ Easy returns'].map(t => (
                  <p key={t} style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginBottom: '6px' }}>{t}</p>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
        <div style={{ fontFamily: S.serif, fontSize: '17px', color: S.accent, fontWeight: 600 }}>Bihaan</div>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>© 2026 BIHAAN · NORTHEAST INDIA</p>
      </footer>

    </div>
  )
}