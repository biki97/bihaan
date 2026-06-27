// src/pages/buyer/Account.jsx
//
// Buyer account hub: My Orders, Saved Addresses (full add/edit/delete/default),
// My Profile. Requires:
//   - RLS policy "buyers view own order items" (orders tab)
//   - the public.addresses table + its RLS policies (addresses tab)

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

const EMPTY_ADDR = { label: 'Home', name: '', phone: '', address: '', city: '', state: '', pincode: '' }

// Show only the last 4 chars of a sensitive value, masking the rest
function maskTail(value, visible = 4) {
  if (!value) return '—'
  const s = String(value)
  if (s.length <= visible) return s
  return '•'.repeat(Math.max(4, s.length - visible)) + s.slice(-visible)
}

// Buyer-facing fulfillment progress
const SHIP_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed',    label: 'Packed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]
function shipStyle(status) {
  if (status === 'delivered') return { color: '#15803d', label: 'Delivered' }
  if (status === 'shipped')   return { color: '#92400e', label: 'Shipped' }
  if (status === 'packed')    return { color: '#1d4ed8', label: 'Packed' }
  if (status === 'cancelled') return { color: '#b91c1c', label: 'Cancelled' }
  return { color: '#7a6e62', label: 'Confirmed' }
}
// Group an order's items by seller into "shipments"
function groupBySeller(items) {
  const groups = {}
  for (const it of (items || [])) {
    const key = it.seller_id || 'unassigned'
    if (!groups[key]) groups[key] = { sellerName: it.sellers?.shop_name || 'Bihaan seller', items: [] }
    groups[key].items.push(it)
  }
  return Object.values(groups)
}

