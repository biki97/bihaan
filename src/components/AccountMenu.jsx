// src/components/AccountMenu.jsx
//
// Drop-in account dropdown for the nav. Replaces the old
// "{user ? (...email + sign out...) : (<SIGN IN>)}" cluster.
// Usage in any nav:  <AccountMenu />
// It reads the logged-in user itself, so no props are needed.

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', sans: "'Inter', system-ui, sans-serif",
}

const ADMIN_EMAIL = 'bikidutta319@gmail.com'

export default function AccountMenu() {
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  if (!user) {
    return (
      <button onClick={() => navigate('/login')}
        style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
        SIGN IN
      </button>
    )
  }

  const name = user.email?.split('@')[0] || user.phone || 'Account'
  const go = (path) => { setOpen(false); navigate(path) }

  const items = [
    { label: 'My Profile',      icon: '👤', path: '/account?tab=profile' },
    { label: 'My Orders',       icon: '📦', path: '/account?tab=orders' },
    { label: 'Saved Addresses', icon: '📍', path: '/account?tab=addresses' },
    { label: 'Wishlist',        icon: '🤍', path: '/wishlist' },
  ]
  if (role === 'seller')          items.push({ label: 'Seller Dashboard', icon: '🏪', path: '/seller/dashboard' })
  if (user.email === ADMIN_EMAIL) items.push({ label: 'Admin Panel',      icon: '⚙️', path: '/admin' })

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left',
    padding: '11px 16px', fontSize: '13px', border: 'none', background: 'transparent',
    cursor: 'pointer', color: S.dark, fontFamily: S.sans,
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
        <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: S.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', textTransform: 'uppercase' }}>
          {name[0]}
        </span>
        <span style={{ fontSize: '12px', color: S.muted }}>{name}</span>
        <span style={{ fontSize: '9px', color: S.muted }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: S.white, border: `1px solid ${S.border}`, borderRadius: '4px', minWidth: '210px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${S.border}` }}>
            <p style={{ fontSize: '10px', letterSpacing: '.15em', color: S.accent, fontFamily: S.sans }}>YOUR ACCOUNT</p>
            <p style={{ fontSize: '12px', color: S.muted, marginTop: '2px', fontFamily: S.sans, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>

          {items.map(it => (
            <button key={it.label} onClick={() => go(it.path)} style={itemStyle}
              onMouseOver={e => e.currentTarget.style.background = S.bg}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <span>{it.icon}</span> {it.label}
            </button>
          ))}

          <button onClick={() => { setOpen(false); signOut(); navigate('/') }}
            style={{ ...itemStyle, borderTop: `1px solid ${S.border}`, color: S.accent }}
            onMouseOver={e => e.currentTarget.style.background = S.bg}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            <span>↩</span> Logout
          </button>
        </div>
      )}
    </div>
  )
}