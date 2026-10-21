import { useState } from 'react'
import { transactions } from '../../data/transactions'
import MobileBottomSheet from './MobileBottomSheet'
import MobileForceModal from './MobileForceModal'
import type { Transaction } from '../../data/transactions'

// ── Design tokens — monochromatic blue ──
const BG        = '#E8F0FD'   // light blue app background
const WHITE     = '#FFFFFF'
const BLUE      = '#1B3FA0'   // primary blue
const BLUE_MID  = '#3B6ED4'   // mid blue (secondary emphasis)
const BLUE_ICON = '#D6E4FA'   // icon circle background
const BLUE_SOFT = '#EEF4FF'   // badge / chip background
const TEXT1     = '#0F172A'
const TEXT2     = '#64748B'
const TEXT3     = '#94A3B8'
const BORDER    = '#D0DDF5'

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

const statusCfg = {
  conciliado:   { label: 'Cuadrado',   bg: BLUE_SOFT, text: BLUE,     sym: '✓' },
  discrepancia: { label: 'Diferencia', bg: BLUE_ICON,  text: BLUE_MID, sym: '!' },
  pendiente:    { label: 'Pendiente',  bg: '#E0EAFF',  text: '#2D5BC7', sym: '…' },
}

const svcLabel: Record<string, string> = { predial: 'Predial', agua: 'Agua', multas: 'Multas' }
const svcIcon:  Record<string, string> = { predial: '🏠', agua: '💧', multas: '⚠️' }

