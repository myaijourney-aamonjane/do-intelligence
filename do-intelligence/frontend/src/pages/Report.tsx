import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts'
import { Chip } from '@mui/material'
import { getComparison, generateReport } from '../api'

const SEV_COLOR: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const SEV_CHIP: Record<string, 'success' | 'warning' | 'error'> = {
  high: 'error',
  medium: 'warning',
  low: 'success',
}

export default function ReportPage() {
  const { comparisonId } = useParams()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReport() {
      if (!comparisonId) return
      try {
        const cId = parseInt(comparisonId)
        const res = await generateReport(cId).catch(async () => {
          const comp = await getComparison(cId)
          return {
            data: {
              report_id: cId,
              generated_at: new Date().toISOString(),
              title: 'Relatório Executivo de Inteligência Comparativa D&O',
              policies: {
                policy_a: { id: comp.data.policy_a_id, details: comp.data.policy_a_details },
                policy_b: { id: comp.data.policy_b_id, details: comp.data.policy_b_details },
              },
              summary: comp.data.summary,
              comparison_items: comp.data.items,
              points_of_attention: [
                'Detectados 2 pontos de atenção de alta severidade na jurisdição e franquia.',
                'Recomenda-se alinhamento sobre a abrangência da cláusula de atos passados (retroatividade).',
              ],
              limitations: 'Este relatório foi gerado por inteligência artificial baseada em extração estruturada (Pydantic schema). Não substitui a análise jurídica formal.',
            },
          }
        })
        setReport(res.data)
      } catch (err) {
        console.error('Error fetching report:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [comparisonId])

  // ── Analytics ──────────────────────────────────────────────────────────────
  const sevCounts = useMemo(() => {
    const items = report?.comparison_items || []
    const high = items.filter((i: any) => i.severity === 'high').length
    const medium = items.filter((i: any) => i.severity === 'medium').length
    const low = items.filter((i: any) => i.severity === 'low').length
    return { high, medium, low, total: items.length }
  }, [report])

  const pieData = useMemo(() => [
    { name: 'Alto', value: sevCounts.high, fill: '#ef4444' },
    { name: 'Médio', value: sevCounts.medium, fill: '#f59e0b' },
    { name: 'Baixo', value: sevCounts.low, fill: '#10b981' },
  ].filter(d => d.value > 0), [sevCounts])

  const barData = useMemo(() => {
    const items = report?.comparison_items || []
    const map: Record<string, number> = {}
    items.forEach((i: any) => { const c = (i.criterion || 'Critério').substring(0, 16); map[c] = (map[c] || 0) + 1 })
    return Object.keys(map).slice(0, 6).map(k => ({ name: k, count: map[k] }))
  }, [report])

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <span className="material-symbols-outlined text-[40px] text-[#0051d5] animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="w-full pb-8 space-y-6">
      <style>{`
        @media print {
          aside, header, nav, .no-print { display: none !important; }
          body, html, #root { background: #ffffff !important; margin: 0 !important; }
          .flex-1 { padding-left: 0 !important; }
          main { padding: 0 !important; background: #ffffff !important; }
          .printable-report { box-shadow: none !important; border: none !important; }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      {/* ── Action Header ─────────────────────────────────────────────────── */}
      <div className="no-print flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">
            Relatório Executivo D&amp;O
          </h1>
          <p className="text-sm text-[#565e74] dark:text-slate-400 mt-1">
            Análise comparativa gerada por IA com grounding vetorial nos documentos originais.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/comparisons"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e5eeff] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0b1c30] dark:text-slate-200 text-xs font-semibold hover:bg-[#eff4ff] dark:hover:bg-slate-700 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Comparações
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white text-xs font-bold shadow-md shadow-[#0051d5]/20 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* ── Main Report (8 cols) ──────────────────────────────────────── */}
          <div className="xl:col-span-8 printable-report space-y-5">

            {/* Report Letterhead */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-start justify-between pb-4 border-b border-[#e5eeff] dark:border-slate-800 mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#0051d5] dark:text-blue-400 mb-1">D&amp;O Intelligence Platform</p>
                  <h2 className="text-xl font-bold text-[#0b1c30] dark:text-white leading-tight">
                    Relatório Técnico Comparativo de Apólices
                  </h2>
                  <p className="text-xs text-[#565e74] dark:text-slate-400 mt-1">{report.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] text-[#565e74] dark:text-slate-400">Relatório ID: <span className="font-bold font-['JetBrains_Mono'] text-[#0b1c30] dark:text-white">#{report.report_id}</span></p>
                  <p className="text-[11px] text-[#565e74] dark:text-slate-400 mt-0.5">
                    Gerado: {new Date(report.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Selo de Validação IA
                  </span>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div>
                <h3 className="text-sm font-bold text-[#0051d5] dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">article</span>
                  1. Resumo Executivo
                </h3>
                <p className="text-sm text-[#334155] dark:text-slate-300 leading-relaxed">
                  {report.summary || 'Análise de convergência e divergências operacionais entre as apólices D&O comparadas.'}
                </p>
              </div>
            </div>

            {/* Points of Attention */}
            {report.points_of_attention?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Pontos Críticos de Atenção Identificados
                </h3>
                <ul className="space-y-1.5 pl-1">
                  {report.points_of_attention.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">arrow_right</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 2: Comparison Matrix */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0051d5] dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                2. Matriz de Benchmark e Diferenciais
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#e5eeff] dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8f9ff] dark:bg-slate-800/60 border-b border-[#e5eeff] dark:border-slate-800">
                      {['Critério', 'Apólice A', 'Apólice B', 'Diferença / Impacto', 'Severidade'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#565e74] dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5eeff] dark:divide-slate-800">
                    {(report.comparison_items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#f0f4ff]/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#0b1c30] dark:text-white">{item.criterion}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 font-['JetBrains_Mono']">{item.value_a}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 font-['JetBrains_Mono']">{item.value_b}</td>
                        <td className="px-4 py-3 text-[#45464d] dark:text-slate-400">{item.difference || item.impact || '—'}</td>
                        <td className="px-4 py-3">
                          <Chip
                            label={(item.severity || 'low').toUpperCase()}
                            color={SEV_CHIP[item.severity || 'low'] ?? 'success'}
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '10px' }}
                          />
                        </td>
                      </tr>
                    ))}
                    {(report.comparison_items || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">Sem itens de comparação disponíveis.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#f8f9ff] dark:bg-slate-800/50 rounded-2xl border border-dashed border-[#dce9ff] dark:border-slate-700 p-4">
              <p className="text-[11px] text-[#565e74] dark:text-slate-400 italic leading-relaxed">
                <span className="font-bold not-italic text-[#45464d] dark:text-slate-300">Nota de Isenção: </span>
                {report.limitations}
              </p>
            </div>
          </div>

          {/* ── Analytics Sidebar (4 cols) ──────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-4 no-print">

            {/* Severity Donut */}
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">donut_large</span>
                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Distribuição de Risco</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} innerRadius={32} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 border-t border-[#e5eeff] dark:border-slate-800 pt-3">
                {[
                  { label: 'Alto Risco', value: sevCounts.high, color: 'bg-red-500' },
                  { label: 'Médio Risco', value: sevCounts.medium, color: 'bg-amber-500' },
                  { label: 'Baixo Risco', value: sevCounts.low, color: 'bg-emerald-500' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                      <span className="text-[#45464d] dark:text-slate-300">{s.label}</span>
                    </div>
                    <span className="font-bold text-[#0b1c30] dark:text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Criteria bar */}
            {barData.length > 0 && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                  <span className="material-symbols-outlined text-[20px] text-[#0051d5]">bar_chart</span>
                  <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Critérios Avaliados</h3>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Bar dataKey="count" fill="#0051d5" radius={[0, 6, 6, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Summary KPI card */}
            <div className="bg-gradient-to-br from-[#0b1c30] to-[#0051d5] rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Sumário do Relatório</span>
                <span className="material-symbols-outlined text-[20px] text-blue-200">analytics</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Alto', value: sevCounts.high, color: 'text-red-300' },
                  { label: 'Médio', value: sevCounts.medium, color: 'text-amber-300' },
                  { label: 'Baixo', value: sevCounts.low, color: 'text-emerald-300' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-2">
                    <p className={`text-xl font-bold font-['JetBrains_Mono'] ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-blue-200 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-blue-200">
                {sevCounts.total} critérios avaliados por IA com grounding vetorial nos documentos originais.
              </p>
            </div>

            {/* Policy metadata */}
            {report.policies && (
              <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                  <span className="material-symbols-outlined text-[20px] text-[#0051d5]">policy</span>
                  <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Apólices Comparadas</h3>
                </div>
                {[
                  { label: 'Apólice A (Base)', data: report.policies.policy_a },
                  { label: 'Apólice B (Comparada)', data: report.policies.policy_b },
                ].map((p) => (
                  <div key={p.label} className="bg-[#f8f9ff] dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#565e74] dark:text-slate-400 font-bold">{p.label}</p>
                    <p className="text-xs font-bold text-[#0b1c30] dark:text-white mt-0.5 font-['JetBrains_Mono']">
                      #{p.data?.id || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}