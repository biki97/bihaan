// src/pages/Legal.jsx
//
// One page, five legal sections (Privacy, Terms, Refund, Shipping, Grievance).
// Add a route, e.g.:  <Route path="/legal" element={<Legal />} />
// You can deep-link a section with /legal?section=refund (privacy|terms|refund|shipping|grievance).
//
// ⚠️ EVERYTHING IN [[ DOUBLE BRACKETS ]] IS A PLACEHOLDER — replace before launch,
//    and have a lawyer/CA review (especially Refund + Grievance) for your jurisdiction.

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

// ─────────────────────────────────────────────────────────────
// EDIT THESE ONCE — they fill in across every section below.
// ─────────────────────────────────────────────────────────────
const BIZ = {
  brand:        'Bihaan',
  legalName:    '[[REGISTERED BUSINESS / PROPRIETOR NAME]]',
  address:      '[[REGISTERED BUSINESS ADDRESS, CITY, STATE, PINCODE]]',
  email:        '[[SUPPORT EMAIL e.g. support@bihaan.in]]',
  phone:        '[[SUPPORT PHONE]]',
  gstin:        '[[GSTIN — once registered]]',
  grievanceOfficer: '[[GRIEVANCE OFFICER NAME]]',
  grievanceEmail:   '[[GRIEVANCE EMAIL e.g. grievance@bihaan.in]]',
  lastUpdated:  '[[DD MONTH YYYY]]',
  returnWindow: '7',   // days
}

const sections = [
  { id: 'privacy',   label: 'Privacy Policy' },
  { id: 'terms',     label: 'Terms & Conditions' },
  { id: 'refund',    label: 'Refund & Cancellation' },
  { id: 'shipping',  label: 'Shipping Policy' },
  { id: 'grievance', label: 'Grievance Redressal' },
]

// Small style helpers for the long-form text
const h2 = { fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '6px' }
const h3 = { fontFamily: S.sans, fontSize: '14px', fontWeight: 600, color: S.dark, margin: '22px 0 8px' }
const p  = { fontFamily: S.sans, fontSize: '14px', color: '#4a4036', lineHeight: 1.8, marginBottom: '12px' }
const li = { ...p, marginBottom: '6px' }
const note = { fontFamily: S.sans, fontSize: '12px', color: S.muted, marginBottom: '20px' }

function PH({ children }) {
  // Visually flags placeholder text so you never ship a placeholder by accident
  return <span style={{ background: '#fdeccb', color: '#92400e', padding: '0 4px', borderRadius: '2px' }}>{children}</span>
}

