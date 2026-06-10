import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  { name: 'All Products',    count: 240 },
  { name: 'Silk & Textiles', count: 48  },
  { name: 'Handloom',        count: 62  },
  { name: 'Bamboo Crafts',   count: 35  },
  { name: 'Brass & Metal',   count: 29  },
  { name: 'Tea & Spices',    count: 41  },
  { name: 'Tribal Crafts',   count: 33  },
  { name: 'Pottery',         count: 18  },
  { name: 'Jewellery',       count: 27  },
]

const states = [
  'Assam','Manipur','Meghalaya','Nagaland',
  'Arunachal Pradesh','Mizoram','Tripura','Sikkim'
]

const featured = [
  { id:1,  name:'Muga Silk Saree',      price:4500, orig:5200, seller:'Rekha Bora',   state:'Assam',             cat:'Silk & Textiles', bg:'#f9f0e8', emoji:'🧵', time:'4 days' },
  { id:2,  name:'Bamboo Pendant Lamp',  price:850,  orig:null, seller:'Mohan Das',    state:'Tripura',           cat:'Bamboo Crafts',   bg:'#edf5ee', emoji:'🎋', time:'2 days' },
  { id:3,  name:'Xorai Brass Tray',     price:1200, orig:null, seller:'Dipali Gogoi', state:'Assam',             cat:'Brass & Metal',   bg:'#fdf7e3', emoji:'🏺', time:'3 days' },
  { id:4,  name:'Orthodox Gold Tea',    price:450,  orig:550,  seller:'Rahim Ali',    state:'Assam',             cat:'Tea & Spices',    bg:'#fef5e7', emoji:'🍵', time:'1 day'  },
  { id:5,  name:'Naga Warrior Shawl',   price:2800, orig:null, seller:'Leno Angami',  state:'Nagaland',          cat:'Handloom',        bg:'#f3f0fb', emoji:'🪡', time:'6 days' },
  { id:6,  name:'Longpi Pottery Bowl',  price:650,  orig:null, seller:'Sana Devi',    state:'Manipur',           cat:'Pottery',         bg:'#fdf0e8', emoji:'🏛️', time:'2 days' },
  { id:7,  name:'Arunachal Wood Mask',  price:2200, orig:null, seller:'Tashi Dorje',  state:'Arunachal Pradesh', cat:'Tribal Crafts',   bg:'#eef3f8', emoji:'🎨', time:'7 days' },
  { id:8,  name:'Tribal Silver Ring',   price:920,  orig:1100, seller:'Pemba Sherpa', state:'Sikkim',            cat:'Jewellery',       bg:'#fdf0f5', emoji:'💍', time:'3 days' },
]

