import MobileReconciliation from './MobileReconciliation'

export default function MobileApp({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen py-10"
      style={{ background: 'linear-gradient(145deg, #E8EEF8 0%, #D0DCF0 50%, #C4D4EC 100%)' }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(circle, #1B3FA022 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          width: 390, height: 844,
          borderRadius: 52,
          background: '#1a1a2e',
          boxShadow: '0 0 0 1px #2d2d4e, 0 0 0 10px #12121f, 0 40px 100px rgba(0,0,0,0.35), 0 0 80px rgba(27,63,160,0.15)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Screen */}
        <div
          style={{
            position: 'absolute', inset: 2,
            borderRadius: 50,
            background: '#F5F7FA',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              height: 50, background: '#fff',
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-between',
              padding: '0 28px 8px',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700 }}>9:41</span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {/* Signal bars */}
              <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                <rect x="0" y="5" width="3" height="6" rx="1" fill="#1a1a2e" opacity="0.3"/>
                <rect x="4.5" y="3" width="3" height="8" rx="1" fill="#1a1a2e" opacity="0.5"/>
                <rect x="9" y="1.5" width="3" height="9.5" rx="1" fill="#1a1a2e" opacity="0.75"/>
                <rect x="13.5" y="0" width="2.5" height="11" rx="1" fill="#1a1a2e"/>
              </svg>
              {/* WiFi */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <path d="M7.5 2C9.5 2 11.3 2.9 12.6 4.3L13.6 3.1C12 1.4 9.9 0.4 7.5 0.4C5.1 0.4 3 1.4 1.4 3.1L2.4 4.3C3.7 2.9 5.5 2 7.5 2Z" fill="#1a1a2e" opacity="0.4"/>
                <path d="M7.5 5C8.8 5 10 5.6 10.9 6.5L11.9 5.3C10.7 4.1 9.2 3.4 7.5 3.4C5.8 3.4 4.3 4.1 3.1 5.3L4.1 6.5C5 5.6 6.2 5 7.5 5Z" fill="#1a1a2e" opacity="0.7"/>
                <circle cx="7.5" cy="9.5" r="1.5" fill="#1a1a2e"/>
              </svg>
              {/* Battery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <div style={{ width: 22, height: 11, border: '1.5px solid rgba(26,26,46,0.5)', borderRadius: 3, padding: 2, display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '80%', height: '100%', background: '#4CAF50', borderRadius: 1 }} />
                </div>
                <div style={{ width: 2, height: 5, background: 'rgba(26,26,46,0.4)', borderRadius: '0 1px 1px 0' }} />
              </div>
            </div>
          </div>

          {/* Dynamic island */}
          <div
            style={{
              position: 'absolute', top: 14, left: '50%',
              transform: 'translateX(-50%)',
              width: 118, height: 32,
              background: '#1a1a2e', borderRadius: 18, zIndex: 30,
            }}
          />

          {/* App content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {children ?? <MobileReconciliation />}
          </div>
        </div>

        {/* Physical buttons */}
        <div style={{ position: 'absolute', right: -3, top: 180, width: 3, height: 68, background: '#2d2d4e', borderRadius: '0 3px 3px 0' }} />
        <div style={{ position: 'absolute', left: -3, top: 156, width: 3, height: 34, background: '#2d2d4e', borderRadius: '3px 0 0 3px' }} />
        <div style={{ position: 'absolute', left: -3, top: 202, width: 3, height: 66, background: '#2d2d4e', borderRadius: '3px 0 0 3px' }} />
        <div style={{ position: 'absolute', left: -3, top: 278, width: 3, height: 66, background: '#2d2d4e', borderRadius: '3px 0 0 3px' }} />
      </div>

      {/* Label below */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#7a8cb0', fontWeight: 500 }}>CityPay · Vista Móvil</p>
      </div>
    </div>
  )
}
