import { useState, useEffect } from 'react'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

const REASONS = [
  'Confirmación bancaria recibida por correo',
  'Error tipográfico en referencia del ciudadano',
  'Cargo por comisión bancaria pendiente',
  'Instrucción de tesorería municipal',
  'Otro motivo (especificar)',
]

export default function MobileForceModal({ onConfirm, onCancel }: Props) {
  const [visible, setVisible] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [checked, setChecked] = useState(false)

  const needsNotes = reason === 'Otro motivo (especificar)'
  const notesOk    = !needsNotes || notes.trim().length > 10
  const canConfirm = reason !== '' && checked && notesOk

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const handleCancel = () => { setVisible(false); setTimeout(onCancel, 220) }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div
        onClick={handleCancel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.6)', opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="force-title"
        style={{
          position: 'relative', background: '#fff', borderRadius: '24px 24px 0 0',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.26s cubic-bezier(0.34, 1.06, 0.64, 1)',
          maxHeight: '92%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
          <div style={{ width: 40, height: 4, background: '#E8ECF2', borderRadius: 2 }} />
        </div>

        {/* Alert banner — matches "pago fallido" red row styling */}
        <div style={{ margin: '12px 18px 0', background: '#EEF4FF', borderRadius: 14, padding: '12px 14px', border: '1px solid #D6E4FA', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#D6E4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <div>
            <h2 id="force-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#1B3FA0', lineHeight: 1.2 }}>
              Confirmar conciliación forzada
            </h2>
            <p style={{ fontSize: 12, color: '#3B6ED4', marginTop: 4, lineHeight: 1.4 }}>
              Esta acción es permanente y quedará en el registro de auditoría.
            </p>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px' }}>

          {/* Reason label */}
          <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
            Motivo de conciliación manual <span style={{ color: '#3B6ED4' }}>*</span>
          </p>

          {/* Radio-style reason list — matches the services accordion list style */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #F0F2F5', marginBottom: 14 }}>
            {REASONS.map((r, i) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 14px',
                  borderBottom: i < REASONS.length - 1 ? '1px solid #F5F7FA' : 'none',
                  background: reason === r ? '#F0F5FF' : 'transparent',
                  border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)',
                  transition: 'background 0.1s ease',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: reason === r ? '6px solid #1B3FA0' : '2px solid #CBD5E1',
                  background: '#fff',
                  transition: 'all 0.1s ease',
                }} />
                <span style={{ fontSize: 13, color: reason === r ? '#1B3FA0' : '#374151', fontWeight: reason === r ? 600 : 400 }}>{r}</span>
              </button>
            ))}
          </div>

          {/* Notes field */}
          {reason !== '' && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>
                Notas adicionales {needsNotes && <span style={{ color: '#3B6ED4' }}>*</span>}
              </p>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describa la situación para el historial de auditoría…"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid #E8ECF2', background: '#F8FAFF',
                  fontSize: 13, color: '#1a1a2e', resize: 'none', outline: 'none',
                  lineHeight: 1.5, fontFamily: 'var(--font-sans)',
                }}
              />
              {needsNotes && notes.trim().length > 0 && notes.trim().length <= 10 && (
                <p style={{ fontSize: 11, color: '#3B6ED4', marginTop: 4 }}>Mínimo 10 caracteres requeridos.</p>
              )}
            </div>
          )}

          {/* Confirmation checkbox — styled as a card, matches "Pago fácil y seguro" promo card style */}
          <label
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 14px', borderRadius: 14, background: '#F8FAFF', border: '1px solid #E3EAFC', cursor: 'pointer' }}
          >
            <div
              onClick={() => setChecked(p => !p)}
              style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: checked ? 'none' : '2px solid #CBD5E1',
                background: checked ? '#1B3FA0' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.12s ease',
              }}
            >
              {checked && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5 }}>
              Confirmo que revisé la documentación de respaldo y asumo responsabilidad por esta operación.
            </span>
          </label>
        </div>

        {/* Action buttons — matching CityPay button style */}
        <div style={{ padding: '14px 18px 24px', borderTop: '1px solid #F5F7FA', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button
            onClick={canConfirm ? onConfirm : undefined}
            style={{
              width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: canConfirm ? '#1B3FA0' : '#D6E4FA',
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)', transition: 'background 0.15s ease',
            }}
            aria-disabled={!canConfirm}
          >
            Confirmar Conciliación Forzada
          </button>
          <button
            onClick={handleCancel}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              border: '1.5px solid #E8ECF2', background: '#fff',
              color: '#374151', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
