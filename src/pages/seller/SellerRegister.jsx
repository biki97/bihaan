import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'
import SellerPayoutPolicy from '../../components/SellerPayoutPolicy'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
  'Brass & Metal', 'Tea & Spices', 'Heritage Crafts',
  'Pottery', 'Jewellery', 'Other'
]

const states = [
  'Assam', 'Manipur', 'Meghalaya', 'Nagaland',
  'Arunachal Pradesh', 'Mizoram', 'Tripura', 'Sikkim'
]

export default function SellerRegister() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Step 0 state
  const [authTab,  setAuthTab]  = useState('email')
  const [phone,    setPhone]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [otpSent,  setOtpSent]  = useState(false)

  const [form, setForm] = useState({
    full_name:    '',
    email:        '',
    password:     '',
    shop_name:    '',
    description:  '',
    category:     '',
    state:        '',
    district:     '',
    phone:        '',
    // KYC (stored in the locked-down seller_kyc table, never in public sellers)
    legal_name:   '',
    pan_number:   '',
    gst_number:   '',
    bank_account: '',
    ifsc_code:    '',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ── EMAIL SIGNUP ──
  async function handleEmailSignup() {
    if (!form.full_name || !form.email || !form.password) { setError('Please fill in all fields'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } }
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, email: form.email, full_name: form.full_name, role: 'seller'
        })
        setStep(1)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── SEND OTP ──
  async function handleSendOtp() {
    if (!phone || phone.length < 10) { setError('Please enter a valid 10-digit number'); return }
    setError('')
    setLoading(true)
    try {
      const fullPhone = `+91${phone.replace(/\s/g, '')}`
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
      if (error) throw error
      setOtpSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── VERIFY OTP ──
  async function handleVerifyOtp() {
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit OTP'); return }
    setError('')
    setLoading(true)
    try {
      const fullPhone = `+91${phone.replace(/\s/g, '')}`
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone, token: otp, type: 'sms'
      })
      if (error) throw error
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, phone: fullPhone, role: 'seller'
        })
        setStep(1)
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── FINAL SUBMIT ──
  async function handleSubmit() {
    if (!user) { navigate('/login'); return }

    // Validate KYC
    if (!form.legal_name || !form.pan_number || !form.bank_account || !form.ifsc_code) {
      setError('Please fill in legal name, PAN, bank account and IFSC.')
      return
    }
    const pan = form.pan_number.toUpperCase().trim()
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      setError('Please enter a valid PAN number (e.g. ABCDE1234F).')
      return
    }
    const gst = form.gst_number.toUpperCase().trim()

    setLoading(true)
    setError('')
    try {
      await supabase.from('profiles').upsert({ id: user.id, email: user.email, role: 'seller' })

      // Public, non-sensitive shop info → sellers
      const { error: sErr } = await supabase.from('sellers').insert({
        user_id:     user.id,
        shop_name:   form.shop_name,
        description: form.description,
        state:       form.state,
        district:    form.district,
        is_approved: false,
      })
      if (sErr) throw sErr

      // Sensitive KYC → locked-down seller_kyc (only seller + admin can read)
      const { error: kErr } = await supabase.from('seller_kyc').upsert({
        user_id:      user.id,
        legal_name:   form.legal_name,
        pan_number:   pan,
        gst_number:   gst || null,
        bank_account: form.bank_account,
        ifsc_code:    form.ifsc_code.toUpperCase().trim(),
      })
      if (kErr) throw kErr

      navigate('/seller/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }
  const labelStyle = { fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px', fontFamily: S.sans }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        JOIN BIHAAN · SELL YOUR HANDMADE PRODUCTS GLOBALLY
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <button onClick={() => navigate(-1)}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK
        </button>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '12px', fontFamily: S.sans }}>BECOME A SELLER</p>
          <h1 style={{ fontFamily: S.serif, fontSize: '2.2rem', fontWeight: 400, color: S.dark, marginBottom: '12px' }}>
            Share your craft with the world
          </h1>
          <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.8, fontFamily: S.sans }}>
            Join 50+ artisans from Northeast India already selling on Bihaan. Free to join — we only take 10% when you make a sale.
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          {[0, 1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s ? S.accent : S.border,
                color: step >= s ? '#fff' : S.muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontFamily: S.sans, fontWeight: 500
              }}>{s + 1}</div>
              {s < 3 && <div style={{ width: '36px', height: '1px', background: step > s ? S.accent : S.border }} />}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '36px' }}>
          {['Account', 'Shop details', 'Location', 'Verification'].map((label, i) => (
            <p key={label} style={{ fontSize: '10px', letterSpacing: '.08em', color: step === i ? S.accent : S.muted, fontFamily: S.sans }}>
              {label.toUpperCase()}
            </p>
          ))}
        </div>

        {/* Form card */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '36px' }}>

          {/* ── STEP 0 — Account ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '4px' }}>
                Create your seller account
              </h2>
              <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '-8px' }}>
                You'll use these credentials to log back in anytime.
              </p>

              {/* Auth method tabs */}
              <div style={{ display: 'flex', border: `1px solid ${S.border}`, borderRadius: '3px', overflow: 'hidden' }}>
                {[['email', '📧 Email'], ['phone', '📱 Phone']].map(([t, label]) => (
                  <button key={t} onClick={() => { setAuthTab(t); setError(''); setOtpSent(false) }}
                    style={{ flex: 1, padding: '9px', fontSize: '12px', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: authTab === t ? S.dark : S.white, color: authTab === t ? '#fff' : S.muted, transition: 'all .2s' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Email option */}
              {authTab === 'email' && (
                <>
                  <div>
                    <label style={labelStyle}>FULL NAME *</label>
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Your full name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>EMAIL ADDRESS *</label>
                    <input name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>PASSWORD *</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" style={inputStyle} />
                  </div>
                  {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}
                  <button onClick={handleEmailSignup} disabled={loading}
                    style={{ background: loading ? '#888' : S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                    {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & CONTINUE →'}
                  </button>
                </>
              )}

              {/* Phone option */}
              {authTab === 'phone' && (
                <>
                  {!otpSent ? (
                    <>
                      <div>
                        <label style={labelStyle}>MOBILE NUMBER *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div style={{ padding: '11px 14px', border: `1px solid ${S.border}`, background: '#f0e8e4', fontSize: '14px', color: S.dark, fontFamily: S.sans, whiteSpace: 'nowrap' }}>
                            🇮🇳 +91
                          </div>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10 digit mobile number"
                            style={{ flex: 1, padding: '11px 14px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                        </div>
                        <p style={{ fontSize: '11px', color: S.muted, marginTop: '6px', fontFamily: S.sans }}>
                          We'll send a 6-digit OTP to verify your number
                        </p>
                      </div>
                      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}
                      <button onClick={handleSendOtp} disabled={loading}
                        style={{ background: loading ? '#888' : S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                        {loading ? 'SENDING OTP...' : 'SEND OTP →'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '12px 14px', borderRadius: '3px' }}>
                        <p style={{ fontSize: '13px', color: '#15803d', fontFamily: S.sans }}>✓ OTP sent to +91{phone}</p>
                      </div>
                      <div>
                        <label style={labelStyle}>ENTER 6-DIGIT OTP *</label>
                        <input
                          type="text"
                          value={otp}
                          onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="_ _ _ _ _ _"
                          maxLength={6}
                          style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '20px', color: S.dark, outline: 'none', fontFamily: S.sans, letterSpacing: '0.5em', textAlign: 'center' }} />
                      </div>
                      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}
                      <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                        style={{ background: loading ? '#888' : S.accent, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                        {loading ? 'VERIFYING...' : 'VERIFY & CONTINUE →'}
                      </button>
                      <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                        style={{ background: 'transparent', color: S.muted, padding: '8px', fontSize: '11px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                        ← Change number
                      </button>
                    </>
                  )}
                </>
              )}

              <p style={{ fontSize: '12px', color: S.muted, textAlign: 'center', fontFamily: S.sans }}>
                Already have an account?{' '}
                <span onClick={() => navigate('/login')} style={{ color: S.accent, cursor: 'pointer' }}>
                  Sign in here
                </span>
              </p>
            </div>
          )}

          {/* ── STEP 1 — Shop details ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '4px' }}>
                Tell us about your shop
              </h2>
              <div>
                <label style={labelStyle}>SHOP NAME *</label>
                <input name="shop_name" value={form.shop_name} onChange={handleChange} placeholder="e.g. Rekha's Muga Silk" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WHAT DO YOU MAKE? *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe your craft in a few sentences..." rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>PRODUCT CATEGORY *</label>
                <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
                  <option value="">Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>PHONE NUMBER *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
              </div>
              {error && <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p>}
              <button onClick={() => {
                if (!form.shop_name || !form.description || !form.category || !form.phone) { setError('Please fill in all fields'); return }
                setError(''); setStep(2)
              }}
                style={{ background: S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans, marginTop: '8px' }}>
                CONTINUE →
              </button>
            </div>
          )}

          {/* ── STEP 2 — Location ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '4px' }}>
                Where are you based?
              </h2>
              <div>
                <label style={labelStyle}>STATE *</label>
                <select name="state" value={form.state} onChange={handleChange} style={inputStyle}>
                  <option value="">Select your state</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>DISTRICT / VILLAGE *</label>
                <input name="district" value={form.district} onChange={handleChange} placeholder="e.g. Sualkuchi, Jorhat, Kohima" style={inputStyle} />
              </div>
              {error && <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(1)}
                  style={{ flex: 1, background: 'transparent', color: S.dark, padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
                  ← BACK
                </button>
                <button onClick={() => {
                  if (!form.state || !form.district) { setError('Please fill in all fields'); return }
                  setError(''); setStep(3)
                }}
                  style={{ flex: 2, background: S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                  CONTINUE →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Verification (KYC + payouts) ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark, marginBottom: '4px' }}>
                Verification & payout details
              </h2>
              <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans, marginTop: '-8px' }}>
                Required to verify you and to send your earnings. These details are private.
              </p>

              {/* Clear, upfront promise of how/when the seller gets paid */}
              <SellerPayoutPolicy />

              <div>
                <label style={labelStyle}>FULL LEGAL NAME (as on PAN) *</label>
                <input name="legal_name" value={form.legal_name} onChange={handleChange} placeholder="Name exactly as printed on your PAN card" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>PAN NUMBER *</label>
                <input name="pan_number" value={form.pan_number}
                  onChange={e => setForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase().slice(0, 10) }))}
                  placeholder="ABCDE1234F" maxLength={10}
                  style={{ ...inputStyle, letterSpacing: '.1em' }} />
              </div>

              <div>
                <label style={labelStyle}>GST NUMBER (optional)</label>
                <input name="gst_number" value={form.gst_number}
                  onChange={e => setForm(prev => ({ ...prev, gst_number: e.target.value.toUpperCase().slice(0, 15) }))}
                  placeholder="Only if you are GST-registered" maxLength={15}
                  style={{ ...inputStyle, letterSpacing: '.05em' }} />
                <p style={{ fontSize: '11px', color: S.muted, marginTop: '6px', fontFamily: S.sans }}>
                  Leave blank if you don't have a GST registration.
                </p>
              </div>

              <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: '18px' }}>
                <label style={labelStyle}>BANK ACCOUNT NUMBER *</label>
                <input name="bank_account" value={form.bank_account} onChange={handleChange} placeholder="Your bank account number" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>IFSC CODE *</label>
                <input name="ifsc_code" value={form.ifsc_code}
                  onChange={e => setForm(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase().slice(0, 11) }))}
                  placeholder="e.g. SBIN0001234" maxLength={11} style={inputStyle} />
              </div>

              <div style={{ padding: '12px 14px', background: '#fef5e7', border: '1px solid #f59e0b', borderRadius: '3px' }}>
                <p style={{ fontSize: '12px', color: '#92400e', fontFamily: S.sans, lineHeight: 1.6 }}>
                  🔒 Your PAN, GST and bank details are private — visible only to you and the Bihaan team, and used only for verification and sending your payouts.
                </p>
              </div>

              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setStep(2)}
                  style={{ flex: 1, background: 'transparent', color: S.dark, padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: `1px solid ${S.border}`, cursor: 'pointer', fontFamily: S.sans }}>
                  ← BACK
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{ flex: 2, background: loading ? '#888' : S.accent, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                  {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginTop: '32px' }}>
          {[
            ['🆓', 'Free to join',  'No upfront cost. We only earn when you earn.'],
            ['🤖', 'AI listings',   'We write beautiful product descriptions for you.'],
            ['🌍', 'Global reach',  'Sell to Indian diaspora and buyers worldwide.'],
          ].map(([emoji, title, desc]) => (
            <div key={title} style={{ textAlign: 'center', padding: '20px', background: S.white, border: `1px solid ${S.border}` }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>{emoji}</p>
              <p style={{ fontSize: '12px', fontWeight: 500, color: S.dark, marginBottom: '4px', fontFamily: S.sans }}>{title}</p>
              <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}