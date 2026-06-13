import { useIsMobile } from '../../hooks/useIsMobile'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Logo from '../../components/Logo'
import { supabase }    from '../../lib/supabase'
import { useCart }     from '../../context/CartContext'
import { useAuth }     from '../../context/AuthContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e72',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

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

function NavBar({ navigate, user, role, signOut, totalItems }) {
  const isMobile = useIsMobile() // ✅ FIXED: hook called inside NavBar
  const { wishlist } = useWishlist()
  return (
    <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
      <div style={{ display: isMobile ? 'none' : 'flex', gap: '28px' }}>
        {['Products','Artisans','Our Story','States'].map(item => (
          <span key={item} onClick={() => item === 'Products' && navigate('/products')}
            style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>{item}</span>
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
  )
}

export default function ProductDetail() {
  const isMobile = useIsMobile() // ✅ FIXED: hook called inside ProductDetail

  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const { addToCart, totalItems } = useCart()
  const { user, role, signOut }   = useAuth()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const { formatPrice }           = useCurrency()

  const [product,        setProduct]        = useState(null)
  const [seller,         setSeller]         = useState(null)
  const [related,        setRelated]        = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [selectedImage,  setSelectedImage]  = useState(0)
  const [qty,            setQty]            = useState(1)
  const [added,          setAdded]          = useState(false)

  useEffect(() => {
    loadProduct()
  }, [id])

  async function loadProduct() {
    setLoading(true)
    setSelectedImage(0)

    const { data: prod } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (!prod) { navigate('/products'); return }
    setProduct(prod)

    if (prod.seller_id) {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('shop_name, state, district, description')
        .eq('id', prod.seller_id)
        .single()
      setSeller(sellerData)
    }

    const { data: relatedData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category', prod.category)
      .neq('id', id)
      .limit(4)
    setRelated(relatedData || [])

    try {
      const stored = JSON.parse(localStorage.getItem('bihaan_viewed') || '[]')
      const filtered = stored.filter(p => p.id !== prod.id)
      const updated = [prod, ...filtered].slice(0, 6)
      localStorage.setItem('bihaan_viewed', JSON.stringify(updated))
      setRecentlyViewed(filtered.slice(0, 4))
    } catch {}

    setLoading(false)
  }

  function handleAddToCart() {
    addToCart({ ...product, name: product.title, bg: (CAT_STYLE[product.category] || CAT_STYLE['Other']).bg, emoji: (CAT_STYLE[product.category] || CAT_STYLE['Other']).emoji }, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
      <p style={{ color: S.muted }}>Loading product...</p>
    </div>
  )

  if (!product) return null

  const catStyle = CAT_STYLE[product.category] || CAT_STYLE['Other']
  const hasImages = product.images && product.images.length > 0
  const wishlisted = isWishlisted(product.id)

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh', overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 &nbsp;·&nbsp; AUTHENTIC NORTHEAST INDIA
      </div>

      <NavBar navigate={navigate} user={user} role={role} signOut={signOut} totalItems={totalItems} />

      <div style={{ padding: '14px 40px', background: S.white, borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '.08em', color: S.muted, fontFamily: S.sans }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>HOME</span>
          {' / '}
          <span onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>PRODUCTS</span>
          {' / '}
          <span style={{ color: S.dark }}>{product.title?.toUpperCase()}</span>
        </p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '60px', alignItems: 'start' }}>

        {/* Images */}
        <div>
          <div style={{ background: catStyle.bg, borderRadius: '4px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', overflow: 'hidden', position: 'relative' }}>
            {hasImages ? (
              <img src={product.images[selectedImage]} alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '120px', opacity: .6 }}>{catStyle.emoji}</span>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#b91c1c', color: '#fff', fontSize: '10px', letterSpacing: '.08em', padding: '4px 10px', fontFamily: S.sans }}>
                ONLY {product.stock} LEFT
              </div>
            )}
          </div>
          {hasImages && product.images.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '8px' }}>
              {product.images.map((img, i) => (
                <div key={i} onClick={() => setSelectedImage(i)}
                  style={{ borderRadius: '3px', aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', border: selectedImage === i ? `2px solid ${S.accent}` : '2px solid transparent' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
          {!hasImages && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '8px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: catStyle.bg, borderRadius: '3px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: i === 1 ? `2px solid ${S.accent}` : '2px solid transparent' }}>
                  <span style={{ fontSize: '24px', opacity: .5 }}>{catStyle.emoji}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', letterSpacing: '.12em', color: S.accent, fontFamily: S.sans }}>{product.category?.toUpperCase()}</span>
            <span style={{ color: S.muted }}>·</span>
            <span style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, fontFamily: S.sans }}>{product.state?.toUpperCase()}</span>
          </div>

          <h1 style={{ fontFamily: S.serif, fontSize: '2.4rem', fontWeight: 400, color: S.dark, lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-.02em' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontFamily: S.serif, fontSize: '2rem', color: S.dark, fontWeight: 400 }}>
              {formatPrice(product.price)}
            </span>
          </div>

          {product.stock <= 3 && product.stock > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>
                🔥 Only {product.stock} left — order soon before it sells out
              </p>
            </div>
          )}

          <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.85, marginBottom: '28px', fontFamily: S.sans }}>
            {product.description}
          </p>

          <div style={{ marginBottom: '28px', padding: '16px 0', borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }}>
            {[
              ['Category',    product.category],
              ['State',       product.state],
              ['Stock',       `${product.stock} available`],
            ].map(([label, val]) => val && (
              <div key={label} style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '13px', fontFamily: S.sans }}>
                <span style={{ color: S.muted, minWidth: '100px' }}>{label}</span>
                <span style={{ color: S.dark }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${S.border}` }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '10px 14px', background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: S.dark }}>−</button>
              <span style={{ padding: '10px 16px', fontSize: '14px', color: S.dark, fontFamily: S.sans, minWidth: '40px', textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ padding: '10px 14px', background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: S.dark }}>+</button>
            </div>
            <button onClick={handleAddToCart}
              style={{ flex: 1, background: added ? '#2d6a4f' : S.dark, color: '#fff', padding: '12px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', transition: 'background .3s', fontFamily: S.sans }}>
              {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
            </button>
            <button onClick={() => toggleWishlist(product)}
              style={{ padding: '12px 14px', background: wishlisted ? '#fef2f2' : S.white, border: `1px solid ${wishlisted ? '#fecaca' : S.border}`, cursor: 'pointer', fontSize: '18px', borderRadius: '3px' }}>
              {wishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          <button onClick={() => { handleAddToCart(); navigate('/cart') }}
            style={{ width: '100%', background: S.accent, color: '#fff', padding: '13px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans, marginBottom: '24px' }}>
            BUY NOW — {formatPrice(product.price * qty)}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '12px' }}>
            {[['✓','Verified authentic'],['⟳','Easy returns'],['🔒','Secure payment']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px', border: `1px solid ${S.border}`, borderRadius: '3px' }}>
                <p style={{ fontSize: '14px', marginBottom: '3px' }}>{icon}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seller info */}
      {seller && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 48px' }}>
          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: isMobile ? '24px 16px' : '36px 40px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: catStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0 }}>
              {catStyle.emoji}
            </div>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '6px', fontFamily: S.sans }}>THE ARTISAN</p>
              <h3 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '6px' }}>{seller.shop_name}</h3>
              <p style={{ fontSize: '12px', color: S.muted, marginBottom: '10px', fontFamily: S.sans }}>{seller.district}, {seller.state}</p>
              {seller.description && (
                <p style={{ fontSize: '13px', color: S.muted, lineHeight: 1.75, fontFamily: S.sans }}>{seller.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 48px' }}>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>Recently viewed</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
            {recentlyViewed.map(p => {
              const ps = CAT_STYLE[p.category] || CAT_STYLE['Other']
              return (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }} className="group">
                  <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="group-hover:scale-105 transition-transform" />
                      : <span style={{ fontSize: '48px', opacity: .6 }}>{ps.emoji}</span>
                    }
                  </div>
                  <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{p.state?.toUpperCase()}</p>
                  <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '6px' }}>{p.title}</p>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>{formatPrice(p.price)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 60px' }}>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
            {related.map(p => {
              const ps = CAT_STYLE[p.category] || CAT_STYLE['Other']
              return (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }} className="group">
                  <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="group-hover:scale-105 transition-transform" />
                      : <span style={{ fontSize: '48px', opacity: .6 }} className="group-hover:scale-105 transition-transform">{ps.emoji}</span>
                    }
                    {p.stock <= 3 && p.stock > 0 && (
                      <div style={{ position: 'absolute', bottom: '7px', left: '7px', background: 'rgba(26,18,8,0.85)', color: '#fff', fontSize: '9px', padding: '3px 7px', fontFamily: S.sans }}>
                        ONLY {p.stock} LEFT
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(0deg,rgba(26,18,8,.65) 0%,transparent 100%)', display: 'flex', justifyContent: 'center' }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span style={{ color: '#fff', fontSize: '10px', letterSpacing: '.15em', fontFamily: S.sans }}>QUICK VIEW</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{p.state?.toUpperCase()}</p>
                  <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '6px' }}>{p.title}</p>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>{formatPrice(p.price)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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