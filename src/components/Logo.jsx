export default function Logo({ size = 40, showText = true }) {
    const cx = size / 2
    const cy = size / 2
    const scale = size / 110
  
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 110 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
  
          {/* Background */}
          <rect width="110" height="110" rx="22" fill="#fff1f2"/>
  
          {/* Petals */}
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.9"
            transform="rotate(0 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.65"
            transform="rotate(45 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.65"
            transform="rotate(-45 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.35"
            transform="rotate(90 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.35"
            transform="rotate(-90 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.2"
            transform="rotate(135 55 55)"/>
          <ellipse cx="55" cy="28" rx="8" ry="14"
            fill="#f43f5e" opacity="0.2"
            transform="rotate(-135 55 55)"/>
  
          {/* Sun center */}
          <circle cx="55" cy="55" r="13" fill="#f97316"/>
          <circle cx="55" cy="55" r="7" fill="#fff7ed"/>
  
        </svg>
  
        {showText && (
          <span style={{
            fontFamily: 'Georgia, serif',
            fontSize: size * 0.45,
            fontWeight: '600',
            color: '#f43f5e',
            letterSpacing: '-0.5px'
          }}>
            Bihaan
          </span>
        )}
      </div>
    )
  }