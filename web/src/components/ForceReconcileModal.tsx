import { useState } from 'react'

interface Props {
  folio: string
  onConfirm: () => void
  onCancel: () => void
}

const JUSTIFICATIONS = [
  'Confirmación bancaria recibida por correo oficial',
  'Error tipográfico en referencia del ciudadano',
  'Cargo pendiente por comisión bancaria',
  'Instrucción de tesorería municipal',
  'Otro (especificar)',
]

export default function ForceReconcileModal({ folio, onConfirm, onCancel }: Props) {
  const [justification, setJustification] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const isValid = justification !== '' && confirmed && (justification !== 'Otro (especificar)' || notes.trim().length > 10)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,31,0.65)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: '#fff7f7', borderBottom: '1px solid #fecaca' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 36, height: 36, background: '#fee2e2', fontSize: 16 }}
              aria-hidden="true"
            >
              ⚠
            </div>
            <div>
              <h2
                id="modal-title"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#7f1d1d', lineHeight: 1.2 }}
              >
                Confirmar Conciliación Manual
              </h2>
              <p style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 4 }}>
                Esta acción es irreversible y quedará registrada en la auditoría.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Folio info */}
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{ background: '#f8faff', border: '1px solid #dbeafe' }}
          >
            <span style={{ fontSize: 12, color: '#64748b' }}>Folio a conciliar</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: '#0b1731' }}>{folio}</span>
          </div>

          {/* Justification */}
          <div>
            <label
              htmlFor="justification"
              style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 8 }}
            >
              Justificación <span style={{ color: '#b91c1c' }}>*</span>
            </label>
            <select
              id="justification"
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                color: justification ? '#111827' : '#9ca3af',
                outline: 'none',
              }}
            >
              <option value="" disabled>Seleccionar motivo obligatorio…</option>
              {JUSTIFICATIONS.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          {/* Notes — required if "Otro" */}
          {(justification === 'Otro (especificar)' || justification !== '') && (
            <div>
              <label
                htmlFor="notes"
                style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 8 }}
              >
                Notas adicionales {justification === 'Otro (especificar)' && <span style={{ color: '#b91c1c' }}>*</span>}
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describa la situación con detalle suficiente para el registro de auditoría…"
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                style={{ border: '1px solid #d1d5db', background: '#fff', color: '#111827', outline: 'none', lineHeight: 1.5 }}
              />
              {justification === 'Otro (especificar)' && notes.trim().length > 0 && notes.trim().length <= 10 && (
                <p style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>Por favor ingrese al menos 10 caracteres.</p>
              )}
            </div>
          )}

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5"
              style={{ width: 16, height: 16, accentColor: '#b91c1c' }}
            />
            <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
              Confirmo que he revisado la evidencia documental y asumo la responsabilidad de esta conciliación en nombre del municipio.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}
        >
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: '#f1f5f9', color: '#374151', border: '1px solid #e2e8f0' }}
          >
            Cancelar
          </button>
          <button
            onClick={isValid ? onConfirm : undefined}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              background: isValid ? '#b91c1c' : '#fca5a5',
              color: '#fff',
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
            aria-disabled={!isValid}
          >
            Forzar Conciliación
          </button>
        </div>
      </div>
    </div>
  )
}
