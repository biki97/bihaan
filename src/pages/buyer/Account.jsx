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

  // Address book state
  const [addresses,    setAddresses]    = useState([])
  const [addrForm,     setAddrForm]     = useState(EMPTY_ADDR)
  const [editingId,    setEditingId]    = useState(null)   // null = not editing; 'new' = adding; else address id
  const [savingAddr,   setSavingAddr]   = useState(false)
  const [openMenuId,   setOpenMenuId]   = useState(null)   // which address card's ⋮ menu is open

  // Profile state
  const [profileForm,    setProfileForm]    = useState({ full_name: '', phone: '' })
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile,  setSavingProfile]  = useState(false)
  const [profileSaved,   setProfileSaved]   = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadOrders()
    loadAddresses()
    loadProfile()
  }, [user])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    if (data) setProfileForm({ full_name: data.full_name || '', phone: data.phone || '' })
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileForm.full_name, phone: profileForm.phone })
        .eq('id', user.id)
      if (error) { alert('Could not save profile. Please try again.'); return }
      setEditingProfile(false)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
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
          quantity, seller_amount, platform_amount,
          products ( title, images )
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
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
  ]

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.white, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }
  const labelStyle = { fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }
  const menuItem   = { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: '13px', color: S.dark, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }

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
              <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '24px', maxWidth: '480px' }}>

                {/* Email (read-only) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>EMAIL</label>
                  <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{user?.email || '—'}</p>
                  <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginTop: '2px' }}>Email is linked to your login and can't be changed here.</p>
                </div>

                {editingProfile ? (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>FULL NAME</label>
                      <input style={inputStyle} value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Your name" />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={labelStyle}>PHONE</label>
                      <input style={inputStyle} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={saveProfile} disabled={savingProfile}
                        style={{ background: S.accent, color: '#fff', padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                        {savingProfile ? 'SAVING…' : 'SAVE CHANGES'}
                      </button>
                      <button onClick={() => { setEditingProfile(false); loadProfile() }}
                        style={{ background: 'transparent', color: S.muted, padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
                        CANCEL
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>FULL NAME</label>
                      <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{profileForm.full_name || '—'}</p>
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={labelStyle}>PHONE</label>
                      <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.sans }}>{profileForm.phone || '—'}</p>
                    </div>
                    <button onClick={() => setEditingProfile(true)}
                      style={{ background: S.dark, color: '#fff', padding: '10px 22px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                      EDIT PROFILE
                    </button>
                    {profileSaved && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#15803d', fontFamily: S.sans }}>✓ Saved</span>}
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}