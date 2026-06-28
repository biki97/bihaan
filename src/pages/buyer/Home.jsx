import { useState, useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'
import { useCart }     from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'
import AccountMenu from '../../components/AccountMenu'
import Footer from '../../components/Footer'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  { name: 'All Products',    count: null },
  { name: 'Silk & Textiles', count: null },
  { name: 'Handloom',        count: null },
  { name: 'Bamboo Crafts',   count: null },
  { name: 'Brass & Metal',   count: null },
  { name: 'Tea & Spices',    count: null },
  { name: 'Heritage Crafts', count: null },
  { name: 'Pottery',         count: null },
  { name: 'Jewellery',       count: null },
]

const states = [
  'Assam','Manipur','Meghalaya','Nagaland',
  'Arunachal Pradesh','Mizoram','Tripura','Sikkim'
]

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

function ProductCard({ product, navigate }) {
  const { toggleWishlist, isWishlisted } = useWishlist()
  const { formatPrice } = useCurrency()
  const wishlisted = isWishlisted(product.id)
  const style = CAT_STYLE[product.category] || CAT_STYLE['Other']
  const hasImage = product.images && product.images[0]

  return (
    <div onClick={() => navigate(`/product/${product.id}`)} style={{ cursor: 'pointer' }} className="group">
      <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', position: 'relative', background: style.bg }}>
        {hasImage ? (
          <img src={product.images[0]} alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s cubic-bezier(.2,.8,.2,1)' }}
            className="group-hover:scale-105" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="group-hover:scale-105 transition-transform">
            <span style={{ fontSize: '48px', opacity: .5 }}>{style.emoji}</span>
          </div>
        )}

        <button onClick={e => { e.stopPropagation(); toggleWishlist(product) }}
          style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>
          {wishlisted ? '❤️' : '🤍'}
        </button>

        {product.stock <= 3 && product.stock > 0 && (
          <div style={{ position: 'absolute', bottom: '7px', left: '7px', background: 'rgba(26,18,8,0.85)', color: '#fff', fontSize: '9px', letterSpacing: '.08em', padding: '3px 7px', fontFamily: S.sans }}>
            ONLY {product.stock} LEFT
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(0deg,rgba(26,18,8,.65) 0%,transparent 100%)', display: 'flex', justifyContent: 'center' }}
          className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span style={{ color: '#fff', fontSize: '10px', letterSpacing: '.15em', fontFamily: S.sans }}>QUICK VIEW</span>
        </div>
      </div>

      <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{product.state?.toUpperCase()}</p>
      <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '3px', lineHeight: 1.3 }}>{product.title}</p>
      <p style={{ fontSize: '11px', color: S.muted, marginBottom: '7px', fontFamily: S.sans }}>{product.category}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>{formatPrice(product.price)}</span>
        {product.mrp && Number(product.mrp) > Number(product.price) && (
          <span style={{ fontSize: '11px', color: S.muted, textDecoration: 'line-through', fontFamily: S.sans }}>{formatPrice(product.mrp)}</span>
        )}
      </div>
    </div>
  )
}

