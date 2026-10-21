import { useState, useMemo } from 'react'
import { transactions, type Transaction, type Status } from '../data/transactions'
import KpiCard from './KpiCard'
import StatusBadge from './StatusBadge'
import DetailPanel from './DetailPanel'

type ServiceFilter = 'todos' | 'predial' | 'agua' | 'multas'
type StatusFilter = 'todos' | Status

const fmt = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return fmt(n)
}

const serviceLabel: Record<string, string> = {
  predial: 'Predial',
  agua: 'Agua',
  multas: 'Multas',
}

export default function ReconciliationScreen() {
  const [dateFrom, setDateFrom] = useState('2024-09-26')
  const [dateTo, setDateTo] = useState('2024-09-28')
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (serviceFilter !== 'todos' && tx.servicio !== serviceFilter) return false
      if (statusFilter !== 'todos' && tx.estado !== statusFilter) return false
      if (tx.fecha < dateFrom || tx.fecha > dateTo) return false
      return true
    })
  }, [serviceFilter, statusFilter, dateFrom, dateTo])

  const totalSistema = filtered.reduce((s, t) => s + t.montoSistema, 0)
  const totalBanco = filtered.reduce((s, t) => s + t.montoBanco, 0)
  const diferencia = totalBanco - totalSistema

  const selected = filtered.find(t => t.id === selectedId) ?? null

  const handleRowClick = (tx: Transaction) => {
    setSelectedId(prev => prev === tx.id ? null : tx.id)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header
        className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}
      >
        <div>
          <h1
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#0b1731', letterSpacing: '-0.02em' }}
          >
            Conciliación de Pagos
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Panel de supervisión y auditoría — Municipio de Guadalajara
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#f1f4f9', color: '#374151', border: '1px solid #e2e8f0' }}
          >
            <span>⬇</span> Exportar CSV
          </button>
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: '#2557a7', color: '#fff' }}
          >
            <span>↻</span> Sincronizar Banco
          </button>
        </div>
      </header>

      {/* Filters */}
      <div
        className="shrink-0 px-6 py-3 flex flex-wrap items-center gap-3"
        style={{ background: '#f8faff', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Desde:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Hasta:</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ border: '1px solid #d1d5db', background: '#fff', color: '#111827', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
        </div>

        <div className="h-5" style={{ borderLeft: '1px solid #cbd5e1' }} />

        {/* Service filter */}
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Servicio:</span>
          {(['todos', 'predial', 'agua', 'multas'] as ServiceFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize"
              style={{
                background: serviceFilter === s ? '#0b1731' : '#fff',
                color: serviceFilter === s ? '#a8c8f5' : '#374151',
                border: `1px solid ${serviceFilter === s ? '#163058' : '#d1d5db'}`,
              }}
            >
              {s === 'todos' ? 'Todos' : serviceLabel[s]}
            </button>
          ))}
        </div>

        <div className="h-5" style={{ borderLeft: '1px solid #cbd5e1' }} />

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Estado:</span>
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'conciliado', label: 'Cuadrados' },
            { value: 'discrepancia', label: 'Con Diferencia' },
            { value: 'pendiente', label: 'Pendientes' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value as StatusFilter)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: statusFilter === opt.value ? '#0b1731' : '#fff',
                color: statusFilter === opt.value ? '#a8c8f5' : '#374151',
                border: `1px solid ${statusFilter === opt.value ? '#163058' : '#d1d5db'}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="shrink-0 grid grid-cols-3 gap-4 px-6 py-4">
        <KpiCard
          label="Total Cobrado en Sistema"
          value={fmtShort(totalSistema)}
          subtext={`${fmt(totalSistema)} · vs. ayer +2.4%`}
          trend="up"
          accent="#2557a7"
          icon="🏛"
        />
        <KpiCard
          label="Total Acreditado en Banco"
          value={fmtShort(totalBanco)}
          subtext={`${fmt(totalBanco)} · vs. ayer +1.8%`}
          trend="up"
          accent="#0f766e"
          icon="🏦"
        />
        <KpiCard
          label="Diferencia / Descuadre"
          value={fmtShort(Math.abs(diferencia))}
          subtext={`${diferencia >= 0 ? 'Superávit' : 'Déficit'} de ${fmt(Math.abs(diferencia))} · ${filtered.filter(t => t.estado === 'discrepancia').length} registros afectados`}
          trend={diferencia === 0 ? 'neutral' : 'down'}
          accent={diferencia === 0 ? '#0f766e' : '#b91c1c'}
          icon={diferencia === 0 ? '✓' : '⚠'}
        />
      </div>

      {/* Table + Panel */}
      <div className="flex flex-1 overflow-hidden px-6 pb-6 gap-4 min-h-0">
        {/* Table */}
        <div
          className="flex flex-col flex-1 rounded-xl overflow-hidden min-w-0"
          style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {/* Table header */}
          <div
            className="shrink-0 overflow-hidden"
            style={{ borderBottom: '1px solid #e2e8f0' }}
          >
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['Folio', 'Ref. Bancaria', 'Concepto', 'Servicio', 'Monto Sistema', 'Monto Banco', 'Estado'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#64748b',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: '#f8faff',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16" style={{ color: '#94a3b8', fontSize: 14 }}>
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filtered.map(tx => {
                    const isSelected = selectedId === tx.id
                    return (
                      <tr
                        key={tx.id}
                        className={`tr-row cursor-pointer transition-colors ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleRowClick(tx)}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                        aria-selected={isSelected}
                      >
                        <td className="px-4 py-3">
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11.5,
                              color: '#2557a7',
                              fontWeight: 500,
                            }}
                          >
                            {tx.folio}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11.5,
                              color: tx.referenciaBancaria === '—' ? '#cbd5e1' : '#374151',
                            }}
                          >
                            {tx.referenciaBancaria}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontSize: 12.5, color: '#0b1731', fontWeight: 500, lineHeight: 1.3 }}>
                            {tx.concepto}
                          </span>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            {tx.ciudadano}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-semibold capitalize"
                            style={{
                              background: tx.servicio === 'predial' ? '#eff6ff' : tx.servicio === 'agua' ? '#f0fdfa' : '#fdf4ff',
                              color: tx.servicio === 'predial' ? '#1d4ed8' : tx.servicio === 'agua' ? '#0f766e' : '#7e22ce',
                            }}
                          >
                            {serviceLabel[tx.servicio]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#111827', fontWeight: 500 }}>
                            {fmt(tx.montoSistema)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              color: tx.montoBanco === 0
                                ? '#cbd5e1'
                                : tx.montoBanco !== tx.montoSistema
                                ? '#b91c1c'
                                : '#111827',
                              fontWeight: 500,
                            }}
                          >
                            {tx.montoBanco === 0 ? '—' : fmt(tx.montoBanco)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tx.estado} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div
            className="shrink-0 px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid #e2e8f0', background: '#f8faff' }}
          >
            <div className="flex gap-4">
              {[
                { label: 'Conciliados', count: filtered.filter(t => t.estado === 'conciliado').length, color: '#16a34a' },
                { label: 'Discrepancias', count: filtered.filter(t => t.estado === 'discrepancia').length, color: '#dc2626' },
                { label: 'Pendientes', count: filtered.filter(t => t.estado === 'pendiente').length, color: '#d97706' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="rounded-full" style={{ width: 8, height: 8, background: s.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>{s.label}: <b style={{ color: '#374151' }}>{s.count}</b></span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Última sincronización: hoy 08:47 hrs
            </span>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="shrink-0 rounded-xl overflow-hidden"
            style={{ width: 340, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <DetailPanel tx={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}

        {/* Empty state hint when no selection */}
        {!selected && filtered.length > 0 && (
          <div
            className="shrink-0 rounded-xl flex flex-col items-center justify-center gap-3"
            style={{ width: 280, border: '2px dashed #e2e8f0', background: '#fafbfc' }}
          >
            <div style={{ fontSize: 28 }} aria-hidden="true">←</div>
            <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', maxWidth: 180, lineHeight: 1.5 }}>
              Seleccione un registro para ver el detalle y las acciones disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