export default function Legal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('section')
  const [active, setActive] = useState(sections.some(s => s.id === initial) ? initial : 'privacy')

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}><Logo size={36} showText={true} /></div>
        <button onClick={() => navigate('/')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK TO STORE
        </button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '8px', fontFamily: S.sans }}>LEGAL</p>
        <h1 style={{ fontFamily: S.serif, fontSize: '2.2rem', fontWeight: 400, color: S.dark, marginBottom: '24px' }}>
          {BIZ.brand} — Policies
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '36px', alignItems: 'start' }}>

          {/* Section nav */}
          <div style={{ position: 'sticky', top: '20px', background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', overflow: 'hidden' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '13px 18px', fontSize: '13px', cursor: 'pointer', border: 'none', borderLeft: active === s.id ? `3px solid ${S.accent}` : '3px solid transparent', background: active === s.id ? '#fef9f7' : 'transparent', color: active === s.id ? S.accent : S.dark, fontFamily: S.sans }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Section content */}
          <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '32px 36px' }}>

            {/* ── PRIVACY ── */}
            {active === 'privacy' && (
              <div>
                <h2 style={h2}>Privacy Policy</h2>
                <p style={note}>Last updated: <PH>{BIZ.lastUpdated}</PH></p>

                <p style={p}>
                  This Privacy Policy explains how <PH>{BIZ.legalName}</PH> (“{BIZ.brand}”, “we”, “us”) collects, uses,
                  and protects your information when you use {BIZ.brand} (the “Platform”), an online marketplace for
                  handmade products from Northeast India.
                </p>

                <h3 style={h3}>Information we collect</h3>
                <p style={li}>• <b>Account information:</b> name, email address, and/or mobile number when you register.</p>
                <p style={li}>• <b>Order &amp; delivery information:</b> shipping name, address, phone, and order history.</p>
                <p style={li}>• <b>Seller information:</b> for sellers, additional verification and payout details (legal name, PAN, GST if applicable, bank account) collected solely to verify sellers and process payouts.</p>
                <p style={li}>• <b>Payment information:</b> payments are processed by our payment partner (Razorpay). We do not store your card or UPI credentials on our servers.</p>
                <p style={li}>• <b>Usage data:</b> basic device/browser information and pages viewed, to operate and improve the Platform.</p>

                <h3 style={h3}>How we use your information</h3>
                <p style={p}>
                  To create and manage your account, process and deliver orders, verify sellers and pay them, provide
                  customer support, send transactional emails (order confirmations), prevent fraud, and comply with law.
                </p>

                <h3 style={h3}>Sharing your information</h3>
                <p style={p}>
                  We share information only as needed to operate the Platform: with sellers (delivery details for your
                  order), with our payment partner (Razorpay), with logistics/delivery partners, and with authorities
                  where required by law. We do not sell your personal data.
                </p>

                <h3 style={h3}>Data security</h3>
                <p style={p}>
                  We use access controls so that sensitive seller data (PAN, bank details) is accessible only to that
                  seller and authorised {BIZ.brand} staff. Payment data is handled by Razorpay under their security
                  standards. No method of transmission or storage is 100% secure, but we take reasonable measures to
                  protect your information.
                </p>

                <h3 style={h3}>Your rights</h3>
                <p style={p}>
                  You may access, correct, or request deletion of your personal information by contacting us at{' '}
                  <PH>{BIZ.email}</PH>. Certain records may be retained where required for legal, tax, or accounting purposes.
                </p>

                <h3 style={h3}>Cookies</h3>
                <p style={p}>
                  We use essential cookies/local storage to keep you signed in and remember your cart and preferences.
                </p>

                <h3 style={h3}>Contact</h3>
                <p style={p}>
                  Questions about this policy: <PH>{BIZ.email}</PH> · <PH>{BIZ.phone}</PH> · <PH>{BIZ.address}</PH>
                </p>
              </div>
            )}

            {/* ── TERMS ── */}
            {active === 'terms' && (
              <div>
                <h2 style={h2}>Terms &amp; Conditions</h2>
                <p style={note}>Last updated: <PH>{BIZ.lastUpdated}</PH></p>

                <p style={p}>
                  These Terms govern your use of {BIZ.brand}, operated by <PH>{BIZ.legalName}</PH>. By accessing or using
                  the Platform, you agree to these Terms. If you do not agree, please do not use the Platform.
                </p>

                <h3 style={h3}>About the marketplace</h3>
                <p style={p}>
                  {BIZ.brand} is a managed marketplace connecting artisans and sellers from Northeast India with buyers.
                  Products are listed by independent sellers. {BIZ.brand} facilitates the transaction, collects payment,
                  retains a platform commission, and remits the balance to the seller.
                </p>

                <h3 style={h3}>Accounts</h3>
                <p style={p}>
                  You are responsible for the accuracy of your account details and for keeping your login secure. You must
                  be capable of entering into a legally binding contract to make a purchase.
                </p>

                <h3 style={h3}>Sellers</h3>
                <p style={p}>
                  Sellers are responsible for the accuracy of their listings, the authenticity and quality of their
                  products, lawful sourcing, and timely dispatch. Sellers must provide accurate verification and payout
                  details and comply with applicable tax laws. {BIZ.brand} may suspend or remove listings or accounts that
                  violate these Terms.
                </p>

                <h3 style={h3}>Pricing &amp; payment</h3>
                <p style={p}>
                  Prices are shown in your selected currency for convenience; the order is processed in Indian Rupees (INR).
                  Payment is collected via our payment partner. {BIZ.brand} retains a commission of <PH>[[10]]</PH>% on each
                  sale; the remainder is paid to the seller.
                </p>

                <h3 style={h3}>Intellectual property</h3>
                <p style={p}>
                  The {BIZ.brand} name, logo, and Platform content are owned by us or our licensors and may not be used
                  without permission. Product images and descriptions remain the responsibility of the listing seller.
                </p>

                <h3 style={h3}>Limitation of liability</h3>
                <p style={p}>
                  To the extent permitted by law, {BIZ.brand} is not liable for indirect or consequential losses. Our total
                  liability for any order is limited to the amount paid for that order.
                </p>

                <h3 style={h3}>Governing law</h3>
                <p style={p}>
                  These Terms are governed by the laws of India, and disputes are subject to the courts of{' '}
                  <PH>[[YOUR CITY / JURISDICTION]]</PH>.
                </p>

                <h3 style={h3}>Contact</h3>
                <p style={p}><PH>{BIZ.email}</PH> · <PH>{BIZ.phone}</PH></p>
              </div>
            )}

            {/* ── REFUND ── */}
            {active === 'refund' && (
              <div>
                <h2 style={h2}>Refund &amp; Cancellation Policy</h2>
                <p style={note}>Last updated: <PH>{BIZ.lastUpdated}</PH></p>

                <p style={p}>
                  Because many {BIZ.brand} products are handmade, slight natural variations in colour, weave, and texture
                  are expected and are not defects. This policy explains when you can cancel, return, or get a refund.
                </p>

                <h3 style={h3}>Cancellations</h3>
                <p style={p}>
                  You may cancel an order before it has been dispatched by the seller. Once an item has shipped, it can no
                  longer be cancelled but may be eligible for return as below.
                </p>

                <h3 style={h3}>Returns</h3>
                <p style={li}>• Return requests must be raised within <PH>{BIZ.returnWindow}</PH> days of delivery.</p>
                <p style={li}>• Items must be unused, in original condition, with tags/packaging intact.</p>
                <p style={li}>• Eligible reasons: item damaged in transit, wrong item delivered, or item materially different from its description.</p>
                <p style={li}>• <b>Not eligible:</b> minor handmade variations, custom/made-to-order items, and items marked non-returnable on the product page.</p>

                <h3 style={h3}>How to request a return</h3>
                <p style={p}>
                  Email <PH>{BIZ.email}</PH> with your order number and photos of the item. We will review and respond
                  within <PH>[[2–3]]</PH> business days.
                </p>

                <h3 style={h3}>Refunds</h3>
                <p style={p}>
                  Approved refunds are issued to your original payment method within <PH>[[5–7]]</PH> business days of us
                  receiving and inspecting the returned item. For Cash-on-Delivery orders, refunds are made to your bank
                  account or UPI as confirmed with you. Shipping fees and any COD fee are non-refundable unless the return
                  is due to our or the seller’s error.
                </p>

                <h3 style={h3}>Contact</h3>
                <p style={p}><PH>{BIZ.email}</PH> · <PH>{BIZ.phone}</PH></p>
              </div>
            )}

            {/* ── SHIPPING ── */}
            {active === 'shipping' && (
              <div>
                <h2 style={h2}>Shipping Policy</h2>
                <p style={note}>Last updated: <PH>{BIZ.lastUpdated}</PH></p>

                <h3 style={h3}>Processing &amp; dispatch</h3>
                <p style={p}>
                  Orders are typically processed and dispatched by the seller within <PH>[[1–3]]</PH> business days. Made-to-order
                  or handmade items may take longer; any such timeline is noted on the product page.
                </p>

                <h3 style={h3}>Delivery time</h3>
                <p style={p}>
                  Estimated delivery within India is <PH>[[5–10]]</PH> business days after dispatch, depending on your location.
                  Remote areas may take longer. These are estimates, not guarantees.
                </p>

                <h3 style={h3}>Shipping charges</h3>
                <p style={p}>
                  Shipping is free on orders above <PH>₹999</PH>. Orders below that are charged a flat <PH>₹99</PH> shipping fee.
                  Cash-on-Delivery orders may carry an additional COD fee shown at checkout.
                </p>

                <h3 style={h3}>Tracking</h3>
                <p style={p}>
                  Where available, tracking details will be shared by email once your order is dispatched.
                </p>

                <h3 style={h3}>International shipping</h3>
                <p style={p}>
                  <PH>[[State whether you ship internationally. If yes, note that customs duties/taxes are the buyer’s
                  responsibility. If no, state “We currently ship within India only.”]]</PH>
                </p>

                <h3 style={h3}>Contact</h3>
                <p style={p}><PH>{BIZ.email}</PH> · <PH>{BIZ.phone}</PH></p>
              </div>
            )}

            {/* ── GRIEVANCE ── */}
            {active === 'grievance' && (
              <div>
                <h2 style={h2}>Grievance Redressal</h2>
                <p style={note}>Last updated: <PH>{BIZ.lastUpdated}</PH></p>

                <p style={p}>
                  In accordance with applicable Indian consumer and IT rules, the following officer may be contacted for any
                  complaints or grievances regarding the Platform, your orders, or content.
                </p>

                <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '18px 20px', marginBottom: '16px' }}>
                  <p style={{ ...p, marginBottom: '6px' }}><b>Grievance Officer:</b> <PH>{BIZ.grievanceOfficer}</PH></p>
                  <p style={{ ...p, marginBottom: '6px' }}><b>Company:</b> <PH>{BIZ.legalName}</PH></p>
                  <p style={{ ...p, marginBottom: '6px' }}><b>Email:</b> <PH>{BIZ.grievanceEmail}</PH></p>
                  <p style={{ ...p, marginBottom: '6px' }}><b>Phone:</b> <PH>{BIZ.phone}</PH></p>
                  <p style={{ ...p, marginBottom: 0 }}><b>Address:</b> <PH>{BIZ.address}</PH></p>
                </div>

                <h3 style={h3}>How we handle complaints</h3>
                <p style={p}>
                  We acknowledge grievances within <PH>[[48 hours]]</PH> and aim to resolve them within{' '}
                  <PH>[[15 days]]</PH> of receipt. Please include your order number and a description of the issue so we can
                  assist quickly.
                </p>
              </div>
            )}

            {/* Standing reminder for you (remove in production if you like) */}
            <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: `1px dashed ${S.border}` }}>
              <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, lineHeight: 1.6 }}>
                Highlighted text is a placeholder — replace all of it (in the <code>BIZ</code> object and inline
                <code> [[brackets]]</code> at the top of this file) before launch, and have these reviewed by a
                lawyer/CA for your jurisdiction.
              </p>
            </div>

          </div>
        </div>
      </div>

      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: '24px 40px', textAlign: 'center', marginTop: '40px' }}>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>© 2026 {BIZ.brand.toUpperCase()} · NORTHEAST INDIA</p>
      </footer>
    </div>
  )
}