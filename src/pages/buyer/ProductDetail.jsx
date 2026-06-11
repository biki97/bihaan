import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e72',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const allProducts = [
  { id:1,  name:'Muga Silk Saree',       price:4500, orig:5200, seller:'Rekha Bora',     state:'Assam',             cat:'Silk & Textiles', bg:'#f9f0e8', emoji:'🧵', time:'4 days', exp:'35 years', village:'Sualkuchi',   desc:'The Muga silk saree is one of the rarest and most precious textiles in the world, found only in Assam. Woven from the golden threads of the Antheraea assamensis silkworm, each saree takes weeks of careful work. Rekha Bora has been weaving Muga silk for over 35 years in the weaving village of Sualkuchi, passing down techniques learned from her mother.', material:'Pure Muga silk', wash:'Dry clean only', weight:'650g' },
  { id:2,  name:'Bamboo Pendant Lamp',   price:850,  orig:null, seller:'Mohan Das',      state:'Tripura',           cat:'Bamboo Crafts',   bg:'#edf5ee', emoji:'🎋', time:'2 days', exp:'20 years', village:'Agartala',    desc:'Hand-crafted from locally sourced Tripura bamboo, this pendant lamp casts beautiful patterned shadows when lit. Each lamp is unique — the weave pattern varies slightly with every piece. Mohan Das has been crafting bamboo products for over 20 years, exporting to customers across India.', material:'Natural bamboo', wash:'Wipe with dry cloth', weight:'320g' },
  { id:3,  name:'Xorai Brass Tray',      price:1200, orig:null, seller:'Dipali Gogoi',   state:'Assam',             cat:'Brass & Metal',   bg:'#fdf7e3', emoji:'🏺', time:'3 days', exp:'28 years', village:'Sarthebari',  desc:'The Xorai is a traditional Assamese ceremonial tray used in religious offerings and cultural ceremonies. Cast in pure brass using the centuries-old cire perdue (lost-wax) technique, each Xorai from Sarthebari — the brass town of Assam — is a piece of living heritage. Dipali Gogoi represents the third generation of brass craftsmen in her family.', material:'Pure brass', wash:'Polish with brass cleaner', weight:'480g' },
  { id:4,  name:'Orthodox Gold Tea',     price:450,  orig:550,  seller:'Rahim Ali',      state:'Assam',             cat:'Tea & Spices',    bg:'#fef5e7', emoji:'🍵', time:'1 day',  exp:'15 years', village:'Jorhat',      desc:'Hand-rolled whole-leaf orthodox tea from the Jorhat gardens of upper Assam. Assam orthodox tea is known worldwide for its rich malty flavor and natural golden liquor. Rahim Ali works directly with small tea growers to bring you garden-fresh tea without any blending or artificial processing.', material:'100% Assam tea leaves', wash:'Brew at 95°C for 3-4 mins', weight:'200g' },
  { id:5,  name:'Naga Warrior Shawl',    price:2800, orig:null, seller:'Leno Angami',    state:'Nagaland',          cat:'Handloom',        bg:'#f3f0fb', emoji:'🪡', time:'6 days', exp:'40 years', village:'Kohima',      desc:'The traditional Naga warrior shawl is a symbol of status and achievement in Angami Naga culture. Each geometric pattern carries a specific meaning — the bold red and black stripes represent courage. Leno Angami is a master weaver from Kohima who has spent 40 years preserving these ancient weaving traditions.', material:'Hand-spun cotton', wash:'Hand wash cold', weight:'420g' },
  { id:6,  name:'Longpi Pottery Bowl',   price:650,  orig:null, seller:'Sana Devi',      state:'Manipur',           cat:'Pottery',         bg:'#fdf0e8', emoji:'🏛️', time:'2 days', exp:'22 years', village:'Longpi Gram', desc:'Longpi pottery from Manipur is made without a wheel — entirely by hand using a unique technique involving serpentinite stone and clay. The distinctive dark grey-black finish is natural, achieved through burnishing. No two pieces are identical. Sana Devi is one of the few remaining potters keeping this UNESCO-recognized craft alive.', material:'Serpentinite & clay', wash:'Hand wash only', weight:'380g' },
  { id:7,  name:'Cane Woven Basket',     price:380,  orig:null, seller:'Biren Singh',    state:'Manipur',           cat:'Bamboo Crafts',   bg:'#edf5ee', emoji:'🎋', time:'1 day',  exp:'18 years', village:'Imphal',      desc:'Handwoven from locally harvested cane, this basket is both beautiful and functional. The intricate weave pattern is a traditional Meitei design passed down through generations of Manipuri craftsmen. Perfect for storage, gifting, or home decoration.', material:'Natural cane', wash:'Wipe with damp cloth', weight:'280g' },
  { id:8,  name:'Tribal Silver Ring',    price:920,  orig:1100, seller:'Pemba Sherpa',   state:'Sikkim',            cat:'Jewellery',       bg:'#fdf0f5', emoji:'💍', time:'3 days', exp:'25 years', village:'Gangtok',     desc:'Hand-forged from 92.5% sterling silver by Pemba Sherpa in Gangtok, Sikkim. The tribal motifs etched into the band are inspired by ancient Lepcha tribal symbols representing protection and good fortune. Each ring is made to order and adjusted to fit.', material:'Sterling silver 92.5%', wash:'Polish with silver cloth', weight:'12g' },
]

