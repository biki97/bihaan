import { useIsMobile } from '../../hooks/useIsMobile'
import { useState, useEffect } from 'react'
import { useAuth }     from '../../context/AuthContext'
import { useCart }     from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  'All Products', 'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
  'Brass & Metal', 'Tea & Spices', 'Heritage Crafts', 'Pottery', 'Jewellery',
]

const states = ['All','Assam','Manipur','Meghalaya','Nagaland','Arunachal Pradesh','Mizoram','Tripura','Sikkim']

const CAT_STYLE = {
  'Silk & Textiles': { bg: '#f9f0e8', emoji: '🧵' },
  'Handloom':        { bg: '#f3f0fb', emoji: '🪡' },
  'Bamboo Crafts':   { bg: '#edf5ee', emoji: '🎋' },
  'Brass & Metal':   { bg: '#fdf7e3', emoji: '🏺' },
  'Tea & Spices':    { bg: '#fef5e7', emoji: '🍵' },
  'Heritage Crafts': { bg: '#eef3f8', emoji: '🎨' },
  'Pottery':         { bg: '#fdf0e8', emoji: '🏛️' },
  'Jewellery':       { bg: '#fdf0f5', emoji: '💍' },
  'Other':           { bg: '#f5f0e8', emoji: '🛍️' },
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

export default function Products() {
  const navigate                           = useNavigate()
  const [searchParams]                     = useSearchParams()
  const { user, role, signOut }            = useAuth()
  const { totalItems }                     = useCart()
  const { toggleWishlist, isWishlisted, wishlist } = useWishlist()
  const { formatPrice }                    = useCurrency()

  const [allProducts, setAllProducts] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [cat,         setCat]         = useState(searchParams.get('category') || 'All Products')
  const [state,       setState]       = useState(searchParams.get('state') || 'All')
  const [sort,        setSort]        = useState('newest')
  const [priceMax,    setPriceMax]    = useState(10000)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setAllProducts(data || [])
    setLoading(false)
  }

  const filtered = allProducts
    .filter(p => cat   === 'All Products' || p.category === cat)
    .filter(p => state === 'All'          || p.state    === state)
    .filter(p => p.price <= priceMax)
    .filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a,b) =>
      sort === 'price_asc'  ? a.price - b.price :
      sort === 'price_desc' ? b.price - a.price :
      new Date(b.created_at) - new Date(a.created_at)
    )

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh', overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 &nbsp;·&nbsp; AUTHENTIC NORTHEAST INDIA
      </div>

      {/* Nav */}
      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Products','Artisans','Our Story','States'].map(item => (
            <span key={item} style={{ fontSize: '13px', color: item === 'Products' ? S.accent : S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CurrencyToggle />
          <span onClick={() => navigate('/wishlist')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🤍
            {wishlist.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>{wishlist.length}</span>}
          </span>
          <span onClick={() => navigate('/cart')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
            🛒
            {totalItems > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>{totalItems}</span>}
          </span>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>{user.email?.split('@')[0] || user.phone}</span>
              {role === 'seller' && <span onClick={() => navigate('/seller/dashboard')} style={{ fontSize: '11px', color: S.accent, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>MY DASHBOARD</span>}
              {user?.email === 'bikidutta319@gmail.com' && <span onClick={() => navigate('/admin')} style={{ fontSize: '11px', color: S.gold, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>ADMIN ⚙️</span>}
              <button onClick={signOut} style={{ fontSize: '11px', letterSpacing: '.08em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '7px 12px', cursor: 'pointer', fontFamily: S.sans }}>SIGN OUT</button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>SIGN IN</button>
          )}
        </div>
      </nav>

      {/* Page header */}
      <div style={{ background: S.white, padding: '24px 40px 20px', borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, marginBottom: '8px', fontFamily: S.sans }}>HOME / PRODUCTS</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark }}>All Products</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ fontSize: '13px', padding: '8px 16px', border: `1px solid ${S.border}`, background: S.bg, color: S.dark, outline: 'none', width: '240px', fontFamily: S.sans }} />
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontSize: '12px', padding: '8px 14px', border: `1px solid ${S.border}`, background: S.white, color: S.dark, outline: 'none', fontFamily: S.sans }}>
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '190px 1fr', maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 40px' }}>

        {/* Sidebar */}
        <div style={{ paddingRight: '28px', borderRight: `1px solid ${S.border}` }}>

          {/* States accordion */}
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>BY STATE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '28px' }}>

            {/* All States */}
            <button onClick={() => { setState('All'); setCat('All Products') }}
              style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: state === 'All' ? `2px solid ${S.accent}` : '2px solid transparent', background: state === 'All' ? '#fef5f3' : 'transparent', color: state === 'All' ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
              All States
            </button>

            {/* Each state with accordion */}
            {states.slice(1).map(s => (
              <div key={s}>
                <button
                  onClick={() => { setState(state === s ? 'All' : s); setCat('All Products') }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: state === s ? `2px solid ${S.accent}` : '2px solid transparent', background: state === s ? '#fef5f3' : 'transparent', color: state === s ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
                  <span>{s}</span>
                  <span style={{ fontSize: '10px', color: S.muted }}>{state === s ? '▲' : '▼'}</span>
                </button>

                {/* Categories expand under state */}
                {state === s && (
                  <div style={{ background: '#fef9f7', borderLeft: `2px solid ${S.accent}`, marginBottom: '4px' }}>
                    {[
                      'All Categories',
                      'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
                      'Brass & Metal', 'Tea & Spices', 'Heritage Crafts',
                      'Pottery', 'Jewellery', 'Other'
                    ].map((catName, i) => (
                      <button key={catName}
                        onClick={() => setCat(catName === 'All Categories' ? 'All Products' : catName)}
                        style={{ display: 'block', width: '100%', padding: '6px 10px 6px 18px', fontSize: '12px', cursor: 'pointer', border: 'none', background: cat === (catName === 'All Categories' ? 'All Products' : catName) ? '#fef5f3' : 'transparent', color: cat === (catName === 'All Categories' ? 'All Products' : catName) ? S.accent : S.muted, textAlign: 'left', fontFamily: S.sans }}>
                        {i === 0 ? `All in ${s}` : catName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Price range */}
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>MAX PRICE</p>
          <input type="range" min="300" max="10000" step="100" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
            style={{ width: '100%', accentColor: S.accent, marginBottom: '6px' }} />
          <p style={{ fontSize: '12px', color: S.dark, fontFamily: S.sans }}>Up to {formatPrice(priceMax)}</p>
        </div>

        {/* Products grid */}
        <div style={{ paddingLeft: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>
              {loading ? 'Loading...' : `${filtered.length} products found`}
            </p>
            {(cat !== 'All Products' || state !== 'All' || priceMax < 10000 || search) && (
              <button onClick={() => { setCat('All Products'); setState('All'); setPriceMax(10000); setSearch('') }}
                style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                CLEAR FILTERS ×
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i}>
                  <div style={{ aspectRatio: '3/4', background: S.border, borderRadius: '4px', marginBottom: '12px' }} />
                  <div style={{ height: '12px', background: S.border, borderRadius: '2px', marginBottom: '8px', width: '60%' }} />
                  <div style={{ height: '10px', background: S.border, borderRadius: '2px', width: '80%' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</p>
              <p style={{ color: S.muted, fontFamily: S.sans, marginBottom: '12px' }}>No products found.</p>
              <button onClick={() => { setCat('All Products'); setState('All'); setPriceMax(10000); setSearch('') }}
                style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
              {filtered.map(product => {
                const style = CAT_STYLE[product.category] || CAT_STYLE['Other']
                const hasImage = product.images && product.images[0]
                const wishlisted = isWishlisted(product.id)
                return (
                  <div key={product.id} style={{ cursor: 'pointer' }} className="group">
                    <div onClick={() => navigate(`/product/${product.id}`)}
                      style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', position: 'relative', background: style.bg }}>
                      {hasImage ? (
                        <img src={product.images[0]} alt={product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
                          className="group-hover:scale-105" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:scale-105 transition-transform">
                          <span style={{ fontSize: '48px', opacity: .5 }}>{style.emoji}</span>
                        </div>
                      )}
                      {/* Wishlist */}
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(product) }}
                        style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>
                        {wishlisted ? '❤️' : '🤍'}
                      </button>
                      {/* Only X left */}
                      {product.stock <= 3 && product.stock > 0 && (
                        <div style={{ position: 'absolute', bottom: '7px', left: '7px', background: 'rgba(26,18,8,0.85)', color: '#fff', fontSize: '9px', letterSpacing: '.08em', padding: '3px 7px', fontFamily: S.sans }}>
                          ONLY {product.stock} LEFT
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(0deg,rgba(26,18,8,.65) 0%,transparent 100%)', display: 'flex', justifyContent: 'center' }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span style={{ color: '#fff', fontSize: '10px', letterSpacing: '.15em', fontFamily: S.sans }}>QUICK VIEW</span>
                      </div>
                    </div>
                    <div onClick={() => navigate(`/product/${product.id}`)}>
                      <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{product.state?.toUpperCase()}</p>
                      <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '3px', lineHeight: 1.3 }}>{product.title}</p>
                      <p style={{ fontSize: '11px', color: S.muted, marginBottom: '7px', fontFamily: S.sans }}>{product.category}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>{formatPrice(product.price)}</span>
                      </div>
                      {product.stock <= 3 && product.stock > 0 && (
                        <p style={{ fontSize: '11px', color: '#b91c1c', fontFamily: S.sans, marginTop: '4px' }}>Only {product.stock} left</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: isMobile ? '16px' : '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: S.serif, fontSize: '17px', color: S.accent, fontWeight: 600 }}>Bihaan</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['ABOUT','ARTISANS','SELL','CONTACT'].map(l => (
            <span key={l} style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, cursor: 'pointer', fontFamily: S.sans }}>{l}</span>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>© 2026 BIHAAN · NORTHEAST INDIA</p>
      </footer>
    </div>
  )
}