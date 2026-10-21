import { useState } from 'react'
import type { Transaction } from '../data/transactions'
import StatusBadge from './StatusBadge'
import ForceReconcileModal from './ForceReconcileModal'

interface Props {
  tx: Transaction
  onClose: () => void
}

const fmt = (n: number) =>
  n === 0 ? '—' : n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function DetailPanel({ tx, onClose }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [resolved, setResolved] = useState(false)
  const diff = tx.montoBanco - tx.montoSistema

  return (
    <>
      <div
        className="flex flex-col h-full"
        style={{ background: '#fff', borderLeft: '1px solid #e2e8f0' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#0b1731' }}>
              Detalle de Operación
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {tx.folio}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            style={{ width: 30, height: 30, color: '#64748b', fontSize: 16 }}
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <StatusBadge status={resolved ? 'conciliado' : tx.estado} />
            {resolved && (
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Conciliado manualmente</span>
            )}
          </div>

          {/* Comparison table */}
          {tx.estado === 'discrepancia' && !resolved && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #fecaca' }}
            >
              <div
                className="px-4 py-2.5"
                style={{ background: '#fff1f1', borderBottom: '1px solid #fecaca' }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ⚠ Discrepancia detectada
                </span>
              </div>
              <div className="grid grid-cols-2" style={{ background: '#fff' }}>
                <div className="p-4" style={{ borderRight: '1px solid #fee2e2' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Sistema CityPay
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: '#0b1731' }}>
                    {fmt(tx.montoSistema)}
                  </div>
                </div>
                <div className="p-4">
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Acreditado Banco
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: '#b91c1c' }}>
                    {fmt(tx.montoBanco)}
                  </div>
                </div>
              </div>
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: '#fff7f7', borderTop: '1px solid #fecaca' }}
              >
                <span style={{ fontSize: 12, color: '#64748b' }}>Diferencia</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: diff < 0 ? '#b91c1c' : '#d97706' }}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </span>
              </div>
            </div>
          )}

          {/* Meta fields */}
          <Section title="Datos del Trámite">
            <Field label="Concepto" value={tx.concepto} />
            <Field label="Ciudadano" value={tx.ciudadano} />
            <Field label="Fecha" value={new Date(tx.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} />
            <Field label="Método de Pago" value={tx.metodoPago} />
            <Field label="Institución Bancaria" value={tx.banco} />
          </Section>

          <Section title="Referencias">
            <Field label="Folio del Sistema" value={tx.folio} mono />
            <Field label="Referencia Bancaria" value={tx.referenciaBancaria} mono />
          </Section>

          {/* Amounts */}
          <Section title="Montos">
            <Field label="Monto Sistema" value={fmt(tx.montoSistema)} mono />
            <Field label="Monto Banco" value={tx.montoBanco === 0 ? 'Sin acreditar' : fmt(tx.montoBanco)} mono />
          </Section>
        </div>

        {/* Actions */}
        {!resolved && (
          <div
            className="px-5 py-4 flex flex-col gap-2 shrink-0"
            style={{ borderTop: '1px solid #e2e8f0', background: '#fafbfc' }}
          >
            {tx.estado === 'discrepancia' && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: '#b91c1c', color: '#fff' }}
              >
                Forzar Conciliación Manual
              </button>
            )}
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: '#163058', color: '#a8c8f5' }}
            >
              Solicitar Revisión
            </button>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: '#f1f4f9', color: '#2557a7', border: '1px solid #dbeafe' }}
            >
              Notificar al Ciudadano
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ForceReconcileModal
          folio={tx.folio}
          onConfirm={() => {
            setShowModal(false)
            setResolved(true)
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-0" style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-4 py-2.5"
      style={{ borderBottom: '1px solid #f1f5f9' }}
    >
      <span style={{ fontSize: 12, color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: '#0b1731',
          textAlign: 'right',
          fontFamily: mono ? 'var(--font-mono)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  )
}
