import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', muted: '#7a6e62', border: '#e2d8ce',
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

export default function Login() {
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').insert({
            id:        data.user.id,
            full_name: name,
            email:     email,
            role:      'buyer',
          })
        }
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: S.sans }}>

      {/* Top bar */}
      <div style={{ background: S.dark, color: '#c9922a', textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        AUTHENTIC NORTHEAST INDIA · 50+ VERIFIED ARTISANS
      </div>

      {/* Nav */}
      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <button onClick={() => navigate(-1)}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK
        </button>
      </nav>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '8px' }}>
              {mode === 'login' ? 'Welcome back' : 'Join Bihaan'}
            </h1>
            <p style={{ fontSize: '14px', color: S.muted }}>
              {mode === 'login'
                ? 'Sign in to continue shopping'
                : 'Create an account to start shopping'}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: S.white, border: `1px solid ${S.border}`, borderRadius: '3px', marginBottom: '28px', overflow: 'hidden' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '10px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: mode === m ? S.dark : S.white, color: mode === m ? '#fff' : S.muted, transition: 'all .2s' }}>
                {m === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>
                  FULL NAME
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your full name"
                  style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
              </div>
            )}

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '.15em', color: S.muted, display: 'block', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', border: `1px solid ${S.border}`, background: S.white, fontSize: '14px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '3px' }}>
                <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: S.sans }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#888' : S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: S.sans, marginTop: '4px', transition: 'background .2s' }}>
              {loading ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>

          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: S.border }} />
            <span style={{ fontSize: '11px', color: S.muted }}>or</span>
            <div style={{ flex: 1, height: '1px', background: S.border }} />
          </div>

          {/* Seller CTA */}
          <div style={{ textAlign: 'center', padding: '20px', border: `1px solid ${S.border}`, borderRadius: '3px', background: S.white }}>
            <p style={{ fontSize: '13px', color: S.muted, marginBottom: '10px', fontFamily: S.sans }}>
              Want to sell on Bihaan?
            </p>
            <button onClick={() => navigate('/seller/register')}
              style={{ fontSize: '11px', letterSpacing: '.1em', color: S.accent, background: 'transparent', border: `1px solid ${S.accent}`, padding: '8px 20px', cursor: 'pointer', fontFamily: S.sans }}>
              BECOME A SELLER
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: S.white, borderTop: `1px solid ${S.border}`, padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#b0a498', letterSpacing: '.05em', fontFamily: S.sans }}>
          © 2026 BIHAAN · NORTHEAST INDIA
        </p>
      </footer>

    </div>
  )
}