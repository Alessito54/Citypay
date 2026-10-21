interface Props {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { icon: '⊞', label: 'Dashboard', active: false },
  { icon: '↔', label: 'Conciliación', active: true },
  { icon: '📋', label: 'Trámites', active: false },
  { icon: '👤', label: 'Ciudadanos', active: false },
  { icon: '📊', label: 'Reportes', active: false },
  { icon: '🏛', label: 'Servicios', active: false },
  { icon: '⚙', label: 'Configuración', active: false },
]

export default function Sidebar({ collapsed, onToggle }: Props) {
  return (
    <aside
      className="flex flex-col shrink-0 transition-all duration-200"
      style={{
        width: collapsed ? 64 : 220,
        background: '#0b1731',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 32, height: 32, background: '#2557a7' }}
        >
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>C</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>CityPay</div>
            <div style={{ color: '#6b9fe4', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Admin Panel</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            style={{
              background: item.active ? 'rgba(37,87,167,0.35)' : 'transparent',
              borderLeft: item.active ? '3px solid #3b72cc' : '3px solid transparent',
              color: item.active ? '#a8c8f5' : '#8ba3c7',
              fontSize: 13.5,
              fontWeight: item.active ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 15, minWidth: 18, textAlign: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom user */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ width: 32, height: 32, background: '#163058', color: '#6b9fe4', fontFamily: 'var(--font-display)' }}
          >
            LM
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div style={{ color: '#daeafd', fontSize: 12.5, fontWeight: 600 }}>Laura Méndez</div>
              <div style={{ color: '#4d6fa3', fontSize: 11 }}>Supervisora Fiscal</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 border-t border-white/10 transition-colors hover:bg-white/5"
        style={{ color: '#4d6fa3' }}
        aria-label="Colapsar menú"
      >
        <span style={{ fontSize: 12 }}>{collapsed ? '▶' : '◀'}</span>
      </button>
    </aside>
  )
}
