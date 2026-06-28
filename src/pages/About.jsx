// src/pages/About.jsx
//
// Bihaan's story — mission, the problem, how it works, and a founder's note.
// Route it in App.jsx:  <Route path="/about" element={<About />} />
// It sits directly in src/pages/ (like Legal.jsx), so imports use '../components/...'
//
// ⚠️ Text in [[brackets]] is a placeholder — only YOU can write those bits (your name,
//    your home, a real memory). They're highlighted amber on the page so you can't miss them.
//    The mission / how-it-works prose is ready to use as-is, but make it sound like you.

import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Footer from '../components/Footer'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

function PH({ children }) {
  return <span style={{ background: '#fdeccb', color: '#92400e', padding: '0 4px', borderRadius: '2px' }}>{children}</span>
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans, overflowX: 'hidden' }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        OUR STORY · AUTHENTIC NORTHEAST INDIA
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
        <button onClick={() => navigate('/products')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          SHOP THE COLLECTION →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '72px 24px 64px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.25em', color: S.accent, marginBottom: '20px', fontFamily: S.sans }}>THE STORY BEHIND BIHAAN</p>
          <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(2.2rem,5vw,3.4rem)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-.02em', color: S.dark, marginBottom: '24px' }}>
            A bridge between the hands that make<br />and the people who cherish
          </h1>
          <p style={{ fontSize: '15px', color: S.muted, lineHeight: 1.9, maxWidth: '600px', margin: '0 auto', fontFamily: S.sans }}>
            <em>Bihaan</em> means <PH>[[“dawn” / your chosen meaning]]</PH> — a new beginning. We exist to carry the
            craft of Northeast India to the world, and to make sure the artisans behind every piece are seen,
            valued, and fairly paid.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 0' }}>
        <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '14px', fontFamily: S.sans }}>OUR MISSION</p>
        <h2 style={{ fontFamily: S.serif, fontSize: '1.9rem', fontWeight: 400, color: S.dark, marginBottom: '20px', lineHeight: 1.2 }}>
          Northeast India makes some of the most extraordinary crafts in the world. Almost no one gets to see them.
        </h2>
        <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, marginBottom: '16px', fontFamily: S.sans }}>
          Across the eight states of the Northeast, families have spent generations perfecting crafts that exist
          nowhere else on earth — Assam's Muga silk with its natural golden sheen, the handlooms of Manipur, the
          bamboo work of Tripura, the pottery and weaves of Nagaland and Meghalaya. These aren't mass-produced goods.
          Each one carries the time, skill, and story of a real person.
        </p>
        <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, marginBottom: '16px', fontFamily: S.sans }}>
          And yet, two things have always stood in the way. <b>First, these artisans can't reach the people who would
          treasure their work.</b> A weaver in a remote village has no way to sell to a buyer in Mumbai, Delhi, or
          abroad — so the work passes through middlemen who take most of the value, or it simply never finds a market.
          <b> Second, the crafts themselves are quietly dying out.</b> When a craft can't earn a living, the next
          generation walks away from it. Skills perfected over centuries vanish in a single one.
        </p>
        <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, fontFamily: S.sans }}>
          Bihaan exists to change both. We give artisans a direct line to buyers anywhere in the world, we make sure
          the maker keeps the fair share of every sale, and we put the person behind the product front and centre —
          because when a craft is valued, it survives.
        </p>
      </div>

      {/* The promise stats */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ background: S.dark, borderRadius: '4px', padding: '40px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', textAlign: 'center' }}>
          {[
            ['90%', 'goes to the artisan', 'They keep the fair share of every sale.'],
            ['8', 'states, one platform', 'Crafts from across the Northeast, in one place.'],
            ['100%', 'real, handmade', 'Every product made by a verified artisan.'],
          ].map(([num, label, sub]) => (
            <div key={label}>
              <p style={{ fontFamily: S.serif, fontSize: '2.2rem', color: S.gold, fontWeight: 400, marginBottom: '6px' }}>{num}</p>
              <p style={{ fontSize: '13px', color: '#fff', fontFamily: S.sans, marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '11px', color: '#9a8f82', fontFamily: S.sans, lineHeight: 1.5 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 0' }}>
        <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '14px', fontFamily: S.sans }}>HOW BIHAAN WORKS</p>
        <h2 style={{ fontFamily: S.serif, fontSize: '1.9rem', fontWeight: 400, color: S.dark, marginBottom: '28px' }}>
          Simple for you. Life-changing for them.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '28px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '.12em', color: S.accent, marginBottom: '12px', fontFamily: S.sans }}>IF YOU'RE BUYING</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['Discover', 'Browse authentic, handmade pieces from across all 8 Northeast states.'],
                ['Order with confidence', 'Pay securely. Track your order from confirmed to delivered.'],
                ['Carry a story', 'Every piece arrives with the legacy of the artisan who made it.'],
              ].map(([t, d], i) => (
                <div key={t} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: S.bg, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: S.accent, fontFamily: S.sans, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: S.dark, fontFamily: S.sans, marginBottom: '2px' }}>{t}</p>
                    <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '28px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '.12em', color: S.accent, marginBottom: '12px', fontFamily: S.sans }}>IF YOU'RE AN ARTISAN</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                ['List in minutes', 'Our AI helps you write a beautiful listing — just add a few details and photos.'],
                ['Reach the world', 'Sell directly to buyers across India and beyond. No middlemen.'],
                ['Keep your fair share', 'You keep 90% of every sale, paid straight to your bank.'],
              ].map(([t, d], i) => (
                <div key={t} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: S.bg, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: S.accent, fontFamily: S.sans, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: S.dark, fontFamily: S.sans, marginBottom: '2px' }}>{t}</p>
                    <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Founder's note */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 24px 0' }}>
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.accent}`, borderRadius: '4px', padding: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '18px', fontFamily: S.sans }}>A NOTE FROM THE FOUNDER</p>

          <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, marginBottom: '16px', fontFamily: S.sans, fontStyle: 'italic' }}>
            I'm from the Northeast myself. I grew up surrounded by this craft — <PH>[[add a real, specific memory:
            e.g. watching your grandmother at the loom, the smell of bamboo being worked, a market you grew up near]]</PH>.
            It was ordinary to me then. It took growing up to realise how extraordinary, and how fragile, it really is.
          </p>
          <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, marginBottom: '16px', fontFamily: S.sans, fontStyle: 'italic' }}>
            I watched immensely talented people — people whose skill would be celebrated anywhere in the world — struggle
            to sell their work for what it was worth, simply because they had no way to reach the people who would love it.
            And I watched younger people leave the craft behind, not because they didn't care, but because it couldn't
            pay. I didn't want to stand by and watch these traditions quietly disappear.
          </p>
          <p style={{ fontSize: '15px', color: '#4a4036', lineHeight: 1.9, marginBottom: '24px', fontFamily: S.sans, fontStyle: 'italic' }}>
            Bihaan is my attempt to build the bridge I wish had always existed — between the hands of my home and the
            people, anywhere, who would treasure what they make. <PH>[[Add a closing line in your own words — your hope
            for Bihaan, or what you'd say to a first-time visitor.]]</PH>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: S.bg, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌄</div>
            <div>
              <p style={{ fontSize: '14px', color: S.dark, fontFamily: S.serif }}><PH>[[Your name]]</PH></p>
              <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans }}>Founder, Bihaan · <PH>[[Your home — town/state]]</PH></p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 24px 72px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: S.serif, fontSize: '1.7rem', fontWeight: 400, color: S.dark, marginBottom: '10px' }}>
          Every purchase carries a story forward.
        </h2>
        <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.8, marginBottom: '28px', fontFamily: S.sans }}>
          Explore the collection, or share your own craft with the world.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/products')}
            style={{ background: S.dark, color: '#fff', padding: '13px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
            EXPLORE THE COLLECTION
          </button>
          <button onClick={() => navigate('/seller/register')}
            style={{ background: 'transparent', color: S.dark, padding: '13px 28px', fontSize: '11px', letterSpacing: '.12em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
            BECOME A SELLER
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}