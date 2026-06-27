export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, order, buyerEmail, buyerName, items, shipment } = req.body

  // ── Single place to set the sender. ──
  // ⚠️ Until bihaan.in is verified in Resend, emails only deliver to your own
  //    Resend account address. Once the domain is verified, switch FROM to
  //    'Bihaan <orders@bihaan.in>' and notifications reach real buyers.
  const FROM = 'Bihaan <onboarding@resend.dev>'
  // const FROM = 'Bihaan <orders@bihaan.in>'   // ← switch to this after domain verification

  // Small helper so we don't repeat the fetch boilerplate
  async function sendEmail({ to, subject, html }) {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({ from: FROM, to, subject, html })
    })
  }

  // Shared shell so every email looks consistent
  function wrap(innerHtml, tagline = 'AUTHENTIC NORTHEAST INDIA') {
    return `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#f8f4ef">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:28px;font-weight:400;color:#1a1208;margin:0">Bihaan</h1>
          <p style="font-size:11px;letter-spacing:.15em;color:#8b2500;margin:4px 0 0">${tagline}</p>
        </div>
        ${innerHtml}
        <p style="font-size:11px;color:#b0a498;text-align:center;margin-top:20px">© 2026 Bihaan · Northeast India</p>
      </div>
    `
  }

  function itemRows(list) {
    return (list || []).map(item => `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div>
          <p style="font-size:14px;color:#1a1208;margin:0">${item.name}</p>
          <p style="font-size:12px;color:#7a6e62;margin:4px 0 0">Qty: ${item.qty}</p>
        </div>
        <p style="font-size:14px;font-weight:500;color:#1a1208;margin:0">₹${(item.price * item.qty).toLocaleString()}</p>
      </div>
    `).join('')
  }

  try {
    if (type === 'order_confirmation') {
      await sendEmail({
        to: buyerEmail,
        subject: `Order confirmed — ₹${order.total.toLocaleString()}`,
        html: wrap(`
          <div style="background:#fff;border:1px solid #e2d8ce;padding:32px;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">Order confirmed! 🎉</h2>
            <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">Hi ${buyerName}, thank you for supporting Northeast Indian artisans.</p>
            <div style="border-top:1px solid #e2d8ce;padding-top:20px">
              ${itemRows(items)}
            </div>
            <div style="border-top:1px solid #e2d8ce;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between">
              <p style="font-size:16px;font-weight:400;color:#1a1208;margin:0">Total</p>
              <p style="font-size:16px;font-weight:500;color:#1a1208;margin:0">₹${order.total.toLocaleString()}</p>
            </div>
          </div>
          <div style="background:#1a1208;padding:24px;text-align:center">
            <p style="font-size:12px;color:#c9922a;letter-spacing:.1em;margin:0 0 8px">THE BIHAAN PROMISE</p>
            <p style="font-size:13px;color:#888;margin:0">Every purchase empowers a Northeast Indian artisan.</p>
          </div>
        `)
      })
    }

    if (type === 'new_order_seller') {
      await sendEmail({
        to: 'bikidutta319@gmail.com',
        subject: `New order received — ₹${order.total.toLocaleString()}`,
        html: wrap(`
          <div style="background:#fff;border:1px solid #e2d8ce;padding:32px">
            <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">New order received! 🛍️</h2>
            <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">A buyer just placed an order on Bihaan.</p>
            <div style="border-top:1px solid #e2d8ce;padding-top:20px">
              ${itemRows(items)}
            </div>
            <div style="border-top:1px solid #e2d8ce;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between">
              <p style="font-size:16px;color:#1a1208;margin:0">Your earnings (90%)</p>
              <p style="font-size:16px;font-weight:500;color:#15803d;margin:0">₹${Math.round(order.total * 0.9).toLocaleString()}</p>
            </div>
          </div>
        `, 'SELLER NOTIFICATION')
      })
    }

    // ── NEW: order shipped ──
    // Expects: buyerEmail, buyerName, shipment { shopName, items[], courier, tracking, trackingUrl }
    if (type === 'order_shipped') {
      const s = shipment || {}
      await sendEmail({
        to: buyerEmail,
        subject: `Your Bihaan order has shipped 📦`,
        html: wrap(`
          <div style="background:#fff;border:1px solid #e2d8ce;padding:32px;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">Your order is on its way! 📦</h2>
            <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">
              Hi ${buyerName || 'there'}, your items${s.shopName ? ` from <b>${s.shopName}</b>` : ''} have been shipped.
            </p>
            <div style="border-top:1px solid #e2d8ce;padding-top:20px">
              ${itemRows(s.items)}
            </div>
            ${(s.courier || s.tracking) ? `
              <div style="border-top:1px solid #e2d8ce;padding-top:16px;margin-top:8px">
                <p style="font-size:13px;color:#7a6e62;margin:0 0 4px">Courier &amp; tracking</p>
                <p style="font-size:14px;color:#1a1208;margin:0">${[s.courier, s.tracking].filter(Boolean).join(' · ')}</p>
                ${s.trackingUrl ? `<p style="margin:12px 0 0"><a href="${s.trackingUrl}" style="display:inline-block;background:#8b2500;color:#fff;text-decoration:none;font-size:12px;letter-spacing:.08em;padding:10px 18px">TRACK SHIPMENT →</a></p>` : ''}
              </div>
            ` : ''}
          </div>
        `)
      })
    }

    // ── NEW: order delivered ──
    if (type === 'order_delivered') {
      const s = shipment || {}
      await sendEmail({
        to: buyerEmail,
        subject: `Your Bihaan order was delivered ✓`,
        html: wrap(`
          <div style="background:#fff;border:1px solid #e2d8ce;padding:32px;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">Delivered! ✓</h2>
            <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">
              Hi ${buyerName || 'there'}, your items${s.shopName ? ` from <b>${s.shopName}</b>` : ''} have been delivered. We hope you love them.
            </p>
            <div style="border-top:1px solid #e2d8ce;padding-top:20px">
              ${itemRows(s.items)}
            </div>
            <div style="border-top:1px solid #e2d8ce;padding-top:16px;margin-top:8px">
              <p style="font-size:13px;color:#7a6e62;margin:0">Loved your order? Leaving a review helps the artisan and other buyers.</p>
            </div>
          </div>
        `)
      })
    }

    // ── NEW: order cancelled ──
    if (type === 'order_cancelled') {
      const s = shipment || {}
      await sendEmail({
        to: buyerEmail,
        subject: `Your Bihaan order was cancelled`,
        html: wrap(`
          <div style="background:#fff;border:1px solid #e2d8ce;padding:32px;margin-bottom:20px">
            <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">Order cancelled</h2>
            <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">
              Hi ${buyerName || 'there'}, your items${s.shopName ? ` from <b>${s.shopName}</b>` : ''} have been cancelled.
              ${'' /* refund wording kept honest — manual until payments are live */}
              If you paid online, any refund is processed by the Bihaan team.
            </p>
            <div style="border-top:1px solid #e2d8ce;padding-top:20px">
              ${itemRows(s.items)}
            </div>
          </div>
        `)
      })
    }

    res.status(200).json({ success: true })

  } catch (err) {
    console.error('Email error:', err)
    res.status(500).json({ error: err.message })
  }
}