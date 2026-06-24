// src/components/StarRating.jsx
//
// Dual-purpose star rating.
//  - Display mode (no onChange): shows stars for `value`, optionally a number.
//  - Input mode (pass onChange): clickable + hover, calls onChange(1..5).

import { useState } from 'react'

export default function StarRating({ value = 0, onChange, size = 18, showNumber = false }) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'
  const active = hover || value

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= Math.round(active)
        return (
          <span key={n}
            onClick={interactive ? () => onChange(n) : undefined}
            onMouseEnter={interactive ? () => setHover(n) : undefined}
            onMouseLeave={interactive ? () => setHover(0) : undefined}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              fontSize: size,
              lineHeight: 1,
              userSelect: 'none',
              color: filled ? '#c9922a' : '#d8cfc4',
              transition: 'color .12s',
            }}>
            ★
          </span>
        )
      })}
      {showNumber && value > 0 && (
        <span style={{ fontSize: Math.round(size * 0.7), color: '#7a6e62', marginLeft: '6px', fontFamily: "'Inter', system-ui, sans-serif" }}>
          {Number(value).toFixed(1)}
        </span>
      )}
    </span>
  )
}