import { useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'
import Footer from '../../components/Footer'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', muted: '#7a6e62', border: '#e2d8ce',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function Login() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()

  // tabs: 'email' or 'phone'
  const [tab,      setTab]      = useState('email')
  const [mode,     setMode]     = useState('login')

  // email+pass
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')

  // phone+otp
  const [phone,    setPhone]    = useState('')
  const [otp,      setOtp]      = useState('')
  const [otpSent,  setOtpSent]  = useState(false)

  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  // ── EMAIL SUBMIT ──
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (data.user) {
          const { data: seller } = await supabase
            .from('sellers').select('id').eq('user_id', data.user.id).single()
          navigate(seller ? '/seller/dashboard' : '/')
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        })
        if (error) throw error
        if (data.user) {
          try {
            await supabase.from('profiles').insert({
              id: data.user.id, full_name: name, email, role: 'buyer'
            })
          } catch (_) {}
          navigate('/')
        } else {
          setSuccess('Account created! Please check your email to confirm.')
          setMode('login')
        }
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      if (msg.includes('rate limit'))        setError('Too many attempts. Please wait a few minutes.')
      else if (msg.includes('Invalid login')) setError('Wrong email or password.')
      else if (msg.includes('already registered')) { setError('Email already registered. Sign in instead.'); setMode('login') }
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── SEND OTP ──
  async function handleSendOtp() {
    if (!phone || phone.length < 10) { setError('Please enter a valid phone number'); return }
    setLoading(true)
    setError('')
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
      if (error) throw error
      setOtpSent(true)
      setSuccess(`OTP sent to ${fullPhone}`)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── VERIFY OTP ──
  async function handleVerifyOtp() {
    if (!otp || otp.length < 6) { setError('Please enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const fullPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\s/g, '')}`
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type:  'sms'
      })
      if (error) throw error
      if (data.user) {
        // create profile if first time
        await supabase.from('profiles').upsert({
          id:    data.user.id,
          phone: fullPhone,
          role:  'buyer',
        })
        const { data: seller } = await supabase
          .from('sellers').select('id').eq('user_id', data.user.id).single()
        navigate(seller ? '/seller/dashboard' : '/')
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: S.sans, overflowX: 'hidden' }}>

      <div style={{ background: '#1a1208', color: '#c9922a', textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        AUTHENTIC NORTHEAST INDIA · 50+ VERIFIED ARTISANS
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <button onClick={() => navigate(-1)}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK
        </button>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '8px' }}>
              {mode === 'login' ? 'Welcome back' : 'Join Bihaan'}
            </h1>
            <p style={{ fontSize: '14px', color: S.muted }}>
              {mode === 'login' ? 'Sign in to continue' : 'Create an account to start shopping'}
            </p>
          </div>

          {/* Login method tabs */}
          <div style={{ display: 'flex', background: S.white, border: `1px solid ${S.border}`, borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
            {[['email', '📧 Email'], ['phone', '📱 Phone']].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); setOtpSent(false) }}
                style={{ flex: 1, padding: '10px', fontSize: '12px', letterSpacing: '.05em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: tab === t ? S.dark : S.white, color: tab === t ? '#fff' : S.muted, transition: 'all .2s' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <>
              {/* Sign in / Create account toggle */}
              <div style={{ display: 'flex', background: S.white, border: `1px solid ${S.border}`, borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
                {['login', 'signup'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                    style={{ flex: 1, padding: '9px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: mode === m ? '#f0e8e4' : S.white, color: mode === m ? S.accent : S.muted, transition: 'all .2s' }}>
                    {m === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mode === 'signup' && (
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>FULL NAME</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Your full name"
                      style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>PASSWORD</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                </div>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}
                {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#15803d', fontFamily: S.sans }}>{success}</p></div>}

                <button type="submit" disabled={loading}
                  style={{ background: loading ? '#888' : S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans, marginTop: '4px' }}>
                  {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </>
          )}

          {/* ── PHONE TAB ── */}
          {tab === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {!otpSent ? (
                <>
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>
                      MOBILE NUMBER
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ padding: '11px 14px', border: `1px solid ${S.border}`, background: '#f0e8e4', fontSize: '14px', color: S.dark, fontFamily: S.sans, whiteSpace: 'nowrap' }}>
                        🇮🇳 +91
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 digit mobile number"
                        style={{ flex: 1, padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                    </div>
                    <p style={{ fontSize: '11px', color: S.muted, marginTop: '6px', fontFamily: S.sans }}>
                      We'll send a 6-digit OTP to this number
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
                    <p style={{ fontSize: '13px', color: '#15803d', fontFamily: S.sans }}>
                      ✓ OTP sent to +91{phone}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>
                      ENTER 6-DIGIT OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '20px', color: S.dark, outline: 'none', fontFamily: S.sans, letterSpacing: '0.5em', textAlign: 'center' }} />
                  </div>

                  {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}><p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p></div>}

                  <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                    style={{ background: loading ? '#888' : S.accent, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                    {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
                  </button>

                  <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                    style={{ background: 'transparent', color: S.muted, padding: '10px', fontSize: '11px', letterSpacing: '.08em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                    ← Change number
                  </button>
                </>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: S.border }} />
            <span style={{ fontSize: '11px', color: S.muted }}>or</span>
            <div style={{ flex: 1, height: '1px', background: S.border }} />
          </div>

          {/* Seller CTA */}
          <div style={{ textAlign: 'center', padding: '20px', border: `1px solid ${S.border}`, borderRadius: '3px', background: S.white }}>
            <p style={{ fontSize: '13px', color: S.muted, marginBottom: '6px', fontFamily: S.sans }}>
              Already a seller? Sign in above to access your dashboard.
            </p>
            <p style={{ fontSize: '13px', color: S.muted, marginBottom: '10px', fontFamily: S.sans }}>
              Not a seller yet?
            </p>
            <button onClick={() => navigate('/seller/register')}
              style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '8px 20px', cursor: 'pointer', fontFamily: S.sans }}>
              BECOME A SELLER
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}