const reviews = [
  { name:'Priya Sharma', city:'Delhi',     rating:5, text:'Absolutely stunning saree. The quality is exceptional and it arrived beautifully wrapped. Will definitely order again.' },
  { name:'Rahul Mehta',  city:'Bangalore', rating:5, text:'Bought the Xorai tray as a gift. My mother was in tears — she said it reminded her of home. Thank you Bihaan.' },
  { name:'Sunita Bora',  city:'Mumbai',    rating:4, text:'The tea is incredible. Best Assam tea I have had outside Assam itself. Fast shipping too.' },
]

function NavBar({ navigate, user, role, signOut, totalItems }) {
  return (
    <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
      <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
      <div style={{ display: 'flex', gap: '28px' }}>
        {['Products','Artisans','Our Story','States'].map(item => (
          <span key={item} onClick={() => item === 'Products' && navigate('/products')}
            style={{ fontSize: '13px', color: S.muted, letterSpacing: '.05em', cursor: 'pointer', fontFamily: S.sans }}>{item}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span onClick={() => navigate('/cart')}
          style={{ fontSize: '18px', cursor: 'pointer', position: 'relative' }}>
          🛒
          {totalItems > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: S.accent, color: '#fff', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
              {totalItems}
            </span>
          )}
        </span>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>{user.email.split('@')[0]}</span>
            {role === 'seller' && (
              <span onClick={() => navigate('/seller/dashboard')}
                style={{ fontSize: '11px', color: S.accent, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>
                MY DASHBOARD
              </span>
            )}
            {user?.email === 'bikidutta319@gmail.com' && (
              <span onClick={() => navigate('/admin')}
                style={{ fontSize: '11px', color: S.gold, cursor: 'pointer', fontFamily: S.sans, letterSpacing: '.08em' }}>
                ADMIN ⚙️
              </span>
            )}
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

export default function ProductDetail() {
  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const { addToCart, totalItems } = useCart()
  const { user, role, signOut }    = useAuth()
  const product                   = allProducts.find(p => p.id === Number(id)) || allProducts[0]
  const [qty,   setQty]           = useState(1)
  const [added, setAdded]         = useState(false)
  const related                   = allProducts.filter(p => p.id !== product.id).slice(0, 4)

  function handleAddToCart() {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div style={{ background: S.bg, fontFamily: S.sans, minHeight: '100vh' }}>

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
          <span style={{ color: S.dark }}>{product.name.toUpperCase()}</span>
        </p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
        <div>
          <div style={{ background: product.bg, borderRadius: '4px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '120px', opacity: .6 }}>{product.emoji}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: product.bg, borderRadius: '3px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: i === 1 ? `2px solid ${S.accent}` : '2px solid transparent' }}>
                <span style={{ fontSize: '24px', opacity: .5 }}>{product.emoji}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', letterSpacing: '.12em', color: S.accent, fontFamily: S.sans }}>{product.cat.toUpperCase()}</span>
            <span style={{ color: S.muted }}>·</span>
            <span style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, fontFamily: S.sans }}>{product.state.toUpperCase()}</span>
          </div>

          <h1 style={{ fontFamily: S.serif, fontSize: '2.4rem', fontWeight: 400, color: S.dark, lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-.02em' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ color: S.gold, fontSize: '14px' }}>★</span>)}
            </div>
            <span style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>4.9 · {reviews.length} reviews</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${S.border}` }}>
            <span style={{ fontFamily: S.serif, fontSize: '2rem', color: S.dark, fontWeight: 400 }}>₹{product.price.toLocaleString()}</span>
            {product.orig && (
              <>
                <span style={{ fontSize: '16px', color: '#b0a498', textDecoration: 'line-through', fontFamily: S.sans }}>₹{product.orig.toLocaleString()}</span>
                <span style={{ background: S.accent, color: '#fff', fontSize: '10px', padding: '3px 8px', letterSpacing: '.08em', fontFamily: S.sans }}>
                  {Math.round((1 - product.price / product.orig) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.85, marginBottom: '28px', fontFamily: S.sans }}>{product.desc}</p>

          <div style={{ marginBottom: '28px', padding: '16px 0', borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }}>
            {[['Material',product.material],['Care',product.wash],['Weight',product.weight],['Time to make',product.time]].map(([label, val]) => (
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
              <button onClick={() => setQty(q => q + 1)} style={{ padding: '10px 14px', background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: S.dark }}>+</button>
            </div>
            <button onClick={handleAddToCart}
              style={{ flex: 1, background: added ? '#2d6a4f' : S.dark, color: '#fff', padding: '12px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', transition: 'background .3s', fontFamily: S.sans }}>
              {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
            </button>
          </div>

          <button onClick={() => { addToCart(product, qty); navigate('/cart') }}
            style={{ width: '100%', background: S.accent, color: '#fff', padding: '13px', fontSize: '12px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans, marginBottom: '24px' }}>
            BUY NOW — ₹{(product.price * qty).toLocaleString()}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {[['✓','Verified authentic'],['⟳','Easy returns'],['🔒','Secure payment']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px', border: `1px solid ${S.border}`, borderRadius: '3px' }}>
                <p style={{ fontSize: '14px', marginBottom: '3px' }}>{icon}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 48px' }}>
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '36px 40px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: product.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0 }}>
            {product.emoji}
          </div>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '6px', fontFamily: S.sans }}>THE ARTISAN</p>
            <h3 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '6px' }}>{product.seller}</h3>
            <p style={{ fontSize: '12px', color: S.muted, marginBottom: '10px', fontFamily: S.sans }}>{product.village}, {product.state} · {product.exp} of experience</p>
            <p style={{ fontSize: '13px', color: S.muted, lineHeight: 1.75, fontFamily: S.sans }}>
              {product.seller.split(' ')[0]} is a master craftsperson from {product.village} with {product.exp} of experience in {product.cat.toLowerCase()}. Every product is made by hand using traditional techniques passed down through generations.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 48px' }}>
        <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px', letterSpacing: '-.01em' }}>Customer reviews</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? S.gold : '#e2d8ce', fontSize: '12px' }}>★</span>)}
              </div>
              <p style={{ fontSize: '13px', color: S.dark, lineHeight: 1.75, marginBottom: '14px', fontFamily: S.sans, fontStyle: 'italic' }}>"{r.text}"</p>
              <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>— {r.name}, {r.city}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 40px 60px' }}>
        <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '24px', letterSpacing: '-.01em' }}>You may also like</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
          {related.map(p => (
            <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }} className="group">
              <div style={{ aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: '48px', opacity: .6 }} className="group-hover:scale-105 transition-transform">{p.emoji}</span>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'linear-gradient(0deg,rgba(26,18,8,.65) 0%,transparent 100%)', display: 'flex', justifyContent: 'center' }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span style={{ color: '#fff', fontSize: '10px', letterSpacing: '.15em', fontFamily: S.sans }}>QUICK VIEW</span>
                </div>
              </div>
              <p style={{ fontSize: '10px', letterSpacing: '.08em', color: S.accent, marginBottom: '3px', fontFamily: S.sans }}>{p.state.toUpperCase()}</p>
              <p style={{ fontFamily: S.serif, fontSize: '14px', color: S.dark, marginBottom: '6px' }}>{p.name}</p>
              <span style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>₹{p.price.toLocaleString()}</span>
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