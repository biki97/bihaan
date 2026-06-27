import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import ExportBar, { printTable, filterByDate } from '../../components/ExportBar'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const ADMIN_EMAIL = 'bikidutta319@gmail.com'

// ── Fulfillment helpers ──
const FULFILL_ALL = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
function fulfillmentStyle(status) {
  switch (status) {
    case 'packed':    return { bg: '#eef3f8', color: '#1d4ed8', border: '#93c5fd', label: 'PACKED' }
    case 'shipped':   return { bg: '#fef5e7', color: '#92400e', border: '#fcd34d', label: 'SHIPPED' }
    case 'delivered': return { bg: '#f0fdf4', color: '#15803d', border: '#86efac', label: 'DELIVERED' }
    case 'cancelled': return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'CANCELLED' }
    default:          return { bg: '#f3f0eb', color: S.muted, border: S.border, label: 'CONFIRMED' }
  }
}
function fmtDateTime(v) {
  return v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
}

// ── CSV helpers ──
function csvCell(value) {
  const s = (value === null || value === undefined) ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}
function downloadCSV(filename, headers, rows) {
  const headerLine = headers.map(h => csvCell(h.label)).join(',')
  const dataLines  = rows.map(row => headers.map(h => csvCell(h.value(row))).join(','))
  const csv = [headerLine, ...dataLines].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
function parseAddress(raw) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : (raw || {})
  } catch {
    return {}
  }
}

// ── Column definitions (shared by CSV download AND print) ──
const ORDER_HEADERS = [
  { label: 'Order ID',       value: o => o.id },
  { label: 'Date',           value: o => new Date(o.created_at).toLocaleString('en-IN') },
  { label: 'Status',         value: o => o.status },
  { label: 'Payment Method', value: o => o.payment_method || 'online' },
  { label: 'Total (₹)',      value: o => o.total_amount },
  { label: 'Buyer Name',     value: o => parseAddress(o.shipping_address).name },
  { label: 'Phone',          value: o => parseAddress(o.shipping_address).phone },
  { label: 'Address',        value: o => parseAddress(o.shipping_address).address },
  { label: 'City',           value: o => parseAddress(o.shipping_address).city },
  { label: 'State',          value: o => parseAddress(o.shipping_address).state },
  { label: 'Pincode',        value: o => parseAddress(o.shipping_address).pincode },
]

const PAYOUT_HEADERS = [
  { label: 'Shop',                value: g => g.shopName },
  { label: 'Email',               value: g => g.email },
  { label: 'Items',               value: g => g.itemCount },
  { label: 'Pending Payout (₹)',  value: g => Math.round(g.pendingAmount) },
  { label: 'COD Uncollected (₹)', value: g => Math.round(g.codPendingAmount) },
  { label: 'Already Paid (₹)',    value: g => Math.round(g.paidAmount) },
]

const SELLER_HEADERS = [
  { label: 'Shop Name', value: s => s.shop_name },
  { label: 'Email',     value: s => s.profiles?.email },
  { label: 'State',     value: s => s.state },
  { label: 'District',  value: s => s.district },
  { label: 'Approved',  value: s => s.is_approved ? 'Yes' : 'No' },
  { label: 'Joined',    value: s => s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '' },
]

const FULFILL_HEADERS = [
  { label: 'Order Date',   value: it => it.orders?.created_at ? new Date(it.orders.created_at).toLocaleString('en-IN') : '' },
  { label: 'Product',      value: it => it.products?.title },
  { label: 'Seller',       value: it => it.sellers?.shop_name },
  { label: 'Qty',          value: it => it.quantity },
  { label: 'Fulfillment',  value: it => it.fulfillment_status || 'confirmed' },
  { label: 'Courier',      value: it => it.courier_name },
  { label: 'Tracking',     value: it => it.tracking_number },
  { label: 'Shipped At',   value: it => it.shipped_at ? new Date(it.shipped_at).toLocaleString('en-IN') : '' },
  { label: 'Delivered At', value: it => it.delivered_at ? new Date(it.delivered_at).toLocaleString('en-IN') : '' },
]

