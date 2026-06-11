import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const ADMIN_EMAIL = 'bikidutta319@gmail.com'

export default function AdminDashboard() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const [tab,     setTab]     = useState('sellers')
  const [sellers, setSellers] = useState([])
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (user.email !== ADMIN_EMAIL) { navigate('/'); return }
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)

    const { data: sellersData } = await supabase
      .from('sellers')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    setSellers(sellersData || [])
    setOrders(ordersData || [])
    setLoading(false)
  }

  async function approveSeller(id) {
    await supabase.from('sellers').update({ is_approved: true }).eq('id', id)
    loadData()
  }

  async function rejectSeller(id) {
    await supabase.from('sellers').update({ is_approved: false }).eq('id', id)
    loadData()
  }

  const totalRevenue   = orders.reduce((s, o) => s + (Number(o.total_amount) * 0.1), 0)
  const pendingSellers = sellers.filter(s => !s.is_approved).length
  const paidOrders     = orders.filter(o => o.status === 'paid').length

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: S.muted, fontFamily: S.sans }}>Loading admin panel...</p>
    </div>
  )

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        ADMIN PANEL · BIHAAN MARKETPLACE
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <p style={{ fontSize: '12px', letterSpacing: '.15em', color: S.accent, fontFamily: S.sans }}>
          ADMIN PANEL
        </p>
        <button onClick={() => navigate('/')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK TO STORE
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 40px' }}>

        {/* Stats */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '8px', fontFamily: S.sans }}>
            OVERVIEW
          </p>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>
            Admin Dashboard
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[
              ['Total Sellers',    sellers.length],
              ['Pending Approval', pendingSellers],
              ['Total Orders',     orders.length],
              ['Platform Revenue', `₹${Math.round(totalRevenue).toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.8rem', color: S.dark, marginBottom: '4px' }}>{value}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, letterSpacing: '.05em' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', borderBottom: `1px solid ${S.border}` }}>
          {['sellers', 'orders'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: 'transparent', color: tab === t ? S.accent : S.muted, borderBottom: tab === t ? `2px solid ${S.accent}` : '2px solid transparent', marginBottom: '-1px' }}>
              {t === 'sellers' ? `SELLERS (${sellers.length})` : `ORDERS (${orders.length})`}
            </button>
          ))}
        </div>

        {/* Sellers tab */}
        {tab === 'sellers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sellers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No sellers yet</p>
              </div>
            ) : sellers.map(seller => (
              <div key={seller.id} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>{seller.shop_name}</p>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', letterSpacing: '.08em', fontFamily: S.sans,
                      background: seller.is_approved ? '#f0fdf4' : '#fef5e7',
                      color: seller.is_approved ? '#15803d' : '#92400e',
                      border: `1px solid ${seller.is_approved ? '#86efac' : '#fcd34d'}`
                    }}>
                      {seller.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginBottom: '4px' }}>
                    {seller.profiles?.email || 'No email'} · {seller.state}, {seller.district}
                  </p>
                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
                    {seller.description?.substring(0, 100)}...
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!seller.is_approved ? (
                    <button onClick={() => approveSeller(seller.id)}
                      style={{ background: '#15803d', color: '#fff', padding: '8px 16px', fontSize: '11px', letterSpacing: '.08em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                      APPROVE
                    </button>
                  ) : (
                    <button onClick={() => rejectSeller(seller.id)}
                      style={{ background: 'transparent', color: S.accent, padding: '8px 16px', fontSize: '11px', letterSpacing: '.08em', border: `1px solid ${S.accent}`, cursor: 'pointer', fontFamily: S.sans }}>
                      REVOKE
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>
                      Order #{order.id.substring(0, 8).toUpperCase()}
                    </p>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', letterSpacing: '.08em', fontFamily: S.sans,
                      background: order.status === 'paid' ? '#f0fdf4' : '#fef2f2',
                      color: order.status === 'paid' ? '#15803d' : '#b91c1c',
                      border: `1px solid ${order.status === 'paid' ? '#86efac' : '#fecaca'}`
                    }}>
                      {order.status?.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>
                    ₹{Number(order.total_amount).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '11px', color: '#15803d', fontFamily: S.sans }}>
                    +₹{Math.round(Number(order.total_amount) * 0.1).toLocaleString()} platform fee
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}