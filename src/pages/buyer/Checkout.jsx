import { useState, useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import { useCart }     from '../../context/CartContext'
import { useAuth }     from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'
import { supabase }    from '../../lib/supabase'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

// ── COD settings ──
const COD_LIMIT = 2000   // COD only available for orders at/under this amount
const COD_FEE   = 40     // extra fee added to COD orders

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

export default function Checkout() {
  const isMobile = useIsMobile()

  const navigate                         = useNavigate()
  const { cart, totalAmount, clearCart } = useCart()
  const { user, role, signOut }          = useAuth()
  const { wishlist }                     = useWishlist()
  const [loading, setLoading]            = useState(false)
  const [payMethod, setPayMethod]        = useState('online')   // 'online' | 'cod'
  const [form,    setForm]               = useState({
    name: '', phone: '', address: '',
    city: '', state: '', pincode: ''
  })

  // Saved addresses (auto-fill)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddrId, setSelectedAddrId] = useState(null)

  useEffect(() => {
    if (!user) return
    loadAddresses()
  }, [user])

  async function loadAddresses() {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    const list = data || []
    setSavedAddresses(list)
    // Pre-select the default (or first) address so the form is ready to go
    const preferred = list.find(a => a.is_default) || list[0]
    if (preferred) selectAddress(preferred)
  }

  function selectAddress(a) {
    setSelectedAddrId(a.id)
    setForm({
      name:    a.name    || '',
      phone:   a.phone   || '',
      address: a.address || '',
      city:    a.city    || '',
      state:   a.state   || '',
      pincode: a.pincode || '',
    })
  }

  function useNewAddress() {
    setSelectedAddrId(null)
    setForm({ name: '', phone: '', address: '', city: '', state: '', pincode: '' })
  }

  const shipping     = totalAmount >= 999 ? 0 : 99
  // COD only allowed at/under the limit
  const codAvailable = totalAmount <= COD_LIMIT
  // If COD selected (and allowed), add the COD fee
  const codFee       = (payMethod === 'cod' && codAvailable) ? COD_FEE : 0
  const total        = totalAmount + shipping + codFee

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validateForm() {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      alert('Please fill in all delivery details')
      return false
    }
    return true
  }

  // Shared: saves order + items. status differs for online vs cod.
  async function saveOrder({ status, paymentId, orderId, method }) {
    const { data: order } = await supabase
      .from('orders')
      .insert({
        buyer_id:            user?.id,
        buyer_email:         user?.email || null,
        total_amount:        total,
        status:              status,            // 'paid' for online, 'cod_pending' for COD
        payment_method:      method,            // 'online' | 'cod'
        shipping_address:    JSON.stringify(form),
        razorpay_order_id:   orderId || null,
        razorpay_payment_id: paymentId || null,
      })
      .select()
      .single()

    if (order) {
      await supabase.from('order_items').insert(
        cart.map(item => ({
          order_id:        order.id,
          product_id:      item.id,
          seller_id:       item.seller_id || null,
          quantity:        item.qty,
          price:           item.price,
          seller_amount:   Math.round(item.price * item.qty * 0.9),
          platform_amount: Math.round(item.price * item.qty * 0.1),
          payout_status:   'pending',
        }))
      )
    }
    return order
  }

  async function sendEmails() {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       'order_confirmation',
          buyerEmail: user?.email,
          buyerName:  form.name,
          order:      { total },
          items:      cart.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
        })
      })
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:       'new_order_seller',
          buyerEmail: user?.email,
          buyerName:  form.name,
          order:      { total },
          items:      cart.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
        })
      })
    } catch (emailErr) {
      console.log('Email failed silently:', emailErr)
    }
  }

  // ── ONLINE PAYMENT (Razorpay) ──
  async function handleOnlinePayment() {
    if (!validateForm()) return
    setLoading(true)

    const options = {
      key:      import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:   total * 100,
      currency: 'INR',
      name:     'Bihaan',
      description: `Order of ${cart.length} item${cart.length > 1 ? 's' : ''}`,

      handler: async function (response) {
        await saveOrder({
          status:    'paid',
          method:    'online',
          paymentId: response.razorpay_payment_id,
          orderId:   response.razorpay_order_id || 'test',
        })
        await sendEmails()
        clearCart()
        navigate('/order-success')
      },

      prefill: {
        name:    form.name,
        contact: form.phone,
        email:   user?.email || '',
      },
      theme: { color: '#8b2500' },
      modal: { ondismiss: () => setLoading(false) }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
    setLoading(false)
  }

  // ── CASH ON DELIVERY (no Razorpay) ──
  async function handleCOD() {
    if (!validateForm()) return
    setLoading(true)
    try {
      const order = await saveOrder({
        status: 'cod_pending',   // cash NOT yet collected
        method: 'cod',
      })
      if (order) {
        await sendEmails()
        clearCart()
        navigate('/order-success')
      } else {
        alert('Could not place order. Please try again.')
      }
    } catch (err) {
      console.log('COD order failed:', err)
      alert('Could not place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handlePlaceOrder() {
    if (payMethod === 'cod' && codAvailable) {
      handleCOD()
    } else {
      handleOnlinePayment()
    }
  }

  if (cart.length === 0) {
    return (
      <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: S.serif, fontSize: '1.4rem', color: S.dark, marginBottom: '12px' }}>Your cart is empty</p>
          <button onClick={() => navigate('/products')}
            style={{ background: S.dark, color: '#fff', padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
            EXPLORE PRODUCTS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh', overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        SECURE CHECKOUT · AUTHENTIC NORTHEAST INDIA
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <p style={{ fontSize: '12px', letterSpacing: '.15em', color: S.muted, fontFamily: S.sans }}>🔒 SECURE CHECKOUT</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CurrencyToggle />
          <span onClick={() => navigate('/wishlist')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🤍
            {wishlist.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>{wishlist.length}</span>}
          </span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>{user.email?.split('@')[0] || user.phone}</span>
              {role === 'seller' && <span onClick={() => navigate('/seller/dashboard')} style={{ fontSize: '11px', color: S.accent, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>MY DASHBOARD</span>}
              {user?.email === 'bikidutta319@gmail.com' && <span onClick={() => navigate('/admin')} style={{ fontSize: '11px', color: S.gold, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>ADMIN ⚙️</span>}
              <button onClick={() => navigate('/cart')} style={{ fontSize: '11px', letterSpacing: '.08em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>← CART</button>
            </div>
          ) : (
            <button onClick={() => navigate('/cart')} style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>← BACK TO CART</button>
          )}
        </div>
      </nav>

      <div style={{ padding: '14px 40px', background: S.white, borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '.08em', color: S.muted, fontFamily: S.sans }}>
          CART → <span style={{ color: S.accent }}>DELIVERY</span> → PAYMENT
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: '40px', alignItems: 'start' }}>

        {/* Delivery form */}
        <div>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>
            Delivery details
          </h2>

          {/* Saved addresses — auto-fill (only for logged-in buyers who have some) */}
          {user && savedAddresses.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, marginBottom: '10px', fontFamily: S.sans }}>SAVED ADDRESSES</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                {savedAddresses.map(a => {
                  const selected = selectedAddrId === a.id
                  return (
                    <div key={a.id} onClick={() => selectAddress(a)}
                      style={{ border: `1px solid ${selected ? S.accent : S.border}`, background: selected ? '#fef9f7' : S.white, borderRadius: '4px', padding: '12px 14px', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', letterSpacing: '.08em', color: selected ? S.accent : S.muted, fontFamily: S.sans, fontWeight: 600 }}>{(a.label || 'ADDRESS').toUpperCase()}</span>
                        {a.is_default && <span style={{ fontSize: '9px', color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', padding: '1px 6px', fontFamily: S.sans }}>DEFAULT</span>}
                        {selected && <span style={{ marginLeft: 'auto', fontSize: '12px', color: S.accent }}>✓</span>}
                      </div>
                      <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, marginBottom: '2px' }}>{a.name} · {a.phone}</p>
                      <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, lineHeight: 1.5 }}>
                        {[a.address, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )
                })}

                {/* New address option */}
                <div onClick={useNewAddress}
                  style={{ border: `1px dashed ${selectedAddrId === null ? S.accent : S.border}`, background: selectedAddrId === null ? '#fef9f7' : S.white, borderRadius: '4px', padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '64px' }}>
                  <span style={{ fontSize: '12px', color: selectedAddrId === null ? S.accent : S.muted, fontFamily: S.sans, letterSpacing: '.05em' }}>+ ENTER A NEW ADDRESS</span>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: S.muted, marginTop: '8px', fontFamily: S.sans }}>
                Pick one to fill the form below — you can still edit any field.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>FULL NAME *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>PHONE NUMBER *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>FULL ADDRESS *</label>
              <textarea name="address" value={form.address} onChange={handleChange} placeholder="House no., Street, Area, Landmark"
                rows={3}
                style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>CITY *</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="City"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>STATE *</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="State"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }}>PINCODE *</label>
                <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="000000"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
            </div>
          </div>

          {/* Payment method selector */}
          <div style={{ marginTop: '32px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, marginBottom: '12px', fontFamily: S.sans }}>PAYMENT METHOD</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Online */}
              <div onClick={() => setPayMethod('online')}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: `1px solid ${payMethod === 'online' ? S.accent : S.border}`, background: payMethod === 'online' ? '#fef9f7' : S.white, borderRadius: '4px', cursor: 'pointer' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${payMethod === 'online' ? S.accent : S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {payMethod === 'online' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: S.accent }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>Pay Online</p>
                  <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>UPI, Card, Net Banking, Wallets · Secured by Razorpay</p>
                </div>
              </div>

              {/* COD */}
              <div onClick={() => codAvailable && setPayMethod('cod')}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: `1px solid ${payMethod === 'cod' && codAvailable ? S.accent : S.border}`, background: payMethod === 'cod' && codAvailable ? '#fef9f7' : S.white, borderRadius: '4px', cursor: codAvailable ? 'pointer' : 'not-allowed', opacity: codAvailable ? 1 : 0.55 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${payMethod === 'cod' && codAvailable ? S.accent : S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {payMethod === 'cod' && codAvailable && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: S.accent }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>Cash on Delivery</p>
                  {codAvailable ? (
                    <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>Pay ₹{COD_FEE} extra · Pay cash when your order arrives</p>
                  ) : (
                    <p style={{ fontSize: '11px', color: S.accent, fontFamily: S.sans }}>Not available for orders above ₹{COD_LIMIT.toLocaleString()}</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '28px', position: 'sticky', top: '80px' }}>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.3rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>
            Order summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${S.border}` }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: item.bg || '#f8f4ef', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {item.images?.[0]
                    ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '20px', opacity: .6 }}>{item.emoji || '🛍️'}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, marginBottom: '2px' }}>{item.name}</p>
                  <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>Qty: {item.qty}</p>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>
                  ₹{(item.price * item.qty).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: S.sans }}>
              <span style={{ color: S.muted }}>Subtotal</span>
              <span style={{ color: S.dark }}>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: S.sans }}>
              <span style={{ color: S.muted }}>Shipping</span>
              <span style={{ color: shipping === 0 ? '#2d6a4f' : S.dark }}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            {codFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: S.sans }}>
                <span style={{ color: S.muted }}>COD fee</span>
                <span style={{ color: S.dark }}>₹{codFee}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>Total</span>
            <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>₹{total.toLocaleString()}</span>
          </div>

          <button onClick={handlePlaceOrder} disabled={loading}
            style={{ width: '100%', background: loading ? '#888' : S.accent, color: '#fff', padding: '14px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans, marginBottom: '12px', transition: 'background .2s' }}>
            {loading
              ? 'PROCESSING...'
              : (payMethod === 'cod' && codAvailable)
                ? `PLACE ORDER · PAY ₹${total.toLocaleString()} ON DELIVERY`
                : `PAY ₹${total.toLocaleString()}`}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['🔒 Payments secured by Razorpay', '✓ Verified artisans', '⟳ Easy returns within 7 days'].map(t => (
              <p key={t} style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>{t}</p>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}