import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Chip, CircularProgress } from '@mui/material'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from 'recharts'
import { createComparison, listComparisons, getPolicies, getComparison } from '../api'

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEV_CHIP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
}

const SEV_STYLE: Record<string, string> = {
  high: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800',
  medium: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
  low: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
}

const ROWS_PER_PAGE = 5

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function Comparisons() {
  const [policies, setPolicies] = useState<any[]>([])
  const [comparisons, setComparisons] = useState<any[]>([])
  const [selectedPolicyA, setSelectedPolicyA] = useState<number | ''>('')
  const [selectedPolicyB, setSelectedPolicyB] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [activeComparison, setActiveComparison] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historyPage, setHistoryPage] = useState(0)
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        getPolicies().catch(() => ({ data: [] })),
        listComparisons().catch(() => ({ data: [] })),
      ])
      const pList = pRes.data || []
      setPolicies(pList)
      setComparisons(cRes.data || [])
      if (pList.length >= 2) {
        setSelectedPolicyA(pList[0].id)
        setSelectedPolicyB(pList[1].id)
      }
    } catch (err) {
      console.error('Error loading comparison data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRunComparison = async () => {
    if (!selectedPolicyA || !selectedPolicyB) { setError('Selecione duas apólices para comparar.'); return }
    if (selectedPolicyA === selectedPolicyB) { setError('Selecione duas apólices diferentes.'); return }
    setComparing(true)
    setError(null)
    try {
      const res = await createComparison(Number(selectedPolicyA), Number(selectedPolicyB))
      const compId = res.data.id
      const detailRes = await getComparison(compId).catch(() => null)
      setActiveComparison(detailRes?.data ?? res.data)
      await fetchData()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao gerar comparação. Tente novamente.')
    } finally {
      setComparing(false)
    }
  }

  // ── Derived KPI metrics ────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const items = activeComparison?.items || []
    const high = items.filter((i: any) => i.severity === 'high').length
    const medium = items.filter((i: any) => i.severity === 'medium').length
    const low = items.filter((i: any) => i.severity === 'low').length
    return { total: items.length, high, medium, low }
  }, [activeComparison])

  // ── Chart: Radar coverage data (derived from real severity, no mocks) ────────
  const radarData = useMemo(() => {
    if (!activeComparison) return []
    const items: any[] = activeComparison.items || []
    // Severity → coverage score for Apólice B vs base A:
    // high gap = low score (30), medium = 62, low = 91
    const sevScore: Record<string, number> = { high: 30, medium: 62, low: 91 }
    return items.slice(0, 7).map((item: any) => ({
      subject: String(item.criterion || 'Critério').substring(0, 18),
      A: 100,
      B: sevScore[item.severity || 'low'] ?? 75,
    }))
  }, [activeComparison])

  // ── Chart: Severity delta bar chart ───────────────────────────────────────
  const barData = useMemo(() => [
    { name: 'Alto Risco', count: kpis.high, fill: '#ef4444' },
    { name: 'Médio Risco', count: kpis.medium, fill: '#f59e0b' },
    { name: 'Baixo Risco', count: kpis.low, fill: '#10b981' },
  ], [kpis])

  // ── History filter + pagination ────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return comparisons.filter((c) =>
      historySearch.trim() === '' ||
      `#${c.id}`.includes(historySearch) ||
      `${c.policy_a_id}`.includes(historySearch) ||
      `${c.policy_b_id}`.includes(historySearch) ||
      (c.summary || '').toLowerCase().includes(historySearch.toLowerCase())
    )
  }, [comparisons, historySearch])

  const paginatedHistory = useMemo(() => {
    return filteredHistory.slice(historyPage * ROWS_PER_PAGE, (historyPage + 1) * ROWS_PER_PAGE)
  }, [filteredHistory, historyPage])

  // ── Active comparison items filtered by severity ───────────────────────────
  const filteredItems = useMemo(() => {
    const items = activeComparison?.items || []
    if (severityFilter === 'ALL') return items
    return items.filter((i: any) => (i.severity || 'low') === severityFilter)
  }, [activeComparison, severityFilter])

  return (
    <div className="w-full pb-8 space-y-6">

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">
            Matriz de Comparação D&amp;O
          </h1>
          <span className="px-2 py-0.5 rounded bg-[#eff4ff] dark:bg-slate-800 text-xs font-semibold text-[#0051d5] dark:text-blue-400 font-['JetBrains_Mono'] border border-[#dce9ff] dark:border-slate-700">
            {comparisons.length} Benchmarks
          </span>
        </div>
        <p className="text-sm text-[#565e74] dark:text-slate-400 mt-1">
          Benchmark automatizado de termos, limites, retenções e sublimites entre dois contratos com IA.
        </p>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto material-symbols-outlined text-[16px] hover:opacity-70">close</button>
        </div>
      )}

      {/* ── Main Grid: Selector + Charts ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Benchmark Selector (xl: 8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          {/* Selector Panel */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#0b1c30] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0051d5]">compare</span>
              Selecionar Contratos para Benchmark
            </h2>

            <div className="grid grid-cols-5 gap-4 items-center">
              {/* Policy A */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#565e74] dark:text-slate-400">Apólice A (Base)</label>
                <select
                  value={selectedPolicyA}
                  onChange={(e) => setSelectedPolicyA(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0051d5] text-[#0b1c30] dark:text-white transition-colors"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.policy_number} — {p.insurer || 'Seguradora'}</option>
                  ))}
                </select>
              </div>

              {/* Swap icon */}
              <div className="flex justify-center items-center">
                <span className="w-10 h-10 rounded-full bg-[#eff4ff] dark:bg-slate-800 flex items-center justify-center text-[#0051d5] dark:text-blue-400 shadow-sm border border-[#dce9ff] dark:border-slate-700">
                  <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
                </span>
              </div>

              {/* Policy B */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#565e74] dark:text-slate-400">Apólice B (Comparada)</label>
                <select
                  value={selectedPolicyB}
                  onChange={(e) => setSelectedPolicyB(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0051d5] text-[#0b1c30] dark:text-white transition-colors"
                >
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.policy_number} — {p.insurer || 'Seguradora'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleRunComparison}
                disabled={comparing || loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0051d5] hover:bg-[#316bf3] disabled:opacity-50 text-white rounded-xl font-bold text-xs tracking-wider transition-all shadow-md shadow-[#0051d5]/20 active:scale-[0.98]"
              >
                {comparing
                  ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span> Executando PolicyComparisonAgent...</>
                  : <><span className="material-symbols-outlined text-[18px]">model_training</span> Executar Comparação com IA</>
                }
              </button>
            </div>
          </div>

          {/* Active Comparison Matrix */}
          {activeComparison && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border-l-4 border-l-[#0051d5] border border-[#e5eeff] dark:border-slate-800 p-6 shadow-sm space-y-4">
              {/* Header + Report Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5eeff] dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#0b1c30] dark:text-white">
                    Benchmark — Comparação #{activeComparison.id}
                  </h2>
                  <p className="text-xs text-[#565e74] dark:text-slate-400 mt-0.5">{activeComparison.summary}</p>
                </div>
                <Link
                  to={`/report/${activeComparison.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Gerar Relatório
                </Link>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total de Critérios', value: kpis.total, color: 'text-[#0051d5]', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'rule' },
                  { label: 'Alto Risco', value: kpis.high, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', icon: 'warning' },
                  { label: 'Médio Risco', value: kpis.medium, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'error_outline' },
                  { label: 'Baixo Risco', value: kpis.low, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'check_circle' },
                ].map((kpi) => (
                  <div key={kpi.label} className={`${kpi.bg} rounded-xl p-3 text-center border border-transparent`}>
                    <span className={`material-symbols-outlined text-[22px] ${kpi.color}`}>{kpi.icon}</span>
                    <p className={`text-xl font-bold ${kpi.color} leading-tight mt-1`}>{kpi.value}</p>
                    <p className="text-[10px] text-[#565e74] dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{kpi.label}</p>
                  </div>
                ))}
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center gap-1 border-b border-[#e5eeff] dark:border-slate-800">
                {['ALL', 'high', 'medium', 'low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${severityFilter === sev
                      ? 'border-[#0051d5] text-[#0051d5]'
                      : 'border-transparent text-[#45464d] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white'
                      }`}
                  >
                    {sev === 'ALL' ? 'Todos' : sev === 'high' ? '🔴 Alto' : sev === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                  </button>
                ))}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-xl border border-[#e5eeff] dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9ff] dark:bg-slate-800/60 border-b border-[#e5eeff] dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-[#565e74] dark:text-slate-400">
                      <th className="px-4 py-3">Critério Avaliado</th>
                      <th className="px-4 py-3">Apólice A</th>
                      <th className="px-4 py-3">Apólice B</th>
                      <th className="px-4 py-3">Impacto Delta</th>
                      <th className="px-4 py-3">Severidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeff] dark:divide-slate-800 text-xs">
                    {filteredItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#f0f4ff]/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#0b1c30] dark:text-white">{item.criterion}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 font-['JetBrains_Mono']">{item.value_a}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 font-['JetBrains_Mono']">{item.value_b}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-400">{item.impact || item.difference || '—'}</td>
                        <td className="px-4 py-3">
                          <Chip
                            label={(item.severity || 'low').toUpperCase()}
                            color={SEV_CHIP[item.severity || 'low'] ?? 'default'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '10px' }}
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                          Nenhum critério neste nível de severidade.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Analytics Sidebar (xl: 4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Chart 1: Radar Coverage */}
          {activeComparison && radarData.length > 0 && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">radar</span>
                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Cobertura Comparada</h3>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <PolarGrid stroke="#e5eeff" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[0, 100]} tickCount={4} />
                    <Radar name="Apólice A" dataKey="A" stroke="#0051d5" fill="#0051d5" fillOpacity={0.2} />
                    <Radar name="Apólice B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 2: Severity Bar */}
          {activeComparison && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">bar_chart</span>
                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Distribuição de Riscos</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Metric: Total comparisons */}
          <div className="bg-gradient-to-br from-[#0b1c30] to-[#0051d5] rounded-2xl p-5 text-white shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Total de Benchmarks</span>
              <span className="material-symbols-outlined text-[20px] text-blue-300">analytics</span>
            </div>
            <p className="text-3xl font-bold font-['JetBrains_Mono']">{comparisons.length}</p>
            <p className="text-[11px] text-blue-200">
              Comparações realizadas entre contratos D&amp;O na biblioteca de apólices.
            </p>
          </div>

          {/* Placeholder — no comparison yet */}
          {!activeComparison && (
            <div className="bg-[#f8f9ff] dark:bg-slate-800/50 rounded-2xl border border-dashed border-[#dce9ff] dark:border-slate-700 p-8 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#0051d5]/40">compare_arrows</span>
              <p className="text-sm font-semibold text-[#45464d] dark:text-slate-300">Execute uma comparação</p>
              <p className="text-xs text-slate-400">Os gráficos de análise aparecerão aqui após a comparação.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Historical Comparisons with Filter + Pagination ─────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-4">
        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5eeff] dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">history</span>
            <h2 className="text-base font-bold text-[#0b1c30] dark:text-white">
              Histórico de Comparações
              <span className="ml-2 text-xs font-semibold text-[#0051d5] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">{comparisons.length}</span>
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por ID ou resumo..."
              value={historySearch}
              onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(0) }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0051d5] text-[#0b1c30] dark:text-white"
            />
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="flex justify-center py-8"><CircularProgress size={28} /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5eeff] dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff] dark:bg-slate-800/60 border-b border-[#e5eeff] dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-[#565e74] dark:text-slate-400">
                  <th className="px-4 py-3 w-12">ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Data e Hora</th>
                  <th className="px-4 py-3">Apólice A (Base)</th>
                  <th className="px-4 py-3">Apólice B (Comparada)</th>
                  <th className="px-4 py-3">Resumo IA</th>
                  <th className="px-4 py-3 text-center">Critérios</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff] dark:divide-slate-800 text-xs">
                {paginatedHistory.map((cmp) => {
                  const pA = policies.find((p) => p.id === cmp.policy_a_id)
                  const pB = policies.find((p) => p.id === cmp.policy_b_id)
                  return (
                    <tr key={cmp.id} className="hover:bg-[#f0f4ff]/40 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400 font-bold">#{cmp.id}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono'] text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(cmp.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-['JetBrains_Mono'] font-bold text-[#0051d5] dark:text-blue-400 text-[11px]">
                            {pA?.policy_number || `#${cmp.policy_a_id}`}
                          </span>
                          <span className="text-[#565e74] dark:text-slate-400 text-[10px] truncate max-w-[140px]">
                            {pA?.insurer || 'Seguradora'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-['JetBrains_Mono'] font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            {pB?.policy_number || `#${cmp.policy_b_id}`}
                          </span>
                          <span className="text-[#565e74] dark:text-slate-400 text-[10px] truncate max-w-[140px]">
                            {pB?.insurer || 'Seguradora'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 max-w-xs truncate">{cmp.summary || 'Comparação gerada pela IA'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#0051d5] dark:text-blue-400 font-bold text-[10px] font-['JetBrains_Mono']">
                          {(cmp.items?.length ?? cmp.item_count ?? '—')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/report/${cmp.id}`}
                          className="px-3 py-1.5 rounded-lg border border-[#dce9ff] dark:border-slate-700 text-[#0051d5] dark:text-blue-400 hover:bg-[#0051d5] hover:text-white dark:hover:bg-blue-600 transition-all font-semibold text-[11px] flex items-center gap-1 justify-end"
                        >
                          <span className="material-symbols-outlined text-[14px]">description</span>
                          Ver Relatório
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {paginatedHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                      {comparisons.length === 0 ? 'Nenhuma comparação realizada ainda.' : 'Nenhum resultado para a busca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredHistory.length > ROWS_PER_PAGE && (
          <div className="flex items-center justify-between pt-2 text-xs text-[#565e74] dark:text-slate-400">
            <span>
              Mostrando <strong className="text-[#0b1c30] dark:text-white">{historyPage * ROWS_PER_PAGE + 1}</strong> a{' '}
              <strong className="text-[#0b1c30] dark:text-white">{Math.min((historyPage + 1) * ROWS_PER_PAGE, filteredHistory.length)}</strong> de{' '}
              <strong className="text-[#0b1c30] dark:text-white">{filteredHistory.length}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
              >&lt;</button>
              <span className="px-2 font-semibold text-[#0b1c30] dark:text-white">
                {historyPage + 1} / {Math.ceil(filteredHistory.length / ROWS_PER_PAGE)}
              </span>
              <button
                disabled={(historyPage + 1) * ROWS_PER_PAGE >= filteredHistory.length}
                onClick={() => setHistoryPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
              >&gt;</button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Comparison Processing Overlay Modal ───────────────────────────── */}
      {comparing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-[#e5eeff] dark:border-slate-700 p-8 w-full max-w-md mx-4 flex flex-col items-center gap-6">
            {/* Spinner */}
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#eff4ff] dark:border-slate-700 border-t-[#0051d5] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-[#0051d5] dark:text-blue-400 animate-pulse">model_training</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#0b1c30] dark:text-white">Comparação por IA em Andamento</h3>
              <p className="text-xs text-[#565e74] dark:text-slate-400 mt-1">PolicyComparisonAgent · LangGraph · Análise Semântica D&O</p>
            </div>

            {/* Steps */}
            <div className="w-full flex flex-col gap-2">
              {[
                { label: 'Carregando cláusulas das duas apólices' },
                { label: 'Vectorizando critérios de benchmark' },
                { label: 'Detectando deltaos de limite, franquia e cobertura' },
                { label: 'Classificando severidade e gerando matriz' },
              ].map(({ label }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0051d5] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 animate-pulse">
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-[#0b1c30] dark:text-white">{label}</span>
                </div>
              ))}
            </div>

            {/* Indeterminate bar */}
            <div className="w-full h-1.5 bg-[#eff4ff] dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0051d5] to-[#316bf3] rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-3/4" />
            </div>

            {/* AI Metadata */}
            <div className="w-full grid grid-cols-3 gap-2 text-[10px] text-center">
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">Agente</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">PolicyAgent</span>
              </div>
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">Orquestrador</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">LangGraph</span>
              </div>
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">Critérios</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">Semânticos</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}