export default function Account() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { user, role, loading: authLoading, signOut } = useAuth()
  const { formatPrice } = useCurrency()

  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [section, setSection] = useState(['orders','addresses','profile','payout'].includes(initialTab) ? initialTab : 'orders')

  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  // Address book state
  const [addresses,    setAddresses]    = useState([])
  const [addrForm,     setAddrForm]     = useState(EMPTY_ADDR)
  const [editingId,    setEditingId]    = useState(null)   // null = not editing; 'new' = adding; else address id
  const [savingAddr,   setSavingAddr]   = useState(false)
  const [openMenuId,   setOpenMenuId]   = useState(null)   // which address card's ⋮ menu is open

  // Profile state
  const [profileForm,   setProfileForm]   = useState({ first_name: '', last_name: '', phone: '' })
  const [editingName,   setEditingName]   = useState(false)
  const [editingPhone,  setEditingPhone]  = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Payout / KYC state (sellers only) — read from locked-down seller_kyc table
  const [kyc,          setKyc]          = useState(null)
  const [payoutForm,   setPayoutForm]   = useState({ bank_account: '', ifsc_code: '', gst_number: '' })
  const [editingPayout,setEditingPayout]= useState(false)
  const [savingPayout, setSavingPayout] = useState(false)
  const [payoutSaved,  setPayoutSaved]  = useState(false)

  const isSeller = role === 'seller'

  useEffect(() => {
    if (authLoading) return                   // auth still restoring on refresh — wait
    if (!user) { navigate('/login'); return }
    loadOrders()
    loadAddresses()
    loadProfile()
    if (isSeller) loadKyc()
  }, [user, authLoading, isSeller])

  async function loadKyc() {
    const { data } = await supabase
      .from('seller_kyc')
      .select('legal_name, pan_number, gst_number, bank_account, ifsc_code')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setKyc(data)
      setPayoutForm({ bank_account: '', ifsc_code: data.ifsc_code || '', gst_number: data.gst_number || '' })
    }
  }

  async function savePayout() {
    // bank_account left blank = keep existing; only update if a new number was typed
    if (!payoutForm.ifsc_code) { alert('IFSC code is required.'); return }
    setSavingPayout(true)
    try {
      const update = {
        ifsc_code:  payoutForm.ifsc_code.toUpperCase().trim(),
        gst_number: payoutForm.gst_number ? payoutForm.gst_number.toUpperCase().trim() : null,
      }
      if (payoutForm.bank_account.trim()) update.bank_account = payoutForm.bank_account.trim()
      const { error } = await supabase.from('seller_kyc').update(update).eq('user_id', user.id)
      if (error) { alert('Could not save. Please try again.'); return }
      setEditingPayout(false)
      setPayoutSaved(true)
      setTimeout(() => setPayoutSaved(false), 2500)
      await loadKyc()
    } finally {
      setSavingPayout(false)
    }
  }

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    if (data) {
      const parts = (data.full_name || '').trim().split(/\s+/).filter(Boolean)
      setProfileForm({ first_name: parts[0] || '', last_name: parts.slice(1).join(' '), phone: data.phone || '' })
    }
  }

  async function saveName() {
    setSavingProfile(true)
    try {
      const full_name = `${profileForm.first_name} ${profileForm.last_name}`.trim()
      const { error } = await supabase.from('profiles').update({ full_name }).eq('id', user.id)
      if (error) { alert('Could not save. Please try again.'); return }
      setEditingName(false)
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePhone() {
    setSavingProfile(true)
    try {
      const { error } = await supabase.from('profiles').update({ phone: profileForm.phone }).eq('id', user.id)
      if (error) { alert('Could not save. Please try again.'); return }
      setEditingPhone(false)
    } finally {
      setSavingProfile(false)
    }
  }

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, quantity, seller_amount, platform_amount, seller_id,
          fulfillment_status, tracking_number, courier_name, tracking_url,
          shipped_at, delivered_at,
          products ( title, images ),
          sellers ( shop_name )
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function cancelItem(itemId) {
    if (!confirm('Cancel this item? It will be removed from your order. If you paid online, a refund is processed manually by the Bihaan team.')) return
    const { error } = await supabase.rpc('cancel_my_order_item', { item_id: itemId })
    if (error) { alert('Could not cancel: ' + error.message); return }
    await loadOrders()
  }

  async function loadAddresses() {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    setAddresses(data || [])
  }

  function startAdd() {
    setAddrForm(EMPTY_ADDR)
    setEditingId('new')
  }
  function startEdit(a) {
    setAddrForm({ name: a.name || '', phone: a.phone || '', address: a.address || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' })
    setEditingId(a.id)
  }
  function cancelEdit() {
    setEditingId(null)
    setAddrForm(EMPTY_ADDR)
  }

  async function saveAddress() {
    if (!addrForm.name || !addrForm.phone || !addrForm.address || !addrForm.city || !addrForm.pincode) {
      alert('Please fill in name, phone, address, city and pincode.')
      return
    }
    setSavingAddr(true)
    try {
      if (editingId === 'new') {
        await supabase.from('addresses').insert({
          ...addrForm,
          user_id: user.id,
          is_default: addresses.length === 0,   // first address becomes default
        })
      } else {
        await supabase.from('addresses').update(addrForm).eq('id', editingId)
      }
      cancelEdit()
      await loadAddresses()
    } catch (e) {
      alert('Could not save address. Please try again.')
    } finally {
      setSavingAddr(false)
    }
  }

  async function deleteAddress(id) {
    if (!confirm('Delete this address?')) return
    await supabase.from('addresses').delete().eq('id', id)
    await loadAddresses()
  }

  async function setDefault(id) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    await loadAddresses()
  }

  const menu = [
    { id: 'orders',    label: 'My Orders',       icon: '📦' },
    { id: 'addresses', label: 'Saved Addresses', icon: '📍' },
    { id: 'profile',   label: 'My Profile',      icon: '👤' },
    ...(isSeller ? [{ id: 'payout', label: 'Payout Details', icon: '🏦' }] : []),
  ]

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.white, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }
  const labelStyle = { fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }
  const menuItem   = { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: '13px', color: S.dark, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }
  const editLink   = { fontSize: '13px', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans, fontWeight: 600 }
  const fieldBox   = { width: '100%', padding: '13px 14px', border: `1px solid ${S.border}`, borderRadius: '3px', fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans, background: S.white }
  const disabledBox = { background: '#faf8f5', color: S.muted }
  const saveBtn    = { background: S.accent, color: '#fff', padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans }
  const cancelBtn  = { background: 'transparent', color: S.muted, padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

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

                        {groupBySeller(o.order_items).map((ship, gi) => {
                          const multi = groupBySeller(o.order_items).length > 1
                          return (
                            <div key={gi} style={{ borderTop: `1px solid ${S.border}`, paddingTop: '14px', marginTop: gi === 0 ? '4px' : '14px' }}>
                              {multi && (
                                <p style={{ fontSize: '11px', letterSpacing: '.06em', color: S.muted, fontFamily: S.sans, marginBottom: '10px' }}>
                                  SHIPMENT {gi + 1} OF {groupBySeller(o.order_items).length} · {ship.sellerName}
                                </p>
                              )}

                              {/* items in this shipment */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                                {ship.items.map((it, i) => {
                                  const img = it.products?.images?.[0]
                                  const line = (Number(it.seller_amount) || 0) + (Number(it.platform_amount) || 0)
                                  const cancelled = it.fulfillment_status === 'cancelled'
                                  return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: cancelled ? 0.5 : 1 }}>
                                      <div style={{ width: '48px', height: '60px', borderRadius: '3px', overflow: 'hidden', background: S.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '20px', opacity: .4 }}>🛍️</span>}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, textDecoration: cancelled ? 'line-through' : 'none' }}>{it.products?.title || 'Product'}</p>
                                        <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>Qty: {it.quantity}</p>
                                      </div>
                                      <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>{formatPrice(line)}</p>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* shipment status — uses the lowest status across its items */}
                              {(() => {
                                const statuses = ship.items.map(it => it.fulfillment_status || 'confirmed')
                                const allCancelled = statuses.every(s => s === 'cancelled')
                                if (allCancelled) {
                                  return <p style={{ fontSize: '12px', color: '#b91c1c', fontFamily: S.sans }}>This shipment was cancelled.</p>
                                }
                                const live = statuses.filter(s => s !== 'cancelled')
                                const order = ['confirmed','packed','shipped','delivered']
                                const current = live.sort((a,b) => order.indexOf(a) - order.indexOf(b))[0] || 'confirmed'
                                const curIdx = order.indexOf(current)
                                const lead = ship.items.find(it => (it.fulfillment_status || 'confirmed') === current) || ship.items[0]
                                const cancellable = ['confirmed','packed'].includes(current)
                                return (
                                  <>
                                    {/* progress tracker */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '10px' }}>
                                      {SHIP_STEPS.map((step, si) => {
                                        const done = si <= curIdx
                                        return (
                                          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: si < SHIP_STEPS.length - 1 ? 1 : '0 0 auto' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: done ? S.accent : S.white, border: `2px solid ${done ? S.accent : S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff' }}>
                                                {done ? '✓' : ''}
                                              </div>
                                              <span style={{ fontSize: '9px', color: done ? S.accent : S.muted, fontFamily: S.sans, whiteSpace: 'nowrap' }}>{step.label}</span>
                                            </div>
                                            {si < SHIP_STEPS.length - 1 && (
                                              <div style={{ flex: 1, height: '2px', background: si < curIdx ? S.accent : S.border, margin: '0 4px', marginBottom: '14px' }} />
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>

                                    {/* tracking link */}
                                    {lead?.tracking_number && (current === 'shipped' || current === 'delivered') && (
                                      <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginBottom: '8px' }}>
                                        {lead.courier_name} · {lead.tracking_number}
                                        {lead.tracking_url && <> · <a href={lead.tracking_url} target="_blank" rel="noreferrer" style={{ color: S.accent }}>Track shipment →</a></>}
                                      </p>
                                    )}

                                    {/* cancel (before it ships) */}
                                    {cancellable && (
                                      <button onClick={() => cancelItem(lead.id)}
                                        style={{ fontSize: '11px', color: '#b91c1c', background: 'transparent', border: `1px solid #fecaca`, padding: '6px 12px', cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.05em' }}>
                                        CANCEL THIS SHIPMENT
                                      </button>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* ADDRESSES */}
            {section === 'addresses' && (
              <div>
                {/* Add button */}
                {editingId === null && (
                  <button onClick={startAdd}
                    style={{ background: S.dark, color: '#fff', padding: '11px 22px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, marginBottom: '18px' }}>
                    + ADD NEW ADDRESS
                  </button>
                )}

                {/* Add / edit form */}
                {editingId !== null && (
                  <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '22px', marginBottom: '18px' }}>
                    <h3 style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark, marginBottom: '16px' }}>
                      {editingId === 'new' ? 'Add a new address' : 'Edit address'}
                    </h3>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>ADDRESS TYPE</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['Home', 'Work', 'Other'].map(t => (
                          <button key={t} onClick={() => setAddrForm({ ...addrForm, label: t })}
                            style={{ padding: '8px 18px', fontSize: '12px', fontFamily: S.sans, cursor: 'pointer', borderRadius: '3px', border: `1px solid ${addrForm.label === t ? S.accent : S.border}`, background: addrForm.label === t ? '#fef9f7' : S.white, color: addrForm.label === t ? S.accent : S.dark }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={labelStyle}>FULL NAME *</label>
                        <input style={inputStyle} value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="Recipient name" />
                      </div>
                      <div>
                        <label style={labelStyle}>PHONE *</label>
                        <input style={inputStyle} value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>ADDRESS *</label>
                      <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="House no., street, area, landmark" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                      <div>
                        <label style={labelStyle}>CITY *</label>
                        <input style={inputStyle} value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" />
                      </div>
                      <div>
                        <label style={labelStyle}>STATE</label>
                        <input style={inputStyle} value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="State" />
                      </div>
                      <div>
                        <label style={labelStyle}>PINCODE *</label>
                        <input style={inputStyle} value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="000000" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={saveAddress} disabled={savingAddr}
                        style={{ background: S.accent, color: '#fff', padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: savingAddr ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                        {savingAddr ? 'SAVING…' : 'SAVE ADDRESS'}
                      </button>
                      <button onClick={cancelEdit}
                        style={{ background: 'transparent', color: S.muted, padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}

                {/* Address list */}
                {addresses.length === 0 && editingId === null ? (
                  <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '24px' }}>
                    <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>No saved addresses yet. Add one above and it'll be ready at checkout.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* click-away overlay for the ⋮ menus */}
                    {openMenuId !== null && (
                      <div onClick={() => setOpenMenuId(null)} style={{ position: 'fixed', inset: 0, zIndex: 15 }} />
                    )}
                    {addresses.map(a => (
                      <div key={a.id} style={{ background: S.white, border: `1px solid ${a.is_default ? S.accent : S.border}`, borderRadius: '6px', padding: '18px 20px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', letterSpacing: '.08em', color: S.muted, background: '#f0ece6', padding: '4px 10px', borderRadius: '3px', fontFamily: S.sans, fontWeight: 600 }}>
                              {(a.label || 'Home').toUpperCase()}
                            </span>
                            {a.is_default && (
                              <span style={{ fontSize: '9px', letterSpacing: '.08em', color: S.accent, background: '#fef9f7', border: `1px solid ${S.accent}`, padding: '3px 8px', borderRadius: '3px', fontFamily: S.sans }}>DEFAULT</span>
                            )}
                          </div>

                          {/* 3-dot menu */}
                          <div style={{ position: 'relative', zIndex: 20 }}>
                            <button onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: S.muted, lineHeight: 1, padding: '0 6px' }}>⋮</button>
                            {openMenuId === a.id && (
                              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '160px', overflow: 'hidden' }}>
                                {!a.is_default && (
                                  <button onClick={() => { setOpenMenuId(null); setDefault(a.id) }} style={menuItem}
                                    onMouseOver={e => e.currentTarget.style.background = S.bg} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Set as default</button>
                                )}
                                <button onClick={() => { setOpenMenuId(null); startEdit(a) }} style={menuItem}
                                  onMouseOver={e => e.currentTarget.style.background = S.bg} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Edit</button>
                                <button onClick={() => { setOpenMenuId(null); deleteAddress(a.id) }} style={{ ...menuItem, color: '#b91c1c' }}
                                  onMouseOver={e => e.currentTarget.style.background = S.bg} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans, fontWeight: 600, marginTop: '14px' }}>
                          {a.name}
                          {a.phone && <span style={{ fontWeight: 600, marginLeft: '16px' }}>{a.phone}</span>}
                        </p>
                        <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '6px', lineHeight: 1.65 }}>
                          {[a.address, a.city, a.state].filter(Boolean).join(', ')}
                          {a.pincode && <> - <span style={{ fontWeight: 600, color: S.dark }}>{a.pincode}</span></>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE */}
            {section === 'profile' && (
              <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Personal Information */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <h3 style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>Personal Information</h3>
                    {!editingName && <button onClick={() => setEditingName(true)} style={editLink}>Edit</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                    <input style={{ ...fieldBox, ...(editingName ? {} : disabledBox) }} value={profileForm.first_name} disabled={!editingName}
                      onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} placeholder="First name" />
                    <input style={{ ...fieldBox, ...(editingName ? {} : disabledBox) }} value={profileForm.last_name} disabled={!editingName}
                      onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} placeholder="Last name" />
                  </div>
                  {editingName && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <button onClick={saveName} disabled={savingProfile} style={saveBtn}>{savingProfile ? 'SAVING…' : 'SAVE'}</button>
                      <button onClick={() => { setEditingName(false); loadProfile() }} style={cancelBtn}>CANCEL</button>
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <h3 style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginBottom: '14px' }}>Email Address</h3>
                  <input style={{ ...fieldBox, ...disabledBox, maxWidth: '360px' }} value={user?.email || ''} disabled />
                  <p style={{ fontSize: '11px', color: S.muted, marginTop: '6px', fontFamily: S.sans }}>Linked to your login — can't be changed here.</p>
                </div>

                {/* Mobile Number */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <h3 style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>Mobile Number</h3>
                    {!editingPhone && <button onClick={() => setEditingPhone(true)} style={editLink}>Edit</button>}
                  </div>
                  <input style={{ ...fieldBox, ...(editingPhone ? {} : disabledBox), maxWidth: '300px' }} value={profileForm.phone} disabled={!editingPhone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                  {editingPhone && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <button onClick={savePhone} disabled={savingProfile} style={saveBtn}>{savingProfile ? 'SAVING…' : 'SAVE'}</button>
                      <button onClick={() => { setEditingPhone(false); loadProfile() }} style={cancelBtn}>CANCEL</button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* PAYOUT DETAILS (sellers only) */}
            {section === 'payout' && isSeller && (
              <div style={{ maxWidth: '560px' }}>
                <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginBottom: '20px' }}>
                  Your earnings are paid out to this account. PAN and account number are partly hidden for your security.
                </p>

                {/* Identity (read-only, masked) */}
                <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '20px 22px', marginBottom: '18px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>LEGAL NAME (as on PAN)</label>
                    <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{kyc?.legal_name || '—'}</p>
                  </div>
                  <div>
                    <label style={labelStyle}>PAN NUMBER</label>
                    <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans, letterSpacing: '.08em' }}>{maskTail(kyc?.pan_number)}</p>
                    <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>
                      PAN can't be changed here — contact support if it's wrong.
                    </p>
                  </div>
                </div>

                {/* Payout details (editable) */}
                <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: S.serif, fontSize: '1.15rem', color: S.dark }}>Bank & GST</h3>
                    {!editingPayout && <button onClick={() => setEditingPayout(true)} style={editLink}>Edit</button>}
                    {payoutSaved && <span style={{ fontSize: '12px', color: '#15803d', fontFamily: S.sans }}>✓ Saved</span>}
                  </div>

                  {editingPayout ? (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>BANK ACCOUNT NUMBER</label>
                        <input style={inputStyle} value={payoutForm.bank_account}
                          onChange={e => setPayoutForm({ ...payoutForm, bank_account: e.target.value })}
                          placeholder={kyc?.bank_account ? `Current: ${maskTail(kyc.bank_account)} — type a new number to change` : 'Account number'} />
                        <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>Leave blank to keep your current account.</p>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>IFSC CODE</label>
                        <input style={inputStyle} value={payoutForm.ifsc_code}
                          onChange={e => setPayoutForm({ ...payoutForm, ifsc_code: e.target.value.toUpperCase().slice(0, 11) })}
                          placeholder="e.g. SBIN0001234" maxLength={11} />
                      </div>
                      <div style={{ marginBottom: '18px' }}>
                        <label style={labelStyle}>GST NUMBER (optional)</label>
                        <input style={inputStyle} value={payoutForm.gst_number}
                          onChange={e => setPayoutForm({ ...payoutForm, gst_number: e.target.value.toUpperCase().slice(0, 15) })}
                          placeholder="Leave blank if not registered" maxLength={15} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={savePayout} disabled={savingPayout} style={saveBtn}>{savingPayout ? 'SAVING…' : 'SAVE'}</button>
                        <button onClick={() => { setEditingPayout(false); loadKyc() }} style={cancelBtn}>CANCEL</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>BANK ACCOUNT</label>
                        <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{maskTail(kyc?.bank_account)}</p>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>IFSC CODE</label>
                        <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{kyc?.ifsc_code || '—'}</p>
                      </div>
                      <div>
                        <label style={labelStyle}>GST NUMBER</label>
                        <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{kyc?.gst_number || '—'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}