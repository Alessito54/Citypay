import { useState } from 'react'
import { Illustration } from './MobileLogin'

const BG = '#E8F0FD'
const BLUE = '#1B3FA0'
const BLUE_MID = '#3B6ED4'
const BLUE_ICON = '#D6E4FA'
const BLUE_SOFT = '#EEF4FF'
const NAVY = '#12296B'
const TEXT1 = '#0F172A'
const TEXT2 = '#64748B'
const TEXT3 = '#94A3B8'
const BORDER = '#D0DDF5'
const MAX = 250

const sv = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const problemas: Record<string, string[]> = {
  'Alumbrado público': ['Lámpara apagada', 'Poste dañado', 'Cableado expuesto'],
  Vialidad: ['Bache en la calle', 'Semáforo descompuesto', 'Señalización dañada'],
  Agua: ['Fuga de agua', 'Sin suministro', 'Drenaje tapado'],
  'Limpieza y residuos': ['Contenedor lleno', 'Basura acumulada'],
  'Parques y jardines': ['Juego dañado', 'Árbol caído', 'Pasto sin podar'],
}
const prioridades = [
  { id: 'Bajo', dot: BLUE_ICON },
  { id: 'Media', dot: BLUE_MID },
  { id: 'Alta', dot: BLUE },
]

