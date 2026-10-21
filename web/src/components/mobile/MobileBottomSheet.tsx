import { useEffect, useState } from 'react'
import type { Transaction } from '../../data/transactions'

interface Props {
  tx: Transaction
  resolved: boolean
  onClose: () => void
  onForce: () => void
  onResolve: () => void
}

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

// monochromatic blue tokens
const BLUE      = '#1B3FA0'
const BLUE_MID  = '#3B6ED4'
const BLUE_ICON = '#D6E4FA'
const BLUE_SOFT = '#EEF4FF'
const BORDER    = '#D0DDF5'

const serviceLabel: Record<string, string> = { predial: 'Predial', agua: 'Agua', multas: 'Multas' }
const serviceIcon:  Record<string, string>  = { predial: '🏠', agua: '💧', multas: '⚠️' }
const serviceBg:    Record<string, string>  = { predial: BLUE_ICON, agua: BLUE_ICON, multas: BLUE_ICON }

export default function MobileBottomSheet({ tx, resolved, onClose, onForce }: Props) {
  const [visible, setVisible] = useState(false)
  const diff = tx.montoBanco - tx.montoSistema
  const isDiscrepancy = tx.estado === 'discrepancia' && !resolved

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const handleClose = () => { setVisible(false); setTimeout(onClose, 260) }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.5)', opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease', backdropFilter: 'blur(2px)' }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.34, 1.06, 0.64, 1)',
          maxHeight: '88%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <div style={{ width: 40, height: 4, background: '#E8ECF2', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '6px 18px 14px', borderBottom: '1px solid #F5F7FA', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#1a1a2e', lineHeight: 1.1 }}>
              Detalle del Registro
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{tx.folio}</p>
          </div>
          <button
            onClick={handleClose}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#F5F7FA', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b' }}
            aria-label="Cerrar"
          >✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Concept card — matches "pagos pendientes" card style */}
          <div style={{ background: BLUE_SOFT, borderRadius: 14, padding: '14px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: BLUE_ICON, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {serviceIcon[tx.servicio]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{tx.concepto}</p>
              <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>{tx.ciudadano}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                Vencer: <span style={{ color: BLUE_MID, fontWeight: 600 }}>
                  {new Date(tx.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </p>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: BLUE, flexShrink: 0, textAlign: 'right' }}>
              {fmt(tx.montoSistema)}<br />
              <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>MXN</span>
            </div>
          </div>

          {/* Discrepancy comparison */}
          {isDiscrepancy && (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <div style={{ padding: '10px 14px', background: BLUE_ICON, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE }}>Diferencia detectada</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff' }}>
                <div style={{ padding: '14px', borderRight: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Registrado en App</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{fmt(tx.montoSistema)}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Sistema CityPay</p>
                </div>
                <div style={{ padding: '14px' }}>
                  <p style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Reportado por Banco</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: BLUE_MID, lineHeight: 1 }}>
                    {tx.montoBanco === 0 ? 'Sin acreditar' : fmt(tx.montoBanco)}
                  </p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{tx.banco}</p>
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: BLUE_SOFT, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Diferencia neta</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: BLUE }}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </span>
              </div>
            </div>
          )}

          {/* Info rows */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
            {[
              { label: 'Servicio', value: serviceLabel[tx.servicio] },
              { label: 'Método de pago', value: tx.metodoPago },
              { label: 'Institución bancaria', value: tx.banco },
              { label: 'Referencia bancaria', value: tx.referenciaBancaria, mono: true },
              { label: 'Monto banco', value: tx.montoBanco === 0 ? 'Sin acreditar' : fmt(tx.montoBanco), mono: true },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none', gap: 10 }}
              >
                <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a2e', textAlign: 'right', fontFamily: row.mono ? 'var(--font-mono)' : undefined }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!resolved ? (
          <div style={{ padding: '14px 18px 20px', borderTop: `1px solid ${BORDER}`, background: '#fff', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <button
              onClick={onForce}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: `2px solid ${BLUE}`, background: 'transparent', color: BLUE, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              ⚡ Forzar Conciliación
            </button>
            <button
              onClick={handleClose}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: BLUE, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              🔔 Notificar Falla
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 18px 20px', background: BLUE_SOFT, borderTop: `1px solid ${BORDER}` }}>
            <p style={{ textAlign: 'center', fontSize: 14, color: BLUE, fontWeight: 700 }}>✓ Cuadrado manualmente</p>
          </div>
        )}
      </div>
    </div>
  )
}