function NavBar({ navigate }) {
  const isMobile = useIsMobile()
  const { totalItems } = useCart()
  const { wishlist }   = useWishlist()

  return (
    <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <Logo size={36} showText={true} />
      </div>
      <div style={{ display: isMobile ? 'none' : 'flex', gap: '28px' }}>
        {['Products','Artisans','Our Story','States'].map(item => (
          <span key={item} onClick={() => {
              if (item === 'Products')  navigate('/products')
              if (item === 'Our Story') navigate('/about')
            }}
            style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>{item}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <CurrencyToggle />
        <span onClick={() => navigate('/seller/register')}
          style={{ fontSize: '12px', color: S.accent, letterSpacing: '.08em', cursor: 'pointer', fontFamily: S.sans }}>SELL</span>
        <span onClick={() => navigate('/wishlist')} style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
          🤍
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
        <AccountMenu />
      </div>
    </nav>
  )
}

export default function Home() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const [products,       setProducts]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [selectedState,  setSelectedState]  = useState(null)
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    loadProducts()
    try {
      const viewed = JSON.parse(localStorage.getItem('bihaan_viewed') || '[]')
      setRecentlyViewed(viewed)
    } catch {}
  }, [])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
    setProducts(data || [])
    setLoading(false)
  }

  const displayProducts = selectedState
    ? products.filter(p => p.state === selectedState)
    : products

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh', overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 &nbsp;·&nbsp; AUTHENTIC NORTHEAST INDIA &nbsp;·&nbsp; 50+ VERIFIED ARTISANS
      </div>

      <NavBar navigate={navigate} />

      {/* Hero */}
      <div style={{ background: S.white, padding: '64px 40px 48px', borderBottom: `1px solid ${S.border}`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '40px', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '18px', fontFamily: S.sans }}>HANDCRAFTED IN NORTHEAST INDIA</p>
          <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(2.4rem,4.5vw,3.4rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-.02em', color: S.dark, marginBottom: '20px' }}>
            Where every<br />product <em style={{ fontStyle: 'italic', color: S.accent }}>carries</em><br />a story
          </h1>
          <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.8, maxWidth: '400px', marginBottom: '32px' }}>
            Discover authentic handmade products directly from artisans across all 8 states of Northeast India. Every purchase empowers a maker.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/products')}
              style={{ background: S.dark, color: '#fff', padding: '13px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              EXPLORE COLLECTION
            </button>
            <button onClick={() => navigate('/seller/register')}
              style={{ border: `1px solid ${S.border}`, background: 'transparent', color: S.dark, padding: '13px 28px', fontSize: '11px', letterSpacing: '.12em', cursor: 'pointer', fontFamily: S.sans }}>
              START SELLING
            </button>
          </div>
        </div>

        {/* Hero product showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
          {products.slice(0, 3).map((p, i) => {
            const style = CAT_STYLE[p.category] || CAT_STYLE['Other']
            const hasImage = p.images && p.images[0]
            return (
              <div key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                style={{ gridColumn: i === 0 ? 'span 2' : 'span 1', background: style.bg, borderRadius: '4px', padding: '18px', height: i === 0 ? '190px' : '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                className="hover:-translate-y-1 transition-transform">
                <div>
                  <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, marginBottom: '4px', fontFamily: S.sans }}>{p.state?.toUpperCase()} · {p.category?.toUpperCase()}</p>
                  <p style={{ fontFamily: S.serif, fontSize: i === 0 ? '17px' : '15px', color: S.dark }}>{p.title}</p>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹{Number(p.price).toLocaleString()}</p>
                {hasImage ? (
                  <img src={p.images[0]} alt={p.title}
                    style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '45%', objectFit: 'cover', opacity: .5 }} />
                ) : (
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: i === 0 ? '52px' : '36px', opacity: .45 }}>{style.emoji}</span>
                )}
              </div>
            )
          })}
          {products.length === 0 && [
            { bg: '#f9f0e8', emoji: '🧵', label: 'ASSAM · SILK & TEXTILES', title: 'Muga Silk Saree', price: '4,500', span: 2, h: '190px' },
            { bg: '#edf5ee', emoji: '🎋', label: 'TRIPURA', title: 'Bamboo Lamp', price: '850', span: 1, h: '150px' },
            { bg: '#fdf7e3', emoji: '🏺', label: 'ASSAM', title: 'Xorai Tray', price: '1,200', span: 1, h: '150px' },
          ].map((item, i) => (
            <div key={i}
              style={{ gridColumn: `span ${item.span}`, background: item.bg, borderRadius: '4px', padding: '18px', height: item.h, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              <div>
                <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, marginBottom: '4px', fontFamily: S.sans }}>{item.label}</p>
                <p style={{ fontFamily: S.serif, fontSize: item.span === 2 ? '17px' : '15px', color: S.dark }}>{item.title}</p>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹{item.price}</p>
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: item.span === 2 ? '52px' : '36px', opacity: .45 }}>{item.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* States strip */}
      <div style={{ background: S.accent, padding: '11px 40px', display: 'flex', gap: '28px', justifyContent: 'center', overflowX: 'auto' }}>
        {['All', ...states].map(s => (
          <span key={s} onClick={() => setSelectedState(s === 'All' ? null : s)}
            style={{ color: '#fff', fontSize: '11px', letterSpacing: '.12em', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: S.sans, opacity: (selectedState === s || (s === 'All' && !selectedState)) ? 1 : .65, borderBottom: (selectedState === s || (s === 'All' && !selectedState)) ? '1px solid #fff' : 'none', paddingBottom: '2px' }}>
            {s.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Main */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '190px 1fr', gap: 0, maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 40px' }}>
        {/* Sidebar */}
        <div style={{ paddingRight: '28px', borderRight: `1px solid ${S.border}` }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>BY STATE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <button onClick={() => setSelectedState(null)}
              style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: !selectedState ? `2px solid ${S.accent}` : '2px solid transparent', background: !selectedState ? '#fef5f3' : 'transparent', color: !selectedState ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
              All States
            </button>
            {states.map(s => (
              <div key={s}>
                <button
                  onClick={() => setSelectedState(selectedState === s ? null : s)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: selectedState === s ? `2px solid ${S.accent}` : '2px solid transparent', background: selectedState === s ? '#fef5f3' : 'transparent', color: selectedState === s ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
                  <span>{s}</span>
                  <span style={{ fontSize: '10px', color: S.muted }}>{selectedState === s ? '▲' : '▼'}</span>
                </button>
                {selectedState === s && (
                  <div style={{ background: '#fef9f7', borderLeft: `2px solid ${S.accent}`, marginBottom: '4px' }}>
                    {[
                      'All Categories',
                      'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
                      'Brass & Metal', 'Tea & Spices', 'Heritage Crafts',
                      'Pottery', 'Jewellery', 'Other'
                    ].map((catName, i) => (
                      <button key={catName}
                        onClick={() => navigate(`/products?state=${s}${catName !== 'All Categories' ? `&category=${encodeURIComponent(catName)}` : ''}`)}
                        style={{ display: 'block', width: '100%', padding: '6px 10px 6px 18px', fontSize: '12px', cursor: 'pointer', border: 'none', background: 'transparent', color: i === 0 ? S.accent : S.muted, textAlign: 'left', fontFamily: S.sans, fontWeight: i === 0 ? 500 : 400 }}>
                        {i === 0 ? `All in ${s}` : catName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        <div style={{ paddingLeft: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>
              {loading ? 'Loading...' : selectedState ? `Products from ${selectedState}` : `${products.length} products`}
            </p>
            <button onClick={() => navigate(selectedState ? `/products?state=${selectedState}` : '/products')}
              style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              VIEW ALL →
            </button>
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
          ) : displayProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: '32px', marginBottom: '12px' }}>🛍️</p>
              <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginBottom: '8px' }}>
                {selectedState ? `No products from ${selectedState} yet` : 'No products yet'}
              </p>
              <p style={{ fontSize: '13px', color: S.muted, marginBottom: '20px', fontFamily: S.sans }}>
                Be the first artisan to list products from this region
              </p>
              <button onClick={() => navigate('/seller/register')}
                style={{ background: S.accent, color: '#fff', padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                START SELLING
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
              {displayProducts.map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)}
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 40px' }}>
          <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: '32px' }}>
            <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>Recently viewed</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
              {recentlyViewed.slice(0, 4).map(p => (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }} className="group">
                  <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px', background: (CAT_STYLE[p.category] || CAT_STYLE['Other']).bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '40px', opacity: .6 }}>{(CAT_STYLE[p.category] || CAT_STYLE['Other']).emoji}</span>
                    }
                  </div>
                  <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '2px', fontFamily: S.sans }}>{p.state?.toUpperCase()}</p>
                  <p style={{ fontFamily: S.serif, fontSize: '13px', color: S.dark, marginBottom: '4px' }}>{p.title}</p>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹{Number(p.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dark banner */}
      <div style={{ background: S.dark, margin: isMobile ? '0 16px 24px' : '0 40px 40px', padding: isMobile ? '32px 20px' : '52px 64px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '48px', alignItems: 'center', borderRadius: '4px' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.gold, marginBottom: '14px', fontFamily: S.sans }}>THE BIHAAN PROMISE</p>
          <h2 style={{ fontFamily: S.serif, fontSize: '34px', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '14px' }}>
            Every purchase<br /><em style={{ color: S.gold }}>empowers</em> a maker
          </h2>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8, fontFamily: S.sans }}>
            Behind every item on Bihaan is a real person — an artisan who has spent decades mastering their craft.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '20px', textAlign: 'center' }}>
          {[['240+','PRODUCTS'],['8','STATES'],['50+','ARTISANS']].map(([num, label]) => (
            <div key={label}>
              <p style={{ fontFamily: S.serif, fontSize: '34px', color: S.gold, fontWeight: 400, marginBottom: '4px' }}>{num}</p>
              <p style={{ fontSize: '10px', letterSpacing: '.15em', color: '#666', fontFamily: S.sans }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}