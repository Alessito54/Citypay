import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ReconciliationScreen from './components/ReconciliationScreen'
import MobileApp from './components/mobile/MobileApp'
import MobileLogin from './components/mobile/MobileLogin'
import MobileLoading from './components/mobile/MobileLoading'
import MobileReports from './components/mobile/MobileReports'
import MobileNewReport from './components/mobile/MobileNewReport'

type View = 'desktop' | 'mobile' | 'login' | 'loading' | 'reports' | 'newreport'

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [view, setView] = useState<View>('desktop')

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f1f4f9]">
      {/* View toggle bar */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 100,
          display: 'flex',
          gap: 0,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          border: '1px solid #1a2f58',
        }}
      >
        {([
          { id: 'desktop', label: '🖥 Escritorio' },
          { id: 'mobile', label: '📱 Móvil' },
          { id: 'login', label: '🔐 Login' },
          { id: 'loading', label: '⏳ Carga' },
          { id: 'reports', label: '📝 Reportes' },
          { id: 'newreport', label: '➕ Nuevo reporte' },
        ] as { id: View; label: string }[]).map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: view === v.id ? '#2557a7' : '#0b1731',
              color: view === v.id ? '#fff' : '#6b9fe4',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s ease',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'desktop' ? (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
          <main className="flex-1 overflow-hidden flex flex-col min-w-0">
            <ReconciliationScreen />
          </main>
        </div>
      ) : view === 'login' ? (
        <div className="flex-1 overflow-auto">
          <MobileApp>
            <MobileLogin onLogin={() => setView('loading')} />
          </MobileApp>
        </div>
      ) : view === 'newreport' ? (
        <div className="flex-1 overflow-auto">
          <MobileApp>
            <MobileNewReport onBack={() => setView('reports')} onSent={() => setView('reports')} />
          </MobileApp>
        </div>
      ) : view === 'reports' ? (
        <div className="flex-1 overflow-auto">
          <MobileApp>
            <MobileReports />
          </MobileApp>
        </div>
      ) : view === 'loading' ? (
        <div className="flex-1 overflow-auto">
          <MobileApp>
            <MobileLoading onDone={() => setView('mobile')} />
          </MobileApp>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <MobileApp />
        </div>
      )}
    </div>
  )
}
