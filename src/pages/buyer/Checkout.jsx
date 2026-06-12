import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function Checkout() {
  const navigate                         = useNavigate()
  const { cart, totalAmount, clearCart } = useCart()
  const { user }                         = useAuth()
  const [loading, setLoading]            = useState(false)
  const [form,    setForm]               = useState({
    name: '', phone: '', address: '',
    city: '', state: '', pincode: ''
  })

  const shipping = totalAmount >= 999 ? 0 : 99
  const total    = totalAmount + shipping

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function saveOrder(paymentId, orderId) {
    const { data: order } = await supabase
      .from('orders')
      .insert({
        buyer_id:            user?.id,
        total_amount:        total,
        status:              'paid',
        shipping_address:    JSON.stringify(form),
        razorpay_order_id:   orderId,
        razorpay_payment_id: paymentId,
      })
      .select()
      .single()

    if (order) {
      await supabase.from('order_items').insert(
        cart.map(item => ({
          order_id:        order.id,
          product_id:      item.id,
          seller_id:       null,
          quantity:        item.qty,
          price:           item.price,
          seller_amount:   Math.round(item.price * 0.9),
          platform_amount: Math.round(item.price * 0.1),
        }))
      )
    }
    return order
  }

  async function handlePayment() {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      alert('Please fill in all delivery details')
      return
    }

    setLoading(true)

    const options = {
      key:      import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount:   total * 100,
      currency: 'INR',
      name:     'Bihaan',
      description: `Order of ${cart.length} item${cart.length > 1 ? 's' : ''}`,

      handler: async function (response) {
        await saveOrder(response.razorpay_payment_id, response.razorpay_order_id || 'test')

        // Send emails
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
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        SECURE CHECKOUT · AUTHENTIC NORTHEAST INDIA
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <p style={{ fontSize: '12px', letterSpacing: '.15em', color: S.muted, fontFamily: S.sans }}>
          🔒 SECURE CHECKOUT
        </p>
        <button onClick={() => navigate('/cart')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK TO CART
        </button>
      </nav>

      <div style={{ padding: '14px 40px', background: S.white, borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '.08em', color: S.muted, fontFamily: S.sans }}>
          CART → <span style={{ color: S.accent }}>DELIVERY</span> → PAYMENT
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>

        {/* Delivery form */}
        <div>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>
            Delivery details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

          <div style={{ marginTop: '32px', padding: '20px', background: S.white, border: `1px solid ${S.border}` }}>
            <p style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, marginBottom: '12px', fontFamily: S.sans }}>ACCEPTED PAYMENTS</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallets'].map(p => (
                <span key={p} style={{ fontSize: '11px', padding: '4px 10px', border: `1px solid ${S.border}`, color: S.muted, fontFamily: S.sans }}>{p}</span>
              ))}
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>Total</span>
            <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>₹{total.toLocaleString()}</span>
          </div>

          <button onClick={handlePayment} disabled={loading}
            style={{ width: '100%', background: loading ? '#888' : S.accent, color: '#fff', padding: '14px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans, marginBottom: '12px', transition: 'background .2s' }}>
            {loading ? 'PROCESSING...' : `PAY ₹${total.toLocaleString()}`}
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