function NavBar({ navigate }) {
  const { user, signOut }  = useAuth()
  const { totalItems }     = useCart()

  return (
    <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <Logo size={36} showText={true} />
      </div>

      <div style={{ display: 'flex', gap: '28px' }}>
        {['Products','Artisans','Our Story','States'].map(item => (
          <span key={item}
            onClick={() => item === 'Products' && navigate('/products')}
            style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>
            {item}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Sell with us */}
        <span onClick={() => navigate('/seller/register')}
          style={{ fontSize: '12px', color: S.accent, letterSpacing: '.08em', cursor: 'pointer', fontFamily: S.sans }}>
          SELL WITH US
        </span>

        {/* Cart icon */}
        <span onClick={() => navigate('/cart')}
          style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
          🛒
          {totalItems > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
              {totalItems}
            </span>
          )}
        </span>

        {/* Auth */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>
              {user.email.split('@')[0]}
            </span>
            <button onClick={signOut}
              style={{ fontSize: '11px', letterSpacing: '.08em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '7px 12px', cursor: 'pointer', fontFamily: S.sans }}>
              SIGN OUT
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')}
            style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
            SIGN IN
          </button>
        )}
      </div>
    </nav>
  )
}

function ProductCard({ product, navigate }) {
  return (
    <div onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: 'pointer' }}
      className="group">
      <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', position: 'relative', background: product.bg }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .4s cubic-bezier(.2,.8,.2,1)' }}
          className="group-hover:scale-105">
          <span style={{ fontSize: '48px', opacity: .6 }}>{product.emoji}</span>
        </div>
        {product.orig && (
          <div style={{ position: 'absolute', top: '7px', left: '7px', background: S.accent, color: '#fff', fontSize: '9px', letterSpacing: '.1em', padding: '3px 7px', fontFamily: S.sans }}>
            SALE
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(0deg,rgba(26,18,8,.65) 0%,transparent 100%)', display: 'flex', justifyContent: 'center' }}
          className="opacity-0 group-hover:opacity-100 transition-opacity">
          <span style={{ color: '#fff', fontSize: '10px', letterSpacing: '.15em', fontFamily: S.sans }}>QUICK VIEW</span>
        </div>
      </div>
      <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{product.state.toUpperCase()}</p>
      <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '3px', lineHeight: 1.3 }}>{product.name}</p>
      <p style={{ fontSize: '11px', color: S.muted, marginBottom: '7px', fontFamily: S.sans }}>by {product.seller} · {product.time} to make</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹{product.price.toLocaleString()}</span>
        {product.orig && <span style={{ fontSize: '11px', color: '#b0a498', textDecoration: 'line-through', fontFamily: S.sans }}>₹{product.orig.toLocaleString()}</span>}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        FREE SHIPPING ON ORDERS ABOVE ₹999 &nbsp;·&nbsp; AUTHENTIC NORTHEAST INDIA &nbsp;·&nbsp; 50+ VERIFIED ARTISANS
      </div>

      <NavBar navigate={navigate} />

      {/* Hero */}
      <div style={{ background: S.white, padding: '64px 40px 48px', borderBottom: `1px solid ${S.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div onClick={() => navigate('/product/1')}
            style={{ gridColumn: 'span 2', background: '#f9f0e8', borderRadius: '4px', padding: '18px', height: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            className="hover:-translate-y-1 transition-transform">
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, marginBottom: '4px', fontFamily: S.sans }}>ASSAM · SILK & TEXTILES</p>
              <p style={{ fontFamily: S.serif, fontSize: '17px', color: S.dark }}>Muga Silk Saree</p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹4,500</p>
            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '52px', opacity: .45 }}>🧵</span>
          </div>
          <div onClick={() => navigate('/product/2')}
            style={{ background: '#edf5ee', borderRadius: '4px', padding: '18px', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            className="hover:-translate-y-1 transition-transform">
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, marginBottom: '4px', fontFamily: S.sans }}>TRIPURA</p>
              <p style={{ fontFamily: S.serif, fontSize: '15px', color: S.dark }}>Bamboo Lamp</p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹850</p>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '36px', opacity: .45 }}>🎋</span>
          </div>
          <div onClick={() => navigate('/product/3')}
            style={{ background: '#fdf7e3', borderRadius: '4px', padding: '18px', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            className="hover:-translate-y-1 transition-transform">
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, marginBottom: '4px', fontFamily: S.sans }}>ASSAM</p>
              <p style={{ fontFamily: S.serif, fontSize: '15px', color: S.dark }}>Xorai Tray</p>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹1,200</p>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '36px', opacity: .45 }}>🏺</span>
          </div>
        </div>
      </div>

      {/* States strip */}
      <div style={{ background: S.accent, padding: '11px 40px', display: 'flex', gap: '28px', justifyContent: 'center', overflowX: 'auto' }}>
        {states.map(s => (
          <span key={s} onClick={() => navigate(`/products?state=${s}`)}
            style={{ color: '#fff', fontSize: '11px', letterSpacing: '.12em', whiteSpace: 'nowrap', cursor: 'pointer', opacity: .85, fontFamily: S.sans }}
            className="hover:opacity-100 transition-opacity">
            {s.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Main */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 0, maxWidth: '1280px', margin: '0 auto', padding: '36px 40px' }}>
        <div style={{ paddingRight: '28px', borderRight: `1px solid ${S.border}` }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>CATEGORIES</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '28px' }}>
            {categories.map((cat, i) => (
              <button key={cat.name} onClick={() => navigate(`/products?category=${cat.name}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: i === 0 ? `2px solid ${S.accent}` : '2px solid transparent', background: i === 0 ? '#fef5f3' : 'transparent', color: i === 0 ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
                <span>{cat.name}</span>
                <span style={{ fontSize: '11px', color: '#b0a498' }}>{cat.count}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.muted, marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${S.border}`, fontFamily: S.sans }}>BY STATE</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {['All', ...states].map((s, i) => (
              <button key={s} onClick={() => navigate(`/products?state=${s}`)}
                style={{ padding: '8px 10px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: i === 0 ? `2px solid ${S.accent}` : '2px solid transparent', background: i === 0 ? '#fef5f3' : 'transparent', color: i === 0 ? S.accent : S.dark, width: '100%', textAlign: 'left', fontFamily: S.sans }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ paddingLeft: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>8 featured products</p>
            <button onClick={() => navigate('/products')}
              style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              VIEW ALL →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
            {featured.map(p => <ProductCard key={p.id} product={p} navigate={navigate} />)}
          </div>
        </div>
      </div>

      {/* Dark banner */}
      <div style={{ background: S.dark, margin: '0 40px 40px', padding: '52px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', borderRadius: '4px' }}>
        <div>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.gold, marginBottom: '14px', fontFamily: S.sans }}>THE BIHAAN PROMISE</p>
          <h2 style={{ fontFamily: S.serif, fontSize: '34px', fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: '14px', letterSpacing: '-.01em' }}>
            Every purchase<br /><em style={{ fontStyle: 'italic', color: S.gold }}>empowers</em> a maker
          </h2>
          <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8, fontFamily: S.sans }}>
            Behind every item on Bihaan is a real person — an artisan who has spent decades mastering their craft. We tell their story so you know exactly who made what you buy.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', textAlign: 'center' }}>
          {[['240+','PRODUCTS'],['8','STATES'],['50+','ARTISANS']].map(([num, label]) => (
            <div key={label}>
              <p style={{ fontFamily: S.serif, fontSize: '34px', color: S.gold, fontWeight: 400, marginBottom: '4px' }}>{num}</p>
              <p style={{ fontSize: '10px', letterSpacing: '.15em', color: '#666', fontFamily: S.sans }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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