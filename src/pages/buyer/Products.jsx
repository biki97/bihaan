import { useIsMobile } from '../../hooks/useIsMobile'
import { useState, useEffect } from 'react'
import { useCart }     from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useCurrency } from '../../context/CurrencyContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'
import StarRating from '../../components/StarRating'
import AccountMenu from '../../components/AccountMenu'
import Footer from '../../components/Footer'

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

// ── Search helpers ──
// Relevance score: title matches weigh most, then category/state, then description.
function scoreProduct(p, rawQuery) {
  const q = rawQuery.toLowerCase().trim()
  if (!q) return 0
  const title = (p.title || '').toLowerCase()
  const cat   = (p.category || '').toLowerCase()
  const state = (p.state || '').toLowerCase()
  const desc  = (p.description || '').toLowerCase()
  let s = 0
  if (title === q)            s += 100
  if (title.startsWith(q))    s += 50
  if (title.includes(q))      s += 30
  if (cat.includes(q))        s += 15
  if (state.includes(q))      s += 10
  if (desc.includes(q))       s += 5
  for (const w of q.split(/\s+/)) {
    if (!w) continue
    if (title.includes(w)) s += 8
    if (cat.includes(w))   s += 4
    if (desc.includes(w))  s += 2
  }
  return s
}

