interface Props {
  label: string
  value: string
  subtext: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: string
  icon: string
}

const trendColor = { up: '#16a34a', down: '#dc2626', neutral: '#64748b' }
const trendIcon = { up: '↑', down: '↓', neutral: '→' }

export default function KpiCard({ label, value, subtext, trend = 'neutral', accent = '#2557a7', icon }: Props) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-5"
      style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start justify-between">
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, background: `${accent}14`, fontSize: 16 }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 26,
            color: '#0b1731',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span style={{ color: trendColor[trend], fontSize: 11, fontWeight: 700 }}>{trendIcon[trend]}</span>
        <span style={{ fontSize: 11.5, color: '#64748b' }}>{subtext}</span>
      </div>
    </div>
  )
}