export default function MobileNewReport({ onSent, onBack }: { onSent?: () => void; onBack?: () => void }) {
  const [cat, setCat] = useState('Alumbrado público')
  const [prob, setProb] = useState('Lámpara apagada')
  const [pri, setPri] = useState('Alta')
  const [addr, setAddr] = useState('Av. Independencia #345, Orizaba, Ver.')
  const [desc, setDesc] = useState('')
  const [photos, setPhotos] = useState([0, 1])
  const [sent, setSent] = useState(false)

  const submit = () => {
    setSent(true)
    setTimeout(() => { setSent(false); onSent?.() }, 1400)
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: `1px solid ${BORDER}` }}>
          <button aria-label="Volver" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke={TEXT1} {...sv}><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Illustration size={30} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '0.04em' }}>
              <span style={{ color: NAVY }}>CITY</span><span style={{ color: BLUE_MID }}>PAY</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke={TEXT1} {...sv}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke={BLUE} {...sv}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: NAVY, lineHeight: 1.1 }}>Nuevo reporte</h1>
            <p style={{ fontSize: 12.5, color: TEXT2, marginTop: 3 }}>Ayúdanos a mantener una mejor ciudad.</p>
          </div>

          <Group label="Categoría">
            <SelectBox
              icon={<><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.700c.6.500 1 1.200 1 2V17h6v-.3c0-.8.400-1.500 1-2A7 7 0 0 0 12 2z" /></>}
              value={cat}
              onChange={v => { setCat(v); setProb(problemas[v][0]) }}
              options={Object.keys(problemas)}
            />
          </Group>

          <Group label="Problema">
            <SelectBox
              icon={<><path d="M10.290 3.860L1.820 18a2 2 0 0 0 1.710 3h16.940a2 2 0 0 0 1.710-3L13.710 3.860a2 2 0 0 0-3.420 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.010" y2="17" /></>}
              value={prob} onChange={setProb} options={problemas[cat]} chevron="right"
            />
          </Group>

          <Group label="Prioridad">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} role="radiogroup" aria-label="Prioridad">
              {prioridades.map(p => {
                const on = pri === p.id
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPri(p.id)}
                    style={{ height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-sans)',
                      background: on ? BLUE_SOFT : '#fff', color: on ? BLUE : TEXT1, border: `${on ? 1.5 : 1}px solid ${on ? BLUE : BORDER}` }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: p.dot, border: `1px solid ${BLUE_MID}` }} />
                    {p.id}
                  </button>
                )
              })}
            </div>
          </Group>

          <Group label="Ubicación">
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke={BLUE_MID} {...sv}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                <input value={addr} onChange={e => setAddr(e.target.value)} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 12, color: TEXT1, fontFamily: 'var(--font-sans)', background: 'transparent' }} />
                {addr && <button type="button" aria-label="Borrar" onClick={() => setAddr('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke={TEXT3} {...sv}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                </button>}
              </label>
              <button type="button" aria-label="Usar mi ubicación" style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" stroke={BLUE_MID} {...sv}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" /><line x1="1" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="23" y2="12" /></svg>
              </button>
            </div>
            <MapPreview />
          </Group>

          <Group label="Descripción">
            <div style={{ position: 'relative' }}>
              <textarea
                value={desc} maxLength={MAX} onChange={e => setDesc(e.target.value)} rows={3}
                placeholder="La lámpara no enciende desde hace varios días. Se encuentra frente al parque."
                style={{ width: '100%', resize: 'none', padding: '10px 12px 22px', borderRadius: 10, border: `1px solid ${BORDER}`, outline: 'none', fontSize: 12, lineHeight: 1.45, color: TEXT1, fontFamily: 'var(--font-sans)' }}
              />
              <span style={{ position: 'absolute', right: 10, bottom: 7, fontSize: 9.5, color: TEXT3 }}>{desc.length}/{MAX}</span>
            </div>
          </Group>

          <Group label="Evidencia (opcional)">
            <div style={{ display: 'flex', gap: 8 }}>
              {photos.map(p => (
                <div key={p} style={{ position: 'relative', width: 74, height: 74, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: `linear-gradient(160deg, #1B2F66, ${BLUE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {p === 0 ? '💡' : '🌃'}
                  <button type="button" aria-label="Quitar foto" onClick={() => setPhotos(ps => ps.filter(x => x !== p))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" stroke={TEXT1} {...sv} strokeWidth={3}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ))}
              <AddTile label="Tomar foto" icon={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>} onClick={() => setPhotos(ps => ps.length < 4 ? [...ps, Date.now()] : ps)} />
              <AddTile label="Agregar imagen" icon={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.500" cy="8.500" r="1.500" /><polyline points="21 15 16 10 5 21" /></>} onClick={() => setPhotos(ps => ps.length < 4 ? [...ps, Date.now()] : ps)} />
            </div>
          </Group>
        </div>
      </div>

      <div style={{ padding: '10px 18px 12px', background: '#fff', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button type="button" onClick={submit} disabled={sent}
          style={{ width: '100%', height: 46, borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 5px 12px rgba(27,63,160,0.25)', fontFamily: 'var(--font-sans)', opacity: sent ? 0.85 : 1 }}>
          {sent ? <>✓ Reporte enviado</> : <>
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" {...sv}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            Enviar reporte</>}
        </button>
      </div>
    </>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{label}</span>
      {children}
    </div>
  )
}

function SelectBox({ icon, value, onChange, options, chevron = 'down' }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; options: string[]; chevron?: 'down' | 'right' }) {
  return (
    <label style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" stroke={BLUE_MID} {...sv}>{icon}</svg>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, appearance: 'none', border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: TEXT1, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" stroke={TEXT2} {...sv} style={{ pointerEvents: 'none' }}>
        <polyline points={chevron === 'down' ? '6 9 12 15 18 9' : '9 18 15 12 9 6'} />
      </svg>
    </label>
  )
}

function AddTile({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ flex: 1, minWidth: 0, height: 74, borderRadius: 10, border: `1.5px dashed ${BLUE_MID}`, background: BLUE_SOFT, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: BLUE, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" {...sv}>{icon}</svg>
      {label}
    </button>
  )
}

function MapPreview() {
  return (
    <div style={{ position: 'relative', height: 108, borderRadius: 10, overflow: 'hidden', background: BG, border: `1px solid ${BORDER}` }}>
      <svg width="100%" height="100%" viewBox="0 0 320 108" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="320" height="108" fill={BLUE_SOFT} />
        <rect x="190" y="0" width="130" height="50" fill={BLUE_ICON} opacity="0.7" />
        <g stroke="#fff" strokeWidth="10" strokeLinecap="round">
          <line x1="-10" y1="70" x2="330" y2="30" />
          <line x1="120" y1="-10" x2="170" y2="120" />
          <line x1="250" y1="-10" x2="230" y2="120" strokeWidth="7" />
        </g>
        <g stroke="#C3D6F5" strokeWidth="1.5">
          <line x1="-10" y1="95" x2="330" y2="85" />
          <line x1="40" y1="-10" x2="60" y2="120" />
        </g>
      </svg>
      <svg width="26" height="32" viewBox="0 0 24 30" style={{ position: 'absolute', left: '46%', top: '30%' }} aria-hidden>
        <path d="M12 0a9 9 0 0 0-9 9c0 7 9 19 9 19s9-12 9-19a9 9 0 0 0-9-9z" fill={BLUE} />
        <circle cx="12" cy="9" r="3.500" fill="#fff" />
      </svg>
      <button type="button" aria-label="Ampliar mapa" style={{ position: 'absolute', right: 8, bottom: 8, width: 26, height: 26, borderRadius: 6, border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" stroke={TEXT1} {...sv}><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
      </button>
    </div>
  )
}
