import { useEffect } from 'react'
import { Illustration } from './MobileLogin'

const NAVY = '#12296B'
const BLUE = '#1B3FA0'
const BLUE_MID = '#3B6ED4'
const BLUE_ICON = '#D6E4FA'

export default function MobileLoading({ onDone, delay = 2800 }: { onDone?: () => void; delay?: number }) {
  useEffect(() => {
    if (!onDone) return
    const t = setTimeout(onDone, delay)
    return () => clearTimeout(t)
  }, [onDone, delay])

  return (
    <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
      <style>{`@keyframes cp-spin { to { transform: rotate(360deg) } }`}</style>
      <Illustration size={72} />
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '0.04em', lineHeight: 1, marginTop: 4 }}>
        <span style={{ color: NAVY }}>CITY</span>
        <span style={{ color: BLUE_MID }}>PAY</span>
      </div>

      <div
        role="status" aria-label="Cargando"
        style={{ width: 44, height: 44, borderRadius: '50%', border: `5px solid ${BLUE_ICON}`, borderTopColor: BLUE, marginTop: 44, animation: 'cp-spin 0.9s linear infinite' }}
      />
      <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginTop: 18 }}>Procesando tu solicitud...</p>
      <p style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>Esto solo tomará unos segundos.</p>
    </div>
  )
}
