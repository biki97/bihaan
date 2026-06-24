// src/pages/buyer/Account.jsx
//
// Buyer account hub. Add a route for it, e.g. in your router:
//   <Route path="/account" element={<Account />} />
//
// Requires the RLS policy "buyers view own order items" (see chat) so the
// Orders tab can read the line items of the buyer's own orders.

import { useIsMobile } from '../../hooks/useIsMobile'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

function parseAddress(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) }
  catch { return {} }
}

function statusStyle(status) {
  if (status === 'paid')        return { bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
  if (status === 'cod_pending') return { bg: '#fef5e7', color: '#92400e', border: '#fcd34d' }
  if (status === 'delivered')   return { bg: '#f0fdf4', color: '#15803d', border: '#86efac' }
  if (status === 'cancelled')   return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  return { bg: '#f3f0eb', color: S.muted, border: S.border }
}

export default function Account() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { formatPrice } = useCurrency()

  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [section, setSection] = useState(['orders','addresses','profile'].includes(initialTab) ? initialTab : 'orders')
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadOrders()
  }, [user])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity, seller_amount, platform_amount,
          products ( title, images )
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  // Addresses the buyer has used before (de-duplicated from past orders)
  const savedAddresses = (() => {
    const seen = new Set()
    const list = []
    for (const o of orders) {
      const a = parseAddress(o.shipping_address)
      const key = [a.name, a.phone, a.address, a.city, a.pincode].join('|')
      if (a.address && !seen.has(key)) { seen.add(key); list.push(a) }
    }
    return list
  })()

  const menu = [
    { id: 'orders',    label: 'My Orders',      icon: '📦' },
    { id: 'addresses', label: 'Saved Addresses', icon: '📍' },
    { id: 'profile',   label: 'My Profile',     icon: '👤' },
  ]

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

      {/* Top bar */}
      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
        <button onClick={() => navigate('/products')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          CONTINUE SHOPPING →
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 40px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '8px', fontFamily: S.sans }}>YOUR ACCOUNT</p>
        <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>
          {user?.email?.split('@')[0] || 'My account'}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '230px 1fr', gap: isMobile ? '20px' : '36px', alignItems: 'start' }}>

          {/* Menu */}
          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', overflow: 'hidden' }}>
            {menu.map(m => (
              <button key={m.id} onClick={() => setSection(m.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '14px 18px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: section === m.id ? `3px solid ${S.accent}` : '3px solid transparent', background: section === m.id ? '#fef9f7' : 'transparent', color: section === m.id ? S.accent : S.dark, fontFamily: S.sans }}>
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
            <button onClick={() => navigate('/wishlist')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '14px 18px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: S.dark, fontFamily: S.sans }}>
              <span>🤍</span> Wishlist
            </button>
            <button onClick={() => { signOut(); navigate('/') }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '14px 18px', fontSize: '13px', cursor: 'pointer', border: 'none', borderTop: `1px solid ${S.border}`, background: 'transparent', color: S.accent, fontFamily: S.sans }}>
              <span>↩</span> Logout
            </button>
          </div>

          {/* Content */}
          <div>

            {/* ORDERS */}
            {section === 'orders' && (
              loading ? (
                <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>Loading your orders…</p>
              ) : orders.length === 0 ? (
                <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', textAlign: 'center', padding: '60px 20px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '10px' }}>📦</p>
                  <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginBottom: '6px' }}>No orders yet</p>
                  <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginBottom: '18px' }}>When you place an order it will show up here.</p>
                  <button onClick={() => navigate('/products')}
                    style={{ background: S.accent, color: '#fff', padding: '11px 24px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                    BROWSE PRODUCTS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map(o => {
                    const st = statusStyle(o.status)
                    return (
                      <div key={o.id} style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>
                              Order #{o.id.substring(0, 8).toUpperCase()}
                            </p>
                            <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginTop: '2px' }}>
                              {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' · '}{o.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid online'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '10px', padding: '3px 9px', letterSpacing: '.06em', fontFamily: S.sans, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                              {o.status?.replace('_', ' ').toUpperCase()}
                            </span>
                            <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginTop: '6px' }}>
                              {formatPrice(o.total_amount)}
                            </p>
                          </div>
                        </div>

                        {/* Line items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: `1px solid ${S.border}`, paddingTop: '12px' }}>
                          {(o.order_items || []).map((it, i) => {
                            const img = it.products?.images?.[0]
                            const line = (Number(it.seller_amount) || 0) + (Number(it.platform_amount) || 0)
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '60px', borderRadius: '3px', overflow: 'hidden', background: S.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px', opacity: .4 }}>🛍️</span>}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>{it.products?.title || 'Product'}</p>
                                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>Qty: {it.quantity}</p>
                                </div>
                                <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>{formatPrice(line)}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* ADDRESSES */}
            {section === 'addresses' && (
              <div>
                {savedAddresses.length === 0 ? (
                  <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '24px' }}>
                    <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>
                      No saved addresses yet. Addresses you use at checkout will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>Addresses you've used before:</p>
                    {savedAddresses.map((a, i) => (
                      <div key={i} style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '16px 18px' }}>
                        <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>{a.name} · {a.phone}</p>
                        <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>
                          {[a.address, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    ))}
                    <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>
                      A full address book (add / edit / set default) can be added next — ask to build it.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {section === 'profile' && (
              <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, fontFamily: S.sans, marginBottom: '4px' }}>EMAIL</p>
                  <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{user?.email || '—'}</p>
                </div>
                {user?.phone && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, fontFamily: S.sans, marginBottom: '4px' }}>PHONE</p>
                    <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{user.phone}</p>
                  </div>
                )}
                <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginTop: '8px' }}>
                  Editable profile (name, phone) can be added next once we confirm your profiles table columns.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}