export default function MobileReconciliation() {
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [showForce, setShowForce]   = useState(false)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const cuadrados   = transactions.filter(t => t.estado === 'conciliado').length
  const diferencias = transactions.filter(t => t.estado === 'discrepancia')
  const pendientes  = transactions.filter(t => t.estado === 'pendiente').length
  const totalSistema = transactions.reduce((s, t) => s + t.montoSistema, 0)
  const descuadre    = Math.abs(transactions.reduce((s, t) => s + (t.montoBanco - t.montoSistema), 0))

  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', background: BG, display: 'flex', flexDirection: 'column' }}>

        {/* ── HEADER (white strip) ── */}
        <div style={{ background: WHITE, padding: '8px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4.5, padding: '2px 0' }} aria-label="Menú">
            <span style={{ display: 'block', width: 22, height: 2, background: TEXT1, borderRadius: 2 }} />
            <span style={{ display: 'block', width: 15, height: 2, background: TEXT1, borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: TEXT1, borderRadius: 2 }} />
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="16" stroke={BLUE} strokeWidth="1.8" fill={WHITE}/>
              <path d="M8 18L17 10L26 18" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="10" y="18" width="5" height="7" rx="0.5" fill={BLUE}/>
              <rect x="19" y="18" width="5" height="7" rx="0.5" fill={BLUE}/>
              <rect x="14" y="21" width="6" height="4" rx="0.5" fill={WHITE}/>
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: BLUE, letterSpacing: '0.04em', lineHeight: 1 }}>CITYPAY</div>
              <div style={{ fontSize: 9, color: TEXT3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>ADMIN</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, position: 'relative' }} aria-label="Notificaciones">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT1} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{ position: 'absolute', top: 1, right: 1, width: 7, height: 7, borderRadius: '50%', background: BLUE_MID, border: `1.5px solid ${WHITE}` }} />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: WHITE, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>N</span>
            </div>
          </div>
        </div>

        {/* ── GREETING ── */}
        <div style={{ padding: '14px 18px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: TEXT1, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                ¡Hola, Neftali!
              </h1>
              <p style={{ fontSize: 13, color: TEXT2, marginTop: 2 }}>Panel de administrador</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: WHITE, border: `1px solid ${BORDER}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT1 }}>15 mayo 2026</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TEXT2} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        {/* ── RESUMEN RÁPIDO (2×2 white cards on blue bg) ── */}
        <Section label="Resumen rápido">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <KpiCard icon={<MoneyIcon />}   label="Ingresos hoy"           value={`$${(totalSistema / 1000).toFixed(1)}K`} sub="MXN" trend={2.0} />
            <KpiCard icon={<CardSvgIcon />} label="Pagos cuadrados"        value={`${cuadrados}`}                           sub="Cuadrados" trend={8.3} />
            <KpiCard icon={<WarnSvgIcon />} label="Descuadre detectado"    value={`$${(descuadre / 1000).toFixed(1)}K`}    sub="MXN" trend={-diferencias.length} isAlert />
            <KpiCard icon={<ClkSvgIcon />}  label="Pendientes de banco"    value={`${pendientes}`}                          sub="Pendientes" trend={-4.2} />
          </div>
        </Section>

        {/* ── ACCIONES RÁPIDAS ── */}
        <Section label="Acciones rápidas" link="Ver todas">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[
              { icon: '💳', label: 'Registrar\npago' },
              { icon: '🔍', label: 'Buscar\nusuario' },
              { icon: '📋', label: 'Nueva\nsolicitud' },
              { icon: '📊', label: 'Generar\nreporte' },
              { icon: '📢', label: 'Notificación\nmasiva' },
            ].map(a => (
              <button key={a.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', flex: 1 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: 9.5, color: TEXT2, textAlign: 'center', fontWeight: 500, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── CONCILIACIÓN DE PAGOS (new section) ── */}
        <Section label="Conciliación de pagos" link="Ver historial">
          <div style={{ background: WHITE, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {/* Summary row */}
            <div style={{ display: 'flex', borderBottom: `1px solid #F1F5F9` }}>
              <div style={{ flex: 1, padding: '12px 14px', borderRight: `1px solid #F1F5F9` }}>
                <p style={{ fontSize: 10, color: TEXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Total Sistema</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: TEXT1, lineHeight: 1 }}>{fmt(totalSistema)}</p>
                <p style={{ fontSize: 10, color: BLUE_MID, fontWeight: 600, marginTop: 3 }}>↑ 2.4% vs ayer</p>
              </div>
              <div style={{ flex: 1, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: TEXT3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Descuadre</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: BLUE, lineHeight: 1 }}>{fmt(descuadre)}</p>
                <p style={{ fontSize: 10, color: BLUE_MID, fontWeight: 600, marginTop: 3 }}>
                  {diferencias.length} diferencia{diferencias.length !== 1 ? 's' : ''} detectada{diferencias.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Discrepancy items */}
            {diferencias.map((tx, i) => {
              const effectiveEstado = resolvedIds.has(tx.id) ? 'conciliado' : tx.estado
              const s = statusCfg[effectiveEstado]
              const isLast = i === diferencias.length - 1
              return (
                <button
                  key={tx.id}
                  onClick={() => setSelected(tx)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderBottom: !isLast ? `1px solid #F8FAFC` : 'none',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                    {svcIcon[tx.servicio]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TEXT1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {svcLabel[tx.servicio]} — {tx.folio}
                    </p>
                    <p style={{ fontSize: 11, color: TEXT3, marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                      Banco: {tx.montoBanco === 0 ? 'Sin acreditar' : fmt(tx.montoBanco)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: TEXT1 }}>{fmt(tx.montoSistema)}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.text, fontSize: 10.5, fontWeight: 700 }}>
                      {s.sym} {s.label}
                    </span>
                  </div>
                </button>
              )
            })}

            {/* Action row */}
            <div style={{ padding: '10px 14px', background: BLUE_SOFT, borderTop: `1px solid ${BORDER}` }}>
              <button
                style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: BLUE, color: WHITE, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                onClick={() => diferencias.length > 0 && setSelected(diferencias[0])}
              >
                Revisar diferencias →
              </button>
            </div>
          </div>
        </Section>

        {/* ── ACTIVIDAD RECIENTE POR CATEGORÍA ── */}
        <Section label="Actividad reciente por categoría">
          <div style={{ background: WHITE, borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {[
              { icon: '💳', iconBg: BLUE_ICON, label: 'Pagos',       sub: 'Último: Pago recibido · Hace 5 min',               count: 12 },
              { icon: '👤', iconBg: BLUE_ICON, label: 'Usuarios',   sub: 'Último: Nuevo usuario registrado · Hace 19 min',    count: 8  },
              { icon: '📋', iconBg: BLUE_ICON, label: 'Solicitudes',sub: 'Último: Nueva solicitud de reporte · Hace 52 min',  count: 6  },
              { icon: '⚠️', iconBg: BLUE_ICON, label: 'Incidencias',sub: 'Último: Pago fallido · Hace 40 min',                count: 4  },
            ].map((row, i, arr) => (
              <button
                key={row.label}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 14px',
                  borderBottom: i < arr.length - 1 ? `1px solid #F5F7FA` : 'none',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: row.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {row.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: TEXT1 }}>{row.label}</p>
                  <p style={{ fontSize: 11, color: TEXT3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: TEXT1 }}>{row.count}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* bottom padding */}
        <div style={{ height: 20, flexShrink: 0 }} />
      </div>

      {/* ── BOTTOM NAV (white strip, identical to reference) ── */}
      <div style={{ background: WHITE, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 8px', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
        {[
          { icon: <HomeNavIcon />,   label: 'Inicio',       active: true  },
          { icon: <CardNavIcon />,   label: 'Pagos',        active: false },
          { icon: <ChartNavIcon />,  label: 'Reportes',     active: false },
          { icon: <DocNavIcon />,    label: 'Solicitudes',  active: false },
          { icon: <UserNavIcon />,   label: 'Perfil',       active: false },
        ].map(tab => (
          <button key={tab.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px' }}>
            <span style={{ color: tab.active ? BLUE : TEXT3 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab.active ? 700 : 500, color: tab.active ? BLUE : TEXT3 }}>{tab.label}</span>
            {tab.active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: BLUE }} />}
          </button>
        ))}
      </div>

      {selected && (
        <MobileBottomSheet
          tx={selected}
          resolved={resolvedIds.has(selected.id)}
          onClose={() => setSelected(null)}
          onForce={() => setShowForce(true)}
          onResolve={() => { setResolvedIds(prev => new Set([...prev, selected.id])); setSelected(null) }}
        />
      )}
      {showForce && (
        <MobileForceModal
          onConfirm={() => {
            if (selected) setResolvedIds(prev => new Set([...prev, selected.id]))
            setShowForce(false); setSelected(null)
          }}
          onCancel={() => setShowForce(false)}
        />
      )}
    </>
  )
}

// ── Section wrapper ──
function Section({ label, link, children }: { label: string; link?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: TEXT1 }}>{label}</span>
        {link && <button style={{ fontSize: 12.5, color: BLUE, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>{link}</button>}
      </div>
      {children}
    </div>
  )
}

// ── KPI Card ──
function KpiCard({ icon, label, value, sub, trend, isAlert }: {
  icon: React.ReactNode; label: string; value: string; sub: string; trend: number; isAlert?: boolean
}) {
  const trendUp = trend > 0
  return (
    <div style={{ background: WHITE, borderRadius: 14, padding: '13px', border: `1px solid ${BORDER}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: BLUE }}>
        {icon}
      </div>
      <p style={{ fontSize: 10.5, color: TEXT2, fontWeight: 600, lineHeight: 1.2, marginBottom: 4 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: TEXT1, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10.5, color: TEXT3, marginTop: 2, marginBottom: 4 }}>{sub}</p>
      <p style={{ fontSize: 10.5, fontWeight: 600, color: BLUE_MID }}>
        {trendUp ? '↑' : '↓'} {Math.abs(trend)}% vs ayer
      </p>
    </div>
  )
}

// ── SVG icons ──
const sw = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function MoneyIcon()    { return <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...sw}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
function CardSvgIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...sw}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function WarnSvgIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...sw}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function ClkSvgIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" {...sw}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }

const nw = { fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function HomeNavIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...nw}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function CardNavIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...nw}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }
function ChartNavIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...nw}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
function DocNavIcon()   { return <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...nw}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function UserNavIcon()  { return <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" {...nw}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
