// src/components/SellerPayoutPolicy.jsx
//
// A clear, seller-facing "how and when you get paid" block. Drop it onto the
// seller registration page (so sellers read it before signing up) and/or reuse
// the wording in your legal Terms.
//
//   import SellerPayoutPolicy from '../../components/SellerPayoutPolicy'
//   ...
//   <SellerPayoutPolicy />
//
// ⚠️ Text in [[brackets]] is highlighted amber — these are YOUR decisions to set
//    (payout timing, transfer schedule). The 90/10 split and COD handling reflect
//    how Bihaan already works. Set the brackets before you show this to real sellers.

const S = {
    bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
    accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
    border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
    sans: "'Inter', system-ui, sans-serif",
  }
  
  function PH({ children }) {
    return <span style={{ background: '#fdeccb', color: '#92400e', padding: '0 4px', borderRadius: '2px' }}>{children}</span>
  }
  
  const rows = [
    {
      icon: '💰',
      title: 'You keep 90% of every sale',
      body: <>For each item sold, you receive <b>90%</b> of the price. Bihaan keeps a <b>10%</b> platform commission, which covers payment processing, hosting, and running the marketplace. The exact split for every order is shown in your seller dashboard.</>,
    },
    {
      icon: '📅',
      title: 'When you get paid',
      body: <>Your earnings are released after an order is <b>delivered</b> and its <PH>[[7]]</PH>-day return window has closed (so a payout never has to be clawed back for a return). After that, payouts are sent <PH>[[every 7 days / on the 1st &amp; 15th — set your schedule]]</PH>.</>,
    },
    {
      icon: '🏦',
      title: 'How you get paid',
      body: <>Payouts are transferred directly to the <b>bank account</b> you provide during verification, by bank transfer/UPI. Make sure your account and IFSC details are correct — payouts use exactly what you entered.</>,
    },
    {
      icon: '📦',
      title: 'Cash on Delivery orders',
      body: <>For COD orders, your earnings are released <b>only after the cash has been collected</b> from the buyer and reconciled. Until then the amount shows as pending — this protects both of us from paying out on cash that hasn't arrived.</>,
    },
    {
      icon: '↩️',
      title: 'Cancellations &amp; returns',
      body: <>If an order is cancelled before dispatch or returned within the return window, no payout is due for that item (and any provisional amount is reversed). You're paid for completed, delivered sales.</>,
    },
    {
      icon: '👁️',
      title: 'Full transparency',
      body: <>Your dashboard always shows what you've earned, what's <b>pending</b>, and what's been <b>paid</b> — order by order. You never have to guess what you're owed.</>,
    },
  ]
  
  export default function SellerPayoutPolicy() {
    return (
      <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', padding: '28px 30px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '6px', fontFamily: S.sans }}>SELLER PAYOUTS</p>
        <h3 style={{ fontFamily: S.serif, fontSize: '1.5rem', fontWeight: 400, color: S.dark, marginBottom: '8px' }}>
          How &amp; when you get paid
        </h3>
        <p style={{ fontSize: '13px', color: S.muted, lineHeight: 1.7, marginBottom: '22px', fontFamily: S.sans }}>
          We want this to be clear before you start selling. Here's exactly how your money reaches you.
        </p>
  
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: S.bg, border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                {r.icon}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: S.dark, fontFamily: S.sans, marginBottom: '3px' }}>{r.title}</p>
                <p style={{ fontSize: '13px', color: '#4a4036', lineHeight: 1.7, fontFamily: S.sans }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
  
        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: `1px solid ${S.border}` }}>
          <p style={{ fontSize: '12px', color: S.muted, lineHeight: 1.6, fontFamily: S.sans }}>
            Bihaan is operated by <PH>[[REGISTERED BUSINESS NAME]]</PH>. These payout terms form part of our
            seller agreement. Questions about a payout? Email <PH>[[seller-support@bihaan.in]]</PH>.
          </p>
        </div>
      </div>
    )
  }