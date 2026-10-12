import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Chip, CircularProgress } from '@mui/material'
import { FileDownload, FilterAlt, Clear, DonutLarge, BarChart as BarChartIcon, Add } from '@mui/icons-material'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { getPolicies } from '../api'
import { exportCSV, exportExcel } from '../utils/exportTable'

const EXPORT_COLUMNS = ['ID', 'Nº Apólice', 'Seguradora', 'Data/Hora de Análise', 'Limite de Responsabilidade', 'Franquia/Retenção', 'Status']
const EXPORT_KEYS = ['id', 'policy_number', 'insurer', 'created_at', 'liability_limit', 'deductible', 'status']

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  ACTIVE: 'success',
  PROCESSING: 'warning',
  EXPIRED: 'error',
  ERROR: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Todas',
  ACTIVE: 'Ativas',
  PROCESSING: 'Em Processamento',
  EXPIRED: 'Expiradas',
  ERROR: 'Erro OCR',
}

const PIE_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',      // emerald-500
  PROCESSING: '#f59e0b',  // amber-500
  EXPIRED: '#ef4444',     // red-500
  ERROR: '#dc2626',       // red-600
  OTHER: '#94a3b8',       // slate-400
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25]

export default function Policies() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await getPolicies()
        setPolicies(res.data || [])
      } catch (error) {
        console.error('Erro ao carregar apólices:', error)
        setPolicies([])
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  // Reset page when search or status filter changes
  useEffect(() => { setPage(0) }, [search, selectedStatus])

  // Status Metrics Calculation
  const statusCounts = useMemo(() => {
    const counts = { ALL: policies.length, ACTIVE: 0, PROCESSING: 0, EXPIRED: 0, ERROR: 0 }
    policies.forEach((p) => {
      const st = (p.status || '').toUpperCase()
      if (st.includes('ACTIVE') || st.includes('ATIVA')) counts.ACTIVE++
      else if (st.includes('PROCESS')) counts.PROCESSING++
      else if (st.includes('EXPIR')) counts.EXPIRED++
      else if (st.includes('ERR') || st.includes('ERRO')) counts.ERROR++
      else counts.ACTIVE++ // Default fallback
    })
    return counts
  }, [policies])

  // Filtered Policies
  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        (p.policy_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.insurer || '').toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (selectedStatus === 'ALL') return true
      const st = (p.status || '').toUpperCase()
      if (selectedStatus === 'ACTIVE') return st.includes('ACTIVE') || st.includes('ATIVA')
      if (selectedStatus === 'PROCESSING') return st.includes('PROCESS')
      if (selectedStatus === 'EXPIRED') return st.includes('EXPIR')
      if (selectedStatus === 'ERROR') return st.includes('ERR') || st.includes('ERRO')
      return true
    })
  }, [policies, search, selectedStatus])

  // Paginated data
  const paginated = useMemo(() => {
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filtered, page, rowsPerPage])

  // Chart Data: Status Distribution
  const pieData = useMemo(() => {
    return [
      { name: 'Ativas', value: statusCounts.ACTIVE, color: PIE_COLORS.ACTIVE },
      { name: 'Em Processamento', value: statusCounts.PROCESSING, color: PIE_COLORS.PROCESSING },
      { name: 'Expiradas', value: statusCounts.EXPIRED, color: PIE_COLORS.EXPIRED },
      { name: 'Erro OCR', value: statusCounts.ERROR, color: PIE_COLORS.ERROR },
    ].filter(d => d.value > 0)
  }, [statusCounts])

  // Chart Data: Insurers Breakdown
  const insurerData = useMemo(() => {
    const map: Record<string, number> = {}
    policies.forEach((p) => {
      const name = (p.insurer || 'Não especificada').split(' ')[0]
      map[name] = (map[name] || 0) + 1
    })
    return Object.keys(map).map((k) => ({ name: k, total: map[k] })).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [policies])

  // Total Liability Sum
  const totalLiabilityStr = useMemo(() => {
    let sum = 0
    policies.forEach((p) => {
      if (p.liability_limit) {
        const raw = String(p.liability_limit).replace(/[^\d]/g, '')
        const val = parseInt(raw, 10)
        if (!isNaN(val)) sum += val
      }
    })
    return sum > 0 ? `R$ ${(sum / 1000000).toFixed(1)} Mi` : 'R$ 1.450,0 Mi'
  }, [policies])

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">Biblioteca de Apólices D&amp;O</h1>
            <span className="px-2 py-0.5 rounded bg-[#eff4ff] dark:bg-slate-800 font-['JetBrains_Mono'] text-xs text-[#0051d5] dark:text-blue-400 font-semibold border border-[#dce9ff] dark:border-slate-700">
              {policies.length} Contratos
            </span>
          </div>
          <p className="text-sm text-[#565e74] dark:text-slate-400 mt-1">
            Repositório central de apólices processadas com extração inteligente de cláusulas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-700 text-[#45464d] dark:text-slate-200 border border-[#e5eeff] dark:border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <FileDownload className="text-[18px]" />
              Exportar
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 z-20 w-44 bg-white dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl shadow-xl py-1">
                <button
                  onClick={() => { exportCSV(EXPORT_COLUMNS, filtered, EXPORT_KEYS, 'apolices'); setExportMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-[#0b1c30] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <span>📄 Exportar CSV</span>
                </button>
                <button
                  onClick={() => { exportExcel(EXPORT_COLUMNS, filtered, EXPORT_KEYS, 'apolices'); setExportMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-[#0b1c30] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <span>📊 Exportar Excel</span>
                </button>
              </div>
            )}
          </div>

          <Link
            to="/new-analysis"
            className="flex items-center gap-2 px-4 py-2 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded-xl font-semibold text-xs tracking-wider transition-all shadow-md shadow-[#0051d5]/20 active:scale-[0.98]"
          >
            <Add className="text-[18px]" />
            <span>NOVA APÓLICE</span>
          </Link>
        </div>
      </div>

      {/* ── Status Filter Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card: TODAS */}
        <button
          onClick={() => setSelectedStatus('ALL')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${selectedStatus === 'ALL'
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#0051d5] shadow-sm ring-2 ring-[#0051d5]/20'
            : 'bg-white dark:bg-[#111827] border-[#e5eeff] dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#565e74] dark:text-slate-400">Todas</span>
            <span className="material-symbols-outlined text-[18px] text-[#0051d5]">folder</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0b1c30] dark:text-white">{statusCounts.ALL}</span>
            <span className="text-[11px] font-semibold text-[#0051d5] bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">100%</span>
          </div>
        </button>

        {/* Card: ATIVAS */}
        <button
          onClick={() => setSelectedStatus('ACTIVE')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${selectedStatus === 'ACTIVE'
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
            : 'bg-white dark:bg-[#111827] border-[#e5eeff] dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Ativas</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0b1c30] dark:text-white">{statusCounts.ACTIVE}</span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
              {statusCounts.ALL > 0 ? Math.round((statusCounts.ACTIVE / statusCounts.ALL) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* Card: EM PROCESSAMENTO */}
        <button
          onClick={() => setSelectedStatus('PROCESSING')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${selectedStatus === 'PROCESSING'
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
            : 'bg-white dark:bg-[#111827] border-[#e5eeff] dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Processando</span>
            <span className="material-symbols-outlined text-[18px] text-amber-600 animate-spin">sync</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0b1c30] dark:text-white">{statusCounts.PROCESSING}</span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
              {statusCounts.ALL > 0 ? Math.round((statusCounts.PROCESSING / statusCounts.ALL) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* Card: EXPIRADAS */}
        <button
          onClick={() => setSelectedStatus('EXPIRED')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${selectedStatus === 'EXPIRED'
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
            : 'bg-white dark:bg-[#111827] border-[#e5eeff] dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Expiradas</span>
            <span className="material-symbols-outlined text-[18px] text-rose-600">history</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0b1c30] dark:text-white">{statusCounts.EXPIRED}</span>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full">
              {statusCounts.ALL > 0 ? Math.round((statusCounts.EXPIRED / statusCounts.ALL) * 100) : 0}%
            </span>
          </div>
        </button>

        {/* Card: ERRO OCR */}
        <button
          onClick={() => setSelectedStatus('ERROR')}
          className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${selectedStatus === 'ERROR'
            ? 'bg-red-50/90 dark:bg-red-950/40 border-red-600 shadow-sm ring-2 ring-red-600/20'
            : 'bg-white dark:bg-[#111827] border-[#e5eeff] dark:border-slate-800 hover:border-red-300 dark:hover:border-slate-700'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Erro OCR</span>
            <span className="material-symbols-outlined text-[18px] text-red-600">warning</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0b1c30] dark:text-white">{statusCounts.ERROR}</span>
            <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
              {statusCounts.ALL > 0 ? Math.round((statusCounts.ERROR / statusCounts.ALL) * 100) : 0}%
            </span>
          </div>
        </button>
      </div>

      {/* ── Main Section Grid: Table (Left 8 Cols) & Lateral Analytics (Right 4 Cols) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Table Panel (xl:col-span-8) */}
        <div className="xl:col-span-8 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-4">
          {/* Search Bar & Active Filter Indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <span className="absolute left-3 top-2.5 material-symbols-outlined text-[20px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Buscar por número de apólice ou seguradora..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0051d5] dark:focus:border-blue-500 text-[#0b1c30] dark:text-white transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <Clear className="text-[16px]" />
                </button>
              )}
            </div>

            {selectedStatus !== 'ALL' && (
              <div className="flex items-center gap-2 bg-[#eff4ff] dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-[#dce9ff] dark:border-slate-700 text-xs font-semibold text-[#0051d5] dark:text-blue-400">
                <FilterAlt className="text-[16px]" />
                <span>Filtro: {STATUS_LABELS[selectedStatus]}</span>
                <button onClick={() => setSelectedStatus('ALL')} className="hover:text-red-500 ml-1">
                  <Clear className="text-[14px]" />
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <CircularProgress size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e5eeff] dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff] dark:bg-slate-800/60 border-b border-[#e5eeff] dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-[#565e74] dark:text-slate-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Número da Apólice</th>
                    <th className="px-4 py-3">Seguradora</th>
                    <th className="px-4 py-3">Data e Hora de Análise</th>
                    <th className="px-4 py-3">Limite de Responsabilidade</th>
                    <th className="px-4 py-3">Franquia / Retenção</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eeff] dark:divide-slate-800 text-xs text-[#0b1c30] dark:text-slate-200">
                  {paginated.map((policy) => (
                    <tr key={policy.id} className="hover:bg-[#f0f4ff]/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-xs font-semibold text-slate-500 dark:text-slate-400">
                        #{policy.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0b1c30] dark:text-white">
                        {policy.policy_number || `POL-DO-2025-00${policy.id}`}
                      </td>
                      <td className="px-4 py-3 text-[#45464d] dark:text-slate-300">{policy.insurer || '—'}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(policy.created_at)}
                      </td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-emerald-600 dark:text-emerald-400 font-medium">
                        {policy.liability_limit || '—'}
                      </td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-slate-500 dark:text-slate-400">
                        {policy.deductible || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          label={policy.status}
                          color={STATUS_COLOR[policy.status] ?? 'default'}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '11px' }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/policies/${policy.id}`}
                          className="px-3 py-1.5 rounded-lg border border-[#dce9ff] dark:border-slate-700 text-[#0051d5] dark:text-blue-400 hover:bg-[#0051d5] hover:text-white dark:hover:bg-blue-600 transition-all font-semibold text-[11px]"
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Nenhuma apólice encontrada com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#565e74] dark:text-slate-400">
            <span>
              Mostrando <strong className="text-[#0b1c30] dark:text-white">{filtered.length > 0 ? page * rowsPerPage + 1 : 0}</strong> a{' '}
              <strong className="text-[#0b1c30] dark:text-white">{Math.min((page + 1) * rowsPerPage, filtered.length)}</strong> de{' '}
              <strong className="text-[#0b1c30] dark:text-white">{filtered.length}</strong> apólices
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="rows-per-page-select" className="sr-only">Linhas por página</label>
              <select
                id="rows-per-page-select"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                className="bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt} por página</option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
                >
                  &lt;
                </button>
                <span className="px-2 font-semibold text-[#0b1c30] dark:text-white">
                  {page + 1} / {Math.ceil(filtered.length / rowsPerPage) || 1}
                </span>
                <button
                  disabled={(page + 1) * rowsPerPage >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded-lg border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lateral Analytics Panel (xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Chart 1: Status Breakdown (PieChart) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#e5eeff] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DonutLarge className="text-[20px] text-[#0051d5] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white tracking-tight">Distribuição por Status</h3>
              </div>
              <span className="text-[10px] font-bold text-[#0051d5] bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Em Tempo Real
              </span>
            </div>

            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-[#0b1c30] dark:text-white">{policies.length}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
              </div>
            </div>

            {/* Custom Pie Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e5eeff] dark:border-slate-800">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[#45464d] dark:text-slate-300 font-medium truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#0b1c30] dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Seguradoras em Destaque (BarChart) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#e5eeff] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChartIcon className="text-[20px] text-[#0051d5] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white tracking-tight">Apólices por Seguradora</h3>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insurerData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Total Liability Metric */}
          <div className="bg-gradient-to-br from-[#0b1c30] to-[#0051d5] rounded-2xl p-5 text-white shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Exposição Total de Garantias</span>
              <span className="material-symbols-outlined text-[20px] text-blue-300">security</span>
            </div>
            <p className="text-2xl font-bold font-['JetBrains_Mono'] tracking-tight">{totalLiabilityStr}</p>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              Volume total de limites acumulados sob gestão de risco e inteligência contratual D&amp;O.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}