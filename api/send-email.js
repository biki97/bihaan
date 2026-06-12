export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()
  
    const { type, order, buyerEmail, buyerName, items } = req.body
  
    try {
      if (type === 'order_confirmation') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            //from: 'Bihaan <orders@bihaan.in>'
            from: 'Bihaan <onboarding@resend.dev>',
            to: buyerEmail,
            subject: `Order confirmed — ₹${order.total.toLocaleString()}`,
            html: `
              <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#f8f4ef">
                <div style="text-align:center;margin-bottom:32px">
                  <h1 style="font-size:28px;font-weight:400;color:#1a1208;margin:0">Bihaan</h1>
                  <p style="font-size:11px;letter-spacing:.15em;color:#8b2500;margin:4px 0 0">AUTHENTIC NORTHEAST INDIA</p>
                </div>
                <div style="background:#fff;border:1px solid #e2d8ce;padding:32px;margin-bottom:20px">
                  <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">Order confirmed! 🎉</h2>
                  <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">Hi ${buyerName}, thank you for supporting Northeast Indian artisans.</p>
                  <div style="border-top:1px solid #e2d8ce;padding-top:20px">
                    ${items.map(item => `
                      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                        <div>
                          <p style="font-size:14px;color:#1a1208;margin:0">${item.name}</p>
                          <p style="font-size:12px;color:#7a6e62;margin:4px 0 0">Qty: ${item.qty}</p>
                        </div>
                        <p style="font-size:14px;font-weight:500;color:#1a1208;margin:0">₹${(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    `).join('')}
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
                <p style="font-size:11px;color:#b0a498;text-align:center;margin-top:20px">© 2026 Bihaan · Northeast India</p>
              </div>
            `
          })
        })
      }
  
      if (type === 'new_order_seller') {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            //from: 'Bihaan <orders@bihaan.in>'
            from: 'Bihaan <onboarding@resend.dev>',
            to: 'bikidutta319@gmail.com',
            subject: `New order received — ₹${order.total.toLocaleString()}`,
            html: `
              <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#f8f4ef">
                <div style="text-align:center;margin-bottom:32px">
                  <h1 style="font-size:28px;font-weight:400;color:#1a1208;margin:0">Bihaan</h1>
                  <p style="font-size:11px;letter-spacing:.15em;color:#8b2500;margin:4px 0 0">SELLER NOTIFICATION</p>
                </div>
                <div style="background:#fff;border:1px solid #e2d8ce;padding:32px">
                  <h2 style="font-size:20px;font-weight:400;color:#1a1208;margin:0 0 8px">New order received! 🛍️</h2>
                  <p style="font-size:14px;color:#7a6e62;margin:0 0 24px">A buyer just placed an order on Bihaan.</p>
                  <div style="border-top:1px solid #e2d8ce;padding-top:20px">
                    ${items.map(item => `
                      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
                        <div>
                          <p style="font-size:14px;color:#1a1208;margin:0">${item.name}</p>
                          <p style="font-size:12px;color:#7a6e62;margin:4px 0 0">Qty: ${item.qty}</p>
                        </div>
                        <p style="font-size:14px;font-weight:500;color:#1a1208;margin:0">₹${(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    `).join('')}
                  </div>
                  <div style="border-top:1px solid #e2d8ce;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between">
                    <p style="font-size:16px;color:#1a1208;margin:0">Your earnings (90%)</p>
                    <p style="font-size:16px;font-weight:500;color:#15803d;margin:0">₹${Math.round(order.total * 0.9).toLocaleString()}</p>
                  </div>
                </div>
                <p style="font-size:11px;color:#b0a498;text-align:center;margin-top:20px">© 2026 Bihaan · Northeast India</p>
              </div>
            `
          })
        })
      }
  
      res.status(200).json({ success: true })
  
    } catch (err) {
      console.error('Email error:', err)
      res.status(500).json({ error: err.message })
    }
  }