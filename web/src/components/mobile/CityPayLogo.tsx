export default function CityPayLogo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="17" stroke="#1B3FA0" strokeWidth="2" fill="white" />
        {/* Building icon */}
        <rect x="11" y="19" width="5" height="8" rx="0.5" fill="#1B3FA0" />
        <rect x="20" y="19" width="5" height="8" rx="0.5" fill="#1B3FA0" />
        <path d="M9 19L18 10L27 19" stroke="#1B3FA0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="15" y="22" width="6" height="5" rx="0.5" fill="white" />
      </svg>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#1B3FA0', letterSpacing: '-0.02em', lineHeight: 1 }}>
          CITYPAY
        </div>
        <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
          ADMIN
        </div>
      </div>
    </div>
  )
}
