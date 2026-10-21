import { useState } from 'react'

const BLUE = '#1B3FA0'
const BLUE_MID = '#3B6ED4'
const BLUE_ICON = '#D6E4FA'
const BLUE_SOFT = '#EEF4FF'
const NAVY = '#12296B'
const TEXT1 = '#0F172A'
const TEXT3 = '#94A3B8'
const BORDER = '#D0DDF5'

const stroke = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export default function MobileLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  return (
    <div
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, #FFFFFF 0%, ${BLUE_SOFT} 100%)`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ position: 'absolute', top: -70, left: -60, width: 190, height: 190, borderRadius: '50%', background: BLUE_ICON, opacity: 0.55 }} aria-hidden />
      <button type="button" style={{ position: 'absolute', top: 12, right: 16, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10.5, fontWeight: 600, color: NAVY }}>
        <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" {...stroke}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>
        ES
        <svg width="9" height="9" viewBox="0 0 24 24" stroke="currentColor" {...stroke}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <svg width="90" height="70" style={{ position: 'absolute', top: 120, right: 10, opacity: 0.5 }} aria-hidden>
        {Array.from({ length: 5 * 7 }).map((_, i) => (
          <circle key={i} cx={(i % 7) * 13 + 4} cy={Math.floor(i / 7) * 13 + 4} r="1.6" fill={BLUE_MID} />
        ))}
      </svg>

      {/* skyline */}
      <svg viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 150, pointerEvents: 'none' }} aria-hidden>
        <g fill={BLUE_ICON} opacity="0.9">
          <rect x="6" y="80" width="34" height="70" />
          <rect x="44" y="58" width="28" height="92" />
          <rect x="76" y="92" width="30" height="58" />
          <rect x="284" y="70" width="32" height="80" />
          <rect x="320" y="50" width="26" height="100" />
          <rect x="350" y="86" width="40" height="64" />
          <rect x="120" y="108" width="150" height="42" />
          <polygon points="115,108 195,76 275,108" />
          <rect x="132" y="112" width="12" height="38" fill="#fff" opacity="0.7" />
          <rect x="156" y="112" width="12" height="38" fill="#fff" opacity="0.7" />
          <rect x="222" y="112" width="12" height="38" fill="#fff" opacity="0.7" />
          <rect x="246" y="112" width="12" height="38" fill="#fff" opacity="0.7" />
        </g>
        <rect x="0" y="140" width="390" height="10" fill="#C3D6F5" />
      </svg>

      <div style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '44px 26px 150px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Illustration />

        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, letterSpacing: '0.02em', lineHeight: 1, marginTop: 2 }}>
          <span style={{ color: NAVY }}>CITY</span>
          <span style={{ color: BLUE_MID }}>PAY</span>
        </div>
        <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: NAVY, marginTop: 6, textTransform: 'uppercase' }}>
          Tu municipio, <span style={{ color: BLUE_MID }}>en un solo lugar.</span>
        </p>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: NAVY, marginTop: 22 }}>¡Bienvenido!</h1>
        <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Inicia sesión para continuar</p>

        <form
          onSubmit={e => { e.preventDefault(); onLogin() }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}
        >
          <Field icon={<><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico" autoComplete="email" style={inputStyle}
            />
          </Field>
          <Field icon={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>}>
            <input
              type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña" autoComplete="current-password" style={inputStyle}
            />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: TEXT3 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...stroke}>
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
                {show && <line x1="3" y1="3" x2="21" y2="21" />}
              </svg>
            </button>
          </Field>

          <button type="button" style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: BLUE_MID, padding: 0, marginTop: -4 }}>
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="submit"
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 6px 14px rgba(27,63,160,0.28)', fontFamily: 'var(--font-sans)' }}
          >
            INGRESAR
          </button>
        </form>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 10.5, color: TEXT3 }}>o continúa con</span>
          <span style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        <div style={{ width: '100%', display: 'flex', gap: 10, marginTop: 12 }}>
          <SocialButton label="Google" icon={<span style={{ fontWeight: 800, fontSize: 16, color: BLUE_MID, fontFamily: 'var(--font-display)' }}>G</span>} />
          <SocialButton label="Apple" icon={<svg width="15" height="17" viewBox="0 0 24 24" fill={TEXT1}><path d="M12 7c-1.5-1-4-1-5.500.8C5 9.500 5 13 6.800 16c1 1.600 2.300 3.500 3.700 3.500 1 0 1.100-.6 1.500-.6s.5.600 1.500.6c1.400 0 2.700-1.900 3.700-3.500-2.500-1.500-2.700-5 0-6.300C16 7.300 13.500 6 12 7z"/><path d="M12.500 5.500c0-1.600 1-3 2.500-3.500 0 1.600-.8 3-2.500 3.500z"/></svg>} />
        </div>

        <p style={{ fontSize: 11, color: '#64748B', marginTop: 16 }}>
          ¿No tienes cuenta?{' '}
          <button type="button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: BLUE_MID }}>Crea una aquí</button>
        </p>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
  fontSize: 13, color: TEXT1, fontFamily: 'var(--font-sans)',
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 46, borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}` }}>
      <svg width="18" height="18" viewBox="0 0 24 24" stroke={BLUE_MID} {...stroke}>{icon}</svg>
      {children}
    </label>
  )
}

function SocialButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button type="button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: TEXT1, fontFamily: 'var(--font-sans)' }}>
      {icon}{label}
    </button>
  )
}

export function Illustration({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M52 16A26 26 0 1 0 52 48" stroke={BLUE_MID} strokeWidth="5" strokeLinecap="round" />
      <path d="M38 50V26l8-6 8 6v24" stroke={NAVY} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="43" y="30" width="3" height="4" fill={NAVY} /><rect x="43" y="38" width="3" height="4" fill={NAVY} />
      <path d="M22 50V34l6-5 6 5v16" stroke={BLUE_MID} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