export default function AdminDashboard() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const [tab,      setTab]      = useState('sellers')
  const [sellers,  setSellers]  = useState([])
  const [orders,   setOrders]   = useState([])
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [savingId, setSavingId] = useState(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  // Fulfillment tab filter
  const [fulfillFilter, setFulfillFilter] = useState('all')

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

    const { data: itemsData } = await supabase
      .from('order_items')
      .select(`
        *,
        products ( title ),
        sellers ( shop_name, profiles ( email ) ),
        orders ( status, payment_method, created_at, shipping_address )
      `)
      .order('id', { ascending: false })

    setSellers(sellersData || [])
    setOrders(ordersData || [])
    setItems(itemsData || [])
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

  async function markSellerPaid(sellerKey, itemIds) {
    setSavingId(sellerKey)
    await supabase
      .from('order_items')
      .update({ payout_status: 'paid' })
      .in('id', itemIds)
    await loadData()
    setSavingId(null)
  }

  // ── Admin override of an item's fulfillment status ──
  async function overrideFulfillment(it, newStatus) {
    if (newStatus === (it.fulfillment_status || 'confirmed')) return
    if (!confirm(`ADMIN OVERRIDE\n\nForce "${it.products?.title || 'item'}" from ${(it.fulfillment_status || 'confirmed').toUpperCase()} to ${newStatus.toUpperCase()}?\n\nThis bypasses the seller. Use only to correct mistakes.`)) return
    setSavingId(it.id)
    const patch = { fulfillment_status: newStatus }
    if (newStatus === 'shipped'   && !it.shipped_at)   patch.shipped_at   = new Date().toISOString()
    if (newStatus === 'delivered' && !it.delivered_at) patch.delivered_at = new Date().toISOString()
    await supabase.from('order_items').update(patch).eq('id', it.id)
    await loadData()
    setSavingId(null)
  }

  // ── Date-range filtering — lists + CSV + print ──
  const filteredOrders  = filterByDate(orders,  o  => o.created_at,         dateFrom, dateTo)
  const filteredSellers = filterByDate(sellers, s  => s.created_at,         dateFrom, dateTo)
  const filteredItems   = filterByDate(items,   it => it.orders?.created_at, dateFrom, dateTo)

  // Fulfillment list: date-filtered, then status-filtered
  const fulfillItems = filteredItems.filter(it =>
    fulfillFilter === 'all' ? true : (it.fulfillment_status || 'confirmed') === fulfillFilter
  )

  const rangeLabel = (dateFrom || dateTo)
    ? `Date range: ${dateFrom || 'beginning'} → ${dateTo || 'today'}`
    : 'All dates'

  const today = new Date().toISOString().slice(0, 10)

  function downloadOrders() {
    if (filteredOrders.length === 0) { alert('No orders in this date range'); return }
    downloadCSV(`bihaan-orders-${today}.csv`, ORDER_HEADERS, filteredOrders)
  }
  function printOrders() { printTable('Bihaan — Orders', ORDER_HEADERS, filteredOrders, rangeLabel) }

  function downloadPayouts() {
    if (payoutList.length === 0) { alert('No payouts in this date range'); return }
    downloadCSV(`bihaan-payouts-${today}.csv`, PAYOUT_HEADERS, payoutList)
  }
  function printPayouts() { printTable('Bihaan — Seller Payouts', PAYOUT_HEADERS, payoutList, rangeLabel) }

  function downloadSellers() {
    if (filteredSellers.length === 0) { alert('No sellers in this date range'); return }
    downloadCSV(`bihaan-sellers-${today}.csv`, SELLER_HEADERS, filteredSellers)
  }
  function printSellers() { printTable('Bihaan — Sellers', SELLER_HEADERS, filteredSellers, rangeLabel) }

  function downloadFulfill() {
    if (fulfillItems.length === 0) { alert('No items in this view'); return }
    downloadCSV(`bihaan-fulfillment-${today}.csv`, FULFILL_HEADERS, fulfillItems)
  }
  function printFulfill() { printTable('Bihaan — Fulfillment', FULFILL_HEADERS, fulfillItems, rangeLabel) }

  // ── Money summary (all-time, independent of the date filter) ──
  const isCollected = o =>
    o.payment_method === 'cod' ? o.status !== 'cod_pending' : o.status === 'paid'

  const receivedFromBuyers = orders.filter(isCollected)
    .reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const commissionEarned = Math.round(receivedFromBuyers * 0.1)

  let oweToSellers = 0, paidToSellers = 0, codHeldBack = 0
  for (const it of items) {
    const amt = Number(it.seller_amount) || 0
    const codUncollected = it.orders?.payment_method === 'cod' && it.orders?.status === 'cod_pending'
    if (it.payout_status === 'paid') paidToSellers += amt
    else if (codUncollected)         codHeldBack   += amt
    else                             oweToSellers  += amt
  }

  const pendingSellers = sellers.filter(s => !s.is_approved).length

  // ── Group order_items by seller (built from filteredItems) ──
  const payoutGroups = {}
  for (const it of filteredItems) {
    const key      = it.seller_id || 'unassigned'
    const shopName = it.sellers?.shop_name || (it.seller_id ? 'Unknown shop' : 'Unassigned seller')
    const email    = it.sellers?.profiles?.email || '—'
    const amount   = Number(it.seller_amount) || 0
    const isCodUncollected = it.orders?.payment_method === 'cod' && it.orders?.status === 'cod_pending'

    if (!payoutGroups[key]) {
      payoutGroups[key] = {
        key, shopName, email,
        pendingAmount: 0, pendingItemIds: [],
        paidAmount: 0, itemCount: 0,
        codPendingAmount: 0,
      }
    }
    const g = payoutGroups[key]
    g.itemCount += 1
    if (it.payout_status === 'paid')      g.paidAmount += amount
    else if (isCodUncollected)            g.codPendingAmount += amount
    else { g.pendingAmount += amount; g.pendingItemIds.push(it.id) }
  }
  const payoutList = Object.values(payoutGroups).sort((a, b) => b.pendingAmount - a.pendingAmount)
  const totalPending = payoutList.reduce((s, g) => s + g.pendingAmount, 0)
  const totalPayoutGroups = new Set(items.map(it => it.seller_id || 'unassigned')).size

  // Count of items needing attention (not delivered/cancelled)
  const activeFulfillCount = items.filter(it => !['delivered', 'cancelled'].includes(it.fulfillment_status || 'confirmed')).length

  // ── "Needs attention" stats for the Fulfillment tab ──
  // Surfaces the outliers so admin monitors exceptions, not every single row.
  const DAYS = ms => ms / (1000 * 60 * 60 * 24)
  const now = Date.now()
  const fulfillStats = (() => {
    let awaitingDispatch = 0   // confirmed/packed for > 2 days (seller hasn't shipped)
    let inTransitLong    = 0   // shipped but not delivered for > 7 days (possibly lost)
    let cancelled        = 0
    let deliveredTotal   = 0
    for (const it of items) {
      const fs = it.fulfillment_status || 'confirmed'
      const placed = it.orders?.created_at ? new Date(it.orders.created_at).getTime() : now
      if (fs === 'cancelled') { cancelled++; continue }
      if (fs === 'delivered') { deliveredTotal++; continue }
      if ((fs === 'confirmed' || fs === 'packed') && DAYS(now - placed) > 2) awaitingDispatch++
      if (fs === 'shipped') {
        const shipped = it.shipped_at ? new Date(it.shipped_at).getTime() : placed
        if (DAYS(now - shipped) > 7) inTransitLong++
      }
    }
    return { awaitingDispatch, inTransitLong, cancelled, deliveredTotal }
  })()

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: S.muted, fontFamily: S.sans }}>Loading admin panel...</p>
    </div>
  )

  const noneInRange = (label) => (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>No {label} in this date range</p>
      <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '6px' }}>
        Adjust the dates above or click CLEAR to see everything.
      </p>
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
        <p style={{ fontSize: '12px', letterSpacing: '.15em', color: S.accent, fontFamily: S.sans }}>ADMIN PANEL</p>
        <button onClick={() => navigate('/')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK TO STORE
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 40px' }}>

        {/* Overview */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '8px', fontFamily: S.sans }}>OVERVIEW</p>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>Admin Dashboard</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[
              ['Total Sellers',    sellers.length],
              ['Pending Approval', pendingSellers],
              ['Total Orders',     orders.length],
              ['Your Commission',  `₹${commissionEarned.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.8rem', color: S.dark, marginBottom: '4px' }}>{value}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, letterSpacing: '.05em' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Money summary */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '12px', fontFamily: S.sans }}>MONEY</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[
              ['Received from buyers',    `₹${Math.round(receivedFromBuyers).toLocaleString()}`, 'Gross cash collected in your account', S.border],
              ['To pay sellers',          `₹${Math.round(oweToSellers).toLocaleString()}`,        'Pending payouts — pay, then mark paid', S.accent],
              ['Your commission (10%)',   `₹${commissionEarned.toLocaleString()}`,                'Your earnings on collected orders',     S.border],
              ['Already paid to sellers', `₹${Math.round(paidToSellers).toLocaleString()}`,       'Disbursed so far',                      S.border],
            ].map(([label, value, caption, bar]) => (
              <div key={label} style={{ background: S.white, border: `1px solid ${S.border}`, borderLeft: `3px solid ${bar}`, padding: '20px', borderRadius: '3px' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.6rem', color: S.dark, marginBottom: '4px' }}>{value}</p>
                <p style={{ fontSize: '11px', color: S.dark, fontFamily: S.sans, letterSpacing: '.03em', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>{caption}</p>
              </div>
            ))}
          </div>
          {codHeldBack > 0 && (
            <p style={{ fontSize: '12px', color: '#92400e', fontFamily: S.sans, marginTop: '12px', background: '#fef5e7', border: '1px solid #fcd34d', padding: '8px 12px', borderRadius: '3px' }}>
              ⚠ ₹{Math.round(codHeldBack).toLocaleString()} of seller money is from COD orders where cash isn't collected yet — not counted as received, and don't pay it out until delivery.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', borderBottom: `1px solid ${S.border}`, flexWrap: 'wrap' }}>
          {[
            ['sellers', `SELLERS (${sellers.length})`],
            ['orders',  `ORDERS (${orders.length})`],
            ['payouts', `PAYOUTS (₹${Math.round(totalPending).toLocaleString()} due)`],
            ['fulfillment', `FULFILLMENT (${activeFulfillCount} active)`],
          ].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: 'transparent', color: tab === t ? S.accent : S.muted, borderBottom: tab === t ? `2px solid ${S.accent}` : '2px solid transparent', marginBottom: '-1px' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Sellers tab */}
        {tab === 'sellers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ExportBar
              from={dateFrom} setFrom={setDateFrom} to={dateTo} setTo={setDateTo}
              onDownload={downloadSellers} onPrint={printSellers}
              count={filteredSellers.length} total={sellers.length} downloadLabel="DOWNLOAD CSV" />
            {sellers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No sellers yet</p>
              </div>
            ) : filteredSellers.length === 0 ? noneInRange('sellers') : filteredSellers.map(seller => (
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
            <ExportBar
              from={dateFrom} setFrom={setDateFrom} to={dateTo} setTo={setDateTo}
              onDownload={downloadOrders} onPrint={printOrders}
              count={filteredOrders.length} total={orders.length} downloadLabel="DOWNLOAD CSV" />
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No orders yet</p>
              </div>
            ) : filteredOrders.length === 0 ? noneInRange('orders') : filteredOrders.map(order => (
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

        {/* Payouts tab */}
        {tab === 'payouts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ExportBar
              from={dateFrom} setFrom={setDateFrom} to={dateTo} setTo={setDateTo}
              onDownload={downloadPayouts} onPrint={printPayouts}
              count={payoutList.length} total={totalPayoutGroups} downloadLabel="DOWNLOAD CSV" />

            <div style={{ background: '#fef9f7', border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.accent}`, padding: '16px 20px', borderRadius: '3px', marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>
                You owe sellers a total of <strong>₹{Math.round(totalPending).toLocaleString()}</strong> across {payoutList.filter(g => g.pendingAmount > 0).length} seller(s).
                {(dateFrom || dateTo) && <span style={{ color: S.muted }}> ({rangeLabel})</span>}{' '}
                Pay them by UPI/bank transfer, then mark as paid here.
              </p>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No payouts yet</p>
                <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '6px' }}>
                  Seller payout records appear here once orders come in.
                </p>
              </div>
            ) : payoutList.length === 0 ? noneInRange('payouts') : payoutList.map(g => (
              <div key={g.key} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <p style={{ fontFamily: S.serif, fontSize: '1.1rem', color: g.key === 'unassigned' ? S.accent : S.dark }}>{g.shopName}</p>
                    {g.pendingAmount > 0 ? (
                      <span style={{ fontSize: '10px', padding: '2px 8px', letterSpacing: '.08em', fontFamily: S.sans, background: '#fef5e7', color: '#92400e', border: '1px solid #fcd34d' }}>PAYMENT DUE</span>
                    ) : (
                      <span style={{ fontSize: '10px', padding: '2px 8px', letterSpacing: '.08em', fontFamily: S.sans, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}>ALL PAID</span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginBottom: '4px' }}>{g.email} · {g.itemCount} item(s)</p>
                  <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
                    Pending: <strong style={{ color: S.dark }}>₹{Math.round(g.pendingAmount).toLocaleString()}</strong>
                    {g.paidAmount > 0 && <span> · Already paid: ₹{Math.round(g.paidAmount).toLocaleString()}</span>}
                  </p>
                  {g.codPendingAmount > 0 && (
                    <p style={{ fontSize: '11px', color: '#92400e', fontFamily: S.sans, marginTop: '6px', background: '#fef5e7', border: '1px solid #fcd34d', padding: '6px 10px', borderRadius: '3px' }}>
                      ⚠ ₹{Math.round(g.codPendingAmount).toLocaleString()} is from COD orders — cash NOT yet collected. Do not pay this until the order is delivered and you've received the cash.
                    </p>
                  )}
                  {g.key === 'unassigned' && (
                    <p style={{ fontSize: '11px', color: S.accent, fontFamily: S.sans, marginTop: '6px' }}>
                      ⚠ These items have no seller linked. Fix product seller_id so future orders attribute correctly.
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: S.serif, fontSize: '1.4rem', color: S.dark, marginBottom: '8px' }}>₹{Math.round(g.pendingAmount).toLocaleString()}</p>
                  {g.pendingAmount > 0 && g.key !== 'unassigned' && (
                    <button onClick={() => markSellerPaid(g.key, g.pendingItemIds)} disabled={savingId === g.key}
                      style={{ background: savingId === g.key ? '#888' : '#15803d', color: '#fff', padding: '8px 16px', fontSize: '11px', letterSpacing: '.08em', border: 'none', cursor: savingId === g.key ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                      {savingId === g.key ? 'SAVING...' : 'MARK AS PAID'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fulfillment tab — monitor + override every seller's order items */}
        {tab === 'fulfillment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ExportBar
              from={dateFrom} setFrom={setDateFrom} to={dateTo} setTo={setDateTo}
              onDownload={downloadFulfill} onPrint={printFulfill}
              count={fulfillItems.length} total={items.length} downloadLabel="DOWNLOAD CSV" />

            {/* NEEDS ATTENTION — surfaces the outliers so you monitor exceptions, not every row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[
                { n: fulfillStats.awaitingDispatch, label: 'AWAITING DISPATCH', sub: '> 2 days, not shipped', tone: fulfillStats.awaitingDispatch > 0 ? 'warn' : 'ok', filter: 'confirmed' },
                { n: fulfillStats.inTransitLong,    label: 'IN TRANSIT > 7 DAYS', sub: 'shipped, not delivered', tone: fulfillStats.inTransitLong > 0 ? 'bad' : 'ok', filter: 'shipped' },
                { n: fulfillStats.cancelled,        label: 'CANCELLED',        sub: 'total cancelled items', tone: 'neutral', filter: 'cancelled' },
                { n: fulfillStats.deliveredTotal,   label: 'DELIVERED',        sub: 'completed successfully', tone: 'good', filter: 'delivered' },
              ].map(card => {
                const palette = {
                  warn:    { bar: '#f59e0b', num: '#92400e' },
                  bad:     { bar: '#b91c1c', num: '#b91c1c' },
                  good:    { bar: '#15803d', num: '#15803d' },
                  neutral: { bar: S.muted,  num: S.dark   },
                  ok:      { bar: S.border, num: S.dark   },
                }[card.tone]
                return (
                  <div key={card.label} onClick={() => setFulfillFilter(card.filter)}
                    style={{ background: S.white, border: `1px solid ${S.border}`, borderLeft: `3px solid ${palette.bar}`, padding: '14px 16px', borderRadius: '3px', cursor: 'pointer' }}>
                    <p style={{ fontFamily: S.serif, fontSize: '1.7rem', color: palette.num, marginBottom: '2px' }}>{card.n}</p>
                    <p style={{ fontSize: '10px', letterSpacing: '.06em', color: S.dark, fontFamily: S.sans, fontWeight: 600 }}>{card.label}</p>
                    <p style={{ fontSize: '10px', color: S.muted, fontFamily: S.sans, marginTop: '2px' }}>{card.sub}</p>
                  </div>
                )
              })}
            </div>
            {(fulfillStats.awaitingDispatch > 0 || fulfillStats.inTransitLong > 0) && (
              <p style={{ fontSize: '12px', color: '#92400e', fontFamily: S.sans, background: '#fef5e7', border: '1px solid #fcd34d', padding: '8px 12px', borderRadius: '3px' }}>
                ⚠ {fulfillStats.awaitingDispatch > 0 && `${fulfillStats.awaitingDispatch} item(s) haven't shipped in over 2 days`}
                {fulfillStats.awaitingDispatch > 0 && fulfillStats.inTransitLong > 0 && ' · '}
                {fulfillStats.inTransitLong > 0 && `${fulfillStats.inTransitLong} item(s) in transit over 7 days`}
                . Tap a card above to filter, then nudge the seller or override the status.
              </p>
            )}

            {/* status filter chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {['all', ...FULFILL_ALL].map(f => (
                <button key={f} onClick={() => setFulfillFilter(f)}
                  style={{ padding: '6px 12px', fontSize: '11px', letterSpacing: '.05em', fontFamily: S.sans, cursor: 'pointer', borderRadius: '3px', border: `1px solid ${fulfillFilter === f ? S.accent : S.border}`, background: fulfillFilter === f ? '#fef9f7' : S.white, color: fulfillFilter === f ? S.accent : S.muted }}>
                  {f === 'all' ? 'ALL' : f.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ background: '#eef3f8', border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.dark}`, padding: '12px 16px', borderRadius: '3px' }}>
              <p style={{ fontSize: '12px', color: S.dark, fontFamily: S.sans, lineHeight: 1.6 }}>
                Oversight view of every seller's items. Sellers normally advance their own status — use the override dropdown only to correct a mistake or step in for an unresponsive seller. Overrides are logged by the shipped/delivered timestamps.
              </p>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark }}>No order items yet</p>
              </div>
            ) : fulfillItems.length === 0 ? noneInRange('items') : fulfillItems.map(it => {
              const fs = it.fulfillment_status || 'confirmed'
              const st = fulfillmentStyle(fs)
              const addr = parseAddress(it.orders?.shipping_address)
              return (
                <div key={it.id} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '18px 20px', borderRadius: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: S.serif, fontSize: '1rem', color: S.dark }}>{it.products?.title || 'Product'}</p>
                        <span style={{ fontSize: '10px', letterSpacing: '.08em', padding: '2px 8px', fontFamily: S.sans, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginBottom: '2px' }}>
                        Seller: <strong style={{ color: S.dark }}>{it.sellers?.shop_name || '—'}</strong> · Qty {it.quantity}
                        {it.orders?.created_at && <> · {new Date(it.orders.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>}
                      </p>
                      <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
                        Buyer: {addr.name || '—'} {addr.phone ? `· ${addr.phone}` : ''}
                      </p>
                      {it.tracking_number && (
                        <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>
                          {it.courier_name} · {it.tracking_number}
                          {it.tracking_url && <> · <a href={it.tracking_url} target="_blank" rel="noreferrer" style={{ color: S.accent }}>Track</a></>}
                        </p>
                      )}
                      <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginTop: '6px' }}>
                        Shipped: {fmtDateTime(it.shipped_at)} · Delivered: {fmtDateTime(it.delivered_at)}
                      </p>
                    </div>

                    {/* Admin override */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '9px', letterSpacing: '.12em', color: S.muted, fontFamily: S.sans, marginBottom: '4px' }}>ADMIN OVERRIDE</p>
                      <select value={fs} disabled={savingId === it.id}
                        onChange={e => overrideFulfillment(it, e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '12px', border: `1px solid ${S.border}`, background: S.white, color: S.dark, fontFamily: S.sans, cursor: 'pointer' }}>
                        {FULFILL_ALL.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}