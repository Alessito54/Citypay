import type { Status } from '../data/transactions'

const config: Record<Status, { label: string; dot: string; bg: string; text: string; border: string }> = {
  conciliado: {
    label: 'Conciliado',
    dot: '#16a34a',
    bg: '#f0fdf4',
    text: '#15803d',
    border: '#bbf7d0',
  },
  discrepancia: {
    label: 'Discrepancia',
    dot: '#dc2626',
    bg: '#fff1f1',
    text: '#b91c1c',
    border: '#fecaca',
  },
  pendiente: {
    label: 'Pendiente',
    dot: '#d97706',
    bg: '#fffbeb',
    text: '#b45309',
    border: '#fde68a',
  },
}

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      aria-label={`Estado: ${c.label}`}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 6, height: 6, background: c.dot }}
        aria-hidden="true"
      />
      {c.label}
    </span>
  )
}