// Levenshtein distance — for "did you mean" suggestions on a no-results search.
function levenshtein(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase()
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

// Find the closest product title / category to a query (for "did you mean").
function closestMatch(query, products) {
  const q = query.toLowerCase().trim()
  if (!q) return null
  const candidates = []
  for (const p of products) if (p.title) candidates.push(p.title)
  const cats = ['Silk & Textiles','Handloom','Bamboo Crafts','Brass & Metal','Tea & Spices','Heritage Crafts','Pottery','Jewellery']
  candidates.push(...cats)
  let best = null, bestDist = Infinity
  for (const c of candidates) {
    // compare query against the candidate and against each of its words
    const words = c.toLowerCase().split(/\s+/)
    const dists = [levenshtein(q, c.toLowerCase()), ...words.map(w => levenshtein(q, w))]
    const d = Math.min(...dists)
    if (d < bestDist) { bestDist = d; best = c }
  }
  // only suggest if it's reasonably close (not a wild guess)
  return bestDist <= Math.max(2, Math.floor(q.length / 2)) ? best : null
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
  const isMobile = useIsMobile()

  const navigate                           = useNavigate()
  const [searchParams]                     = useSearchParams()
  const { totalItems }                     = useCart()
  const { toggleWishlist, isWishlisted, wishlist } = useWishlist()
  const { formatPrice }                    = useCurrency()

  const [allProducts, setAllProducts] = useState([])
  const [ratings,     setRatings]     = useState({})   // { productId: { avg, count } }
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [cat,         setCat]         = useState(searchParams.get('category') || 'All Products')
  const [state,       setState]       = useState(searchParams.get('state') || 'All')
  const [sort,        setSort]        = useState('best')
  const [priceMax,    setPriceMax]    = useState(10000)
  const [showSuggest, setShowSuggest] = useState(false)

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

    // Average rating per product (one query, aggregated client-side)
    const { data: revs } = await supabase.from('reviews').select('product_id, rating')
    const acc = {}
    for (const r of (revs || [])) {
      acc[r.product_id] = acc[r.product_id] || { sum: 0, count: 0 }
      acc[r.product_id].sum += r.rating
      acc[r.product_id].count += 1
    }
    const avgMap = {}
    for (const pid in acc) avgMap[pid] = { avg: acc[pid].sum / acc[pid].count, count: acc[pid].count }
    setRatings(avgMap)

    setLoading(false)
  }

  const q = search.trim()
  const ratingOf = id => (ratings[id] ? ratings[id].avg : 0)
  const countOf  = id => (ratings[id] ? ratings[id].count : 0)

  // Apply filters first (these always combine with AND)
  const baseFiltered = allProducts
    .filter(p => cat   === 'All Products' || p.category === cat)
    .filter(p => state === 'All'          || p.state    === state)
    .filter(p => p.price <= priceMax)

  // Then search: relevance scoring across title/category/state/description
  const searched = q
    ? baseFiltered
        .map(p => ({ p, score: scoreProduct(p, q) }))
        .filter(x => x.score > 0)
        .map(x => x.p)
    : baseFiltered

  const filtered = [...searched].sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'rating')     return ratingOf(b.id) - ratingOf(a.id) || countOf(b.id) - countOf(a.id)
    if (sort === 'reviews')    return countOf(b.id) - countOf(a.id)
    if (sort === 'newest')     return new Date(b.created_at) - new Date(a.created_at)
    // 'best' = relevance when searching, else newest
    if (q) return scoreProduct(b, q) - scoreProduct(a, q)
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Autocomplete suggestions (product titles + matching categories)
  const suggestions = (() => {
    if (q.length < 1) return []
    const ql = q.toLowerCase()
    const titleHits = allProducts
      .filter(p => p.title?.toLowerCase().includes(ql))
      .slice(0, 5)
      .map(p => ({ type: 'product', label: p.title, id: p.id }))
    const catHits = categories
      .filter(c => c !== 'All Products' && c.toLowerCase().includes(ql))
      .slice(0, 3)
      .map(c => ({ type: 'category', label: c }))
    return [...titleHits, ...catHits].slice(0, 6)
  })()

  // "Did you mean" — only computed when a search returns nothing
  const didYouMean = (q && filtered.length === 0) ? closestMatch(q, allProducts) : null

  const activeFilters = [
    cat !== 'All Products' && { key: 'cat',   label: cat,            clear: () => setCat('All Products') },
    state !== 'All'        && { key: 'state', label: state,          clear: () => setState('All') },
    priceMax < 10000       && { key: 'price', label: `≤ ${formatPrice(priceMax)}`, clear: () => setPriceMax(10000) },
    q                      && { key: 'q',     label: `"${q}"`,       clear: () => setSearch('') },
  ].filter(Boolean)

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
          <AccountMenu />
        </div>
      </nav>

      {/* Page header */}
      <div style={{ background: S.white, padding: '24px 40px 20px', borderBottom: `1px solid ${S.border}` }}>
        <p style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, marginBottom: '8px', fontFamily: S.sans }}>HOME / PRODUCTS</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark }}>All Products</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <input type="text" placeholder="Search products..." value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggest(true) }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                style={{ fontSize: '13px', padding: '8px 16px', border: `1px solid ${S.border}`, background: S.bg, color: S.dark, outline: 'none', width: '100%', fontFamily: S.sans, boxSizing: 'border-box' }} />
              {showSuggest && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: S.white, border: `1px solid ${S.border}`, borderRadius: '3px', boxShadow: '0 6px 20px rgba(26,18,8,.08)', zIndex: 60, overflow: 'hidden' }}>
                  {suggestions.map((sug, i) => (
                    <div key={i}
                      onMouseDown={() => {
                        if (sug.type === 'product') navigate(`/product/${sug.id}`)
                        else { setCat(sug.label); setSearch(''); setShowSuggest(false) }
                      }}
                      style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: S.dark, fontFamily: S.sans, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: i < suggestions.length - 1 ? `1px solid ${S.border}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef9f7'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: '11px' }}>{sug.type === 'product' ? '🔍' : '🏷️'}</span>
                      <span>{sug.label}</span>
                      {sug.type === 'category' && <span style={{ fontSize: '10px', color: S.muted, marginLeft: 'auto' }}>CATEGORY</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ fontSize: '12px', padding: '8px 14px', border: `1px solid ${S.border}`, background: S.white, color: S.dark, outline: 'none', fontFamily: S.sans }}>
              <option value="best">{search.trim() ? 'Best match' : 'Featured'}</option>
              <option value="newest">Newest first</option>
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviewed</option>
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

          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>BY STATE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '28px' }}>

            <button onClick={() => { setState('All'); setCat('All Products') }}
              style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: state === 'All' ? `2px solid ${S.accent}` : '2px solid transparent', background: state === 'All' ? '#fef5f3' : 'transparent', color: state === 'All' ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
              All States
            </button>

            {states.slice(1).map(s => (
              <div key={s}>
                <button
                  onClick={() => { setState(state === s ? 'All' : s); setCat('All Products') }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: state === s ? `2px solid ${S.accent}` : '2px solid transparent', background: state === s ? '#fef5f3' : 'transparent', color: state === s ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
                  <span>{s}</span>
                  <span style={{ fontSize: '10px', color: S.muted }}>{state === s ? '▲' : '▼'}</span>
                </button>

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

          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>MAX PRICE</p>
          <input type="range" min="300" max="10000" step="100" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))}
            style={{ width: '100%', accentColor: S.accent, marginBottom: '6px' }} />
          <p style={{ fontSize: '12px', color: S.dark, fontFamily: S.sans }}>Up to {formatPrice(priceMax)}</p>
        </div>

        {/* Products grid */}
        <div style={{ paddingLeft: '36px' }}>
          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {activeFilters.map(f => (
                <button key={f.key} onClick={f.clear}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '5px 10px', borderRadius: '14px', border: `1px solid ${S.accent}`, background: '#fef9f7', color: S.accent, cursor: 'pointer', fontFamily: S.sans }}>
                  {f.label} <span style={{ fontSize: '13px' }}>×</span>
                </button>
              ))}
              <button onClick={() => { setCat('All Products'); setState('All'); setPriceMax(10000); setSearch('') }}
                style={{ fontSize: '11px', letterSpacing: '.08em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                CLEAR ALL
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>
              {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'} found`}
              {!loading && search.trim() && <span style={{ color: S.dark }}> for "{search.trim()}"</span>}
            </p>
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
              <p style={{ color: S.dark, fontFamily: S.sans, marginBottom: '6px', fontSize: '15px' }}>
                No products found{search.trim() ? ` for "${search.trim()}"` : ''}.
              </p>
              {didYouMean && (
                <p style={{ color: S.muted, fontFamily: S.sans, marginBottom: '16px', fontSize: '13px' }}>
                  Did you mean{' '}
                  <span onClick={() => setSearch(didYouMean)}
                    style={{ color: S.accent, cursor: 'pointer', textDecoration: 'underline' }}>
                    {didYouMean}
                  </span>?
                </p>
              )}
              <p style={{ color: S.muted, fontFamily: S.sans, marginBottom: '16px', fontSize: '13px' }}>
                Try fewer filters or a different search.
              </p>
              <button onClick={() => { setCat('All Products'); setState('All'); setPriceMax(10000); setSearch('') }}
                style={{ fontSize: '11px', letterSpacing: '.1em', color: '#fff', background: S.accent, padding: '10px 22px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
              {filtered.map(product => {
                const style = CAT_STYLE[product.category] || CAT_STYLE['Other']
                const hasImage = product.images && product.images[0]
                const wishlisted = isWishlisted(product.id)
                const onSale = product.mrp && Number(product.mrp) > Number(product.price)
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
                      {onSale && (
                        <div style={{ position: 'absolute', top: '7px', left: '7px', background: S.accent, color: '#fff', fontSize: '9px', letterSpacing: '.06em', padding: '3px 7px', fontFamily: S.sans }}>
                          {Math.round((Number(product.mrp) - Number(product.price)) / Number(product.mrp) * 100)}% OFF
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(product) }}
                        style={{ position: 'absolute', top: '7px', right: '7px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '13px' }}>
                        {wishlisted ? '❤️' : '🤍'}
                      </button>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>{formatPrice(product.price)}</span>
                        {onSale && (
                          <span style={{ fontSize: '11px', color: S.muted, textDecoration: 'line-through', fontFamily: S.sans }}>{formatPrice(product.mrp)}</span>
                        )}
                      </div>
                      {ratings[product.id] && (
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StarRating value={ratings[product.id].avg} size={13} />
                          <span style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>({ratings[product.id].count})</span>
                        </div>
                      )}
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

      <Footer />
    </div>
  )
}