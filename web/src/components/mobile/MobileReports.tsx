import { useMemo, useState } from 'react'
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

const sv = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

type Estado = 'Nuevo' | 'En proceso' | 'Asignado' | 'Resuelto'
type Report = { id: string; title: string; address: string; date: string; estado: Estado; categoria: string; prioridad: 'Alta' | 'Media' | 'Baja'; icon: string }

const reports: Report[] = [
  { id: 'r1', title: 'Lámpara apagada', address: 'Av. Independencia #4392', date: '12 may 2026', estado: 'Nuevo', categoria: 'Alumbrado público', prioridad: 'Media', icon: '💡' },
  { id: 'r2', title: 'Bache en la calle', address: 'Calle Morelos', date: '11 may 2026', estado: 'En proceso', categoria: 'Vialidad', prioridad: 'Alta', icon: '🚧' },
  { id: 'r3', title: 'Contenedor lleno', address: 'Av. Juárez #128', date: '10 may 2026', estado: 'Asignado', categoria: 'Limpieza y residuos', prioridad: 'Media', icon: '🗑️' },
  { id: 'r4', title: 'Fuga de agua', address: 'Calle Hidalgo #56', date: '09 may 2026', estado: 'En proceso', categoria: 'Agua', prioridad: 'Alta', icon: '💧' },
  { id: 'r5', title: 'Juego dañado', address: 'Parque Central', date: '08 may 2026', estado: 'Resuelto', categoria: 'Parques y jardines', prioridad: 'Baja', icon: '🛝' },
]

const estadoStyle: Record<Estado, { bg: string; fg: string; dot: string }> = {
  Nuevo: { bg: BLUE_SOFT, fg: BLUE, dot: BLUE },
  'En proceso': { bg: BLUE_ICON, fg: BLUE, dot: BLUE_MID },
  Asignado: { bg: '#E0EAFF', fg: '#2D5BC7', dot: '#2D5BC7' },
  Resuelto: { bg: BLUE, fg: '#fff', dot: '#fff' },
}

const categorias = ['Todos', ...Array.from(new Set(reports.map(r => r.categoria)))]
const estados = ['Todos', 'Nuevo', 'Asignado', 'En proceso', 'Resuelto']
const prioridades = ['Todas', 'Alta', 'Media', 'Baja']
const periodos = ['Últimos 30 días', 'Últimos 7 días', 'Hoy']

export default function MobileReports() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todos')
  const [est, setEst] = useState('Todos')
  const [pri, setPri] = useState('Todas')
  const [per, setPer] = useState(periodos[0])

  const list = useMemo(() => reports.filter(r =>
    (cat === 'Todos' || r.categoria === cat) &&
    (est === 'Todos' || r.estado === est) &&
    (pri === 'Todas' || r.prioridad === pri) &&
    (!q || `${r.title} ${r.address}`.toLowerCase().includes(q.toLowerCase()))
  ), [q, cat, est, pri])

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', background: BG, display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{ background: '#fff', padding: '8px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button aria-label="Menú" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4.5 }}>
            <span style={{ width: 22, height: 2, background: TEXT1, borderRadius: 2 }} />
            <span style={{ width: 15, height: 2, background: TEXT1, borderRadius: 2 }} />
            <span style={{ width: 22, height: 2, background: TEXT1, borderRadius: 2 }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Illustration size={30} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '0.04em' }}>
              <span style={{ color: NAVY }}>CITY</span><span style={{ color: BLUE_MID }}>PAY</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button aria-label="Notificaciones" style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 2 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" stroke={TEXT1} {...sv}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 14, height: 14, borderRadius: 7, background: BLUE, color: '#fff', fontSize: 8.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>3</span>
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke={BLUE} {...sv}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 18px 0' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: NAVY, lineHeight: 1.1 }}>Reportes</h1>
          <p style={{ fontSize: 12.5, color: TEXT2, marginTop: 3 }}>Gestiona y da seguimiento a los reportes ciudadanos.</p>
        </div>

        {/* KPIs */}
        <div style={{ padding: '14px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Kpi label="Total de reportes" value="248" icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="14" y2="17" /></>} />
          <Kpi label="Pendientes" value="42" icon={<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>} />
          <Kpi label="En proceso" value="67" icon={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 0 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3H9a1.700 1.700 0 0 0 1-1.500V3a2 2 0 0 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800V9a1.700 1.700 0 0 0 1.500 1H21a2 2 0 0 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z" /></>} />
          <Kpi label="Resueltos" value="139" icon={<><circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" /></>} />
        </div>

        {/* search + filters */}
        <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" stroke={TEXT3} {...sv}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.650" y2="16.650" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por ID, reporte o ubicación"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: TEXT1, fontFamily: 'var(--font-sans)' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select label="Categoría" value={cat} onChange={setCat} options={categorias} />
            <Select label="Estado" value={est} onChange={setEst} options={estados} />
            <Select label="Prioridad" value={pri} onChange={setPri} options={prioridades} />
            <Select label="Periodo" value={per} onChange={setPer} options={periodos} icon />
          </div>
          <button style={{ height: 42, borderRadius: 10, border: 'none', background: BLUE, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 5px 12px rgba(27,63,160,0.25)', fontFamily: 'var(--font-sans)' }}>
            + Nuevo reporte
          </button>
        </div>

        {/* list */}
        <div style={{ padding: '12px 18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.length === 0 && <p style={{ textAlign: 'center', fontSize: 12.5, color: TEXT2, padding: 24 }}>No hay reportes con esos filtros.</p>}
          {list.map(r => {
            const s = estadoStyle[r.estado]
            return (
              <button key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', width: '100%', padding: 10, borderRadius: 14, background: '#fff', border: `1px solid ${BORDER}`, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${BLUE_ICON}, #B8CFF3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{r.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: TEXT1 }}>{r.title}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />{r.estado}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: TEXT2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.address}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 10, color: TEXT3 }}>{r.date}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: BLUE, background: BLUE_SOFT, padding: '2px 8px', borderRadius: 6 }}>{r.categoria}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" stroke={TEXT3} {...sv}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )
          })}
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ background: '#fff', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 8px', flexShrink: 0 }}>
        {[
          { label: 'Inicio', d: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
          { label: 'Pagos', d: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></> },
          { label: 'Trámites', d: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
          { label: 'Reportes', active: true, d: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
          { label: 'Perfil', d: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
        ].map(t => (
          <button key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: t.active ? BLUE : TEXT3 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...sv} fill={t.active ? BLUE_ICON : 'none'}>{t.d}</svg>
            <span style={{ fontSize: 10, fontWeight: t.active ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: BLUE_ICON, color: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...sv}>{icon}</svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10.5, color: TEXT2, fontWeight: 600 }}>{label}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: NAVY, lineHeight: 1.1 }}>{value}</p>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options, icon }: { label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: boolean }) {
  return (
    <label style={{ position: 'relative', display: 'block', padding: '6px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: 9.5, color: TEXT3, fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: TEXT1, fontFamily: 'var(--font-sans)', cursor: 'pointer', paddingRight: 16 }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 24 24" stroke={TEXT2} {...sv} style={{ position: 'absolute', right: 10, bottom: 11, pointerEvents: 'none' }}>
        {icon ? <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></> : <polyline points="6 9 12 15 18 9" />}
      </svg>
    </label>
  )
}
