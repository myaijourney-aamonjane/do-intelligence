import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPolicies } from '../api'
import { exportCSV, exportExcel } from '../utils/exportTable'

const DASH_COLUMNS = ['Nº Apólice', 'Seguradora', 'Data', 'Status', 'Score IA']
const DASH_KEYS = ['policy_number', 'insurer', 'date', 'status', 'score']

export default function Dashboard() {
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dashPage, setDashPage] = useState(0)
  const [dashRowsPerPage, setDashRowsPerPage] = useState(5)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const res = await listPolicies()
        if (res.data) {
          setPolicies(res.data)
        }
      } catch (err) {
        console.error('Error fetching policies:', err)
        setPolicies([])
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header Bar & Scope Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-3 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-[#0b1c30] tracking-tight">Dashboard</h1>
            <span className="px-2 py-0.5 rounded bg-[#eff4ff] font-['JetBrains_Mono'] text-xs text-[#0051d5] font-semibold">
              v2.4 Core
            </span>
          </div>
          <p className="text-sm text-[#565e74] mt-1">Visão geral das análises de apólices D&amp;O</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-[#e5eeff]">
            <div className="flex items-center px-3 py-1.5 gap-1.5 text-[#565e74] text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5]">date_range</span>
              <select className="bg-transparent text-xs text-[#0b1c30] focus:outline-none cursor-pointer">
                <option>Últimos 30 dias</option>
                <option>Últimos 7 dias</option>
                <option>Ano Fiscal 2026</option>
                <option>Q1 2026</option>
              </select>
            </div>
            <div className="w-[1px] h-5 bg-[#e5eeff] mx-1"></div>
            <div className="flex items-center px-3 py-1.5 gap-1.5 text-[#565e74] text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <select className="bg-transparent text-xs text-[#0b1c30] focus:outline-none cursor-pointer">
                <option>Todas as seguradoras</option>
                <option>Chubb Seguros</option>
                <option>Zurich Financial</option>
                <option>Tokio Marine</option>
                <option>Allianz Global</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => navigate('/new-analysis')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded-xl font-semibold text-xs tracking-wider transition-all duration-150 shadow-md shadow-[#0051d5]/20 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>NOVA ANÁLISE</span>
            <span className="font-['JetBrains_Mono'] text-[10px] opacity-70 bg-white/20 px-1.5 py-0.5 rounded ml-1">
              ⌘N
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Apólices Analisadas */}
        <div className="flex flex-col justify-between p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0051d5]/10 text-[#0051d5] font-['JetBrains_Mono'] text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+12% mês</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#565e74] block">
              Apólices Analisadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-[#0b1c30] tracking-tight">{policies.length || 24}</span>
              <span className="text-xs text-[#565e74] font-medium">contratos</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#565e74]">
            <span>Meta subscrição trimestral</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-[#0b1c30]">80% atingida</span>
          </div>
        </div>

        {/* Card 2: Comparações Realizadas */}
        <div className="flex flex-col justify-between p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0b1c30]">
              <span className="material-symbols-outlined text-[22px]">compare_arrows</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0b1c30] font-['JetBrains_Mono'] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5]"></span>
              <span>5 ativas</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#565e74] block">
              Comparações Realizadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-[#0b1c30] tracking-tight">18</span>
              <span className="text-xs text-[#565e74] font-medium">benchmarks</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#565e74]">
            <span>Média cláusulas cruzadas</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-[#0b1c30]">32 p/ estudo</span>
          </div>
        </div>

        {/* Card 3: Documentos Processados */}
        <div className="flex flex-col justify-between p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
              <span className="material-symbols-outlined text-[22px]">document_scanner</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#565e74] font-['JetBrains_Mono'] text-xs">
              <span>OCR 99.4%</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#565e74] block">
              Documentos Processados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-[#0b1c30] tracking-tight">47</span>
              <span className="text-xs text-[#565e74] font-medium">arquivos PDF</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#565e74]">
            <span>Volume textual</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-[#0b1c30]">1.420 páginas</span>
          </div>
        </div>

        {/* Card 4: Análises com Alertas */}
        <div className="flex flex-col justify-between p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-['JetBrains_Mono'] text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>Requer revisão</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#565e74] block">
              Análises com Alertas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-red-600 tracking-tight">6</span>
              <span className="text-xs text-[#565e74] font-medium">exposições críticas</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#565e74]">
            <span>Gargalo principal</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-red-600">Insolvência &amp; SEC</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 65% / 35% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Análises Recentes Live Audit Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5eeff] overflow-hidden flex flex-col">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#eff4ff]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-[#0b1c30]">Análises Recentes</h2>
                  <span className="font-['JetBrains_Mono'] text-xs px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] font-semibold">
                    Live Audit
                  </span>
                </div>
                <p className="text-xs text-[#565e74] mt-0.5">
                  Execuções de inferência sobre termos, limites e coberturas contratuais
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Export dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExportOpen(v => !v)}
                    onBlur={() => setTimeout(() => setExportOpen(false), 150)}
                    className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Exportar</span>
                  </button>
                  {exportOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#e5eeff] z-20 overflow-hidden">
                      <button
                        onClick={() => { exportCSV(DASH_COLUMNS, policies, DASH_KEYS, 'analises_recentes'); setExportOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-xs text-[#0b1c30] hover:bg-[#f0f4ff] flex items-center gap-2"
                      >
                        <span>📄</span> Exportar CSV
                      </button>
                      <button
                        onClick={() => { exportExcel(DASH_COLUMNS, policies, DASH_KEYS, 'analises_recentes'); setExportOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-xs text-[#0b1c30] hover:bg-[#f0f4ff] flex items-center gap-2"
                      >
                        <span>📊</span> Exportar Excel
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('/policies')}
                  className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Ver Todas</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff] text-[#565e74] font-semibold text-xs uppercase tracking-wider border-b border-[#eff4ff]">
                    <th className="py-3 px-4">Apólice</th>
                    <th className="py-3 px-4">Seguradora</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Score IA</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-xs">
                  {policies.slice(dashPage * dashRowsPerPage, dashPage * dashRowsPerPage + dashRowsPerPage).map((p, idx) => {
                    const policyNo = p.policy_number || `DO-2026-000${p.id}`
                    const insurerName = p.insurer || 'Seguradora'
                    const status = p.status || 'COMPLETED'
                    const score = p.score ?? (80 + (p.id * 3) % 18)

                    return (
                      <tr key={p.id || idx} className="hover:bg-[#f8f9ff] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0051d5] text-[18px]">
                              description
                            </span>
                            <span className="font-['JetBrains_Mono'] font-bold text-[#0b1c30]">
                              {policyNo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#0b1c30]">{insurerName}</td>
                        <td className="py-3.5 px-4 font-['JetBrains_Mono'] text-[#565e74]">
                          {p.date || '14/03/2026'}
                        </td>
                        <td className="py-3.5 px-4">
                          {status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Processada
                            </span>
                          ) : status === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0051d5] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] animate-pulse"></span>
                              Em processamento
                            </span>
                          ) : status === 'ALERT' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              Com Alertas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                              Erro OCR
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {score ? (
                            <span className="font-['JetBrains_Mono'] font-bold text-[#0b1c30]">
                              {score}
                              <span className="text-[#76777d] text-[10px]">/100</span>
                            </span>
                          ) : (
                            <span className="font-['JetBrains_Mono'] text-[#76777d] italic">--</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/policies/${p.id}`)}
                              className="px-2.5 py-1 text-[#0051d5] hover:bg-[#eff4ff] rounded font-semibold transition-colors"
                            >
                              Detalhes
                            </button>
                            <button
                              onClick={() => navigate(`/audit?policyId=${p.id}`)}
                              className="px-2.5 py-1 text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded transition-colors"
                            >
                              Evidência
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer – Pagination */}
            <div className="p-3 bg-[#f8f9ff] flex flex-wrap items-center justify-between gap-2 text-xs text-[#565e74] border-t border-[#eff4ff]">
              <span>
                Mostrando{' '}
                <span className="font-['JetBrains_Mono'] font-semibold text-[#0b1c30]">
                  {dashPage * dashRowsPerPage + 1}–{Math.min((dashPage + 1) * dashRowsPerPage, policies.length)}
                </span>{' '}
                de{' '}
                <span className="font-['JetBrains_Mono'] font-semibold text-[#0b1c30]">{policies.length}</span>{' '}
                apólices
              </span>

              <div className="flex items-center gap-2">
                {/* Rows per page */}
                <div className="flex items-center gap-1">
                  <span className="text-[#76777d]">Linhas:</span>
                  <select
                    value={dashRowsPerPage}
                    onChange={(e) => { setDashRowsPerPage(Number(e.target.value)); setDashPage(0) }}
                    className="border border-[#e5eeff] rounded px-1 py-0.5 bg-white text-[#0b1c30] font-['JetBrains_Mono'] focus:outline-none cursor-pointer"
                  >
                    {[5, 10, 25].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                {/* Prev / Page indicator / Next */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDashPage(p => Math.max(0, p - 1))}
                    disabled={dashPage === 0}
                    className="w-7 h-7 flex items-center justify-center rounded border border-[#e5eeff] bg-white text-[#0b1c30] disabled:opacity-30 hover:bg-[#eff4ff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <span className="px-2 py-0.5 bg-white rounded border border-[#e5eeff] font-['JetBrains_Mono'] font-bold text-[#0b1c30]">
                    {dashPage + 1} / {Math.ceil(policies.length / dashRowsPerPage) || 1}
                  </span>
                  <button
                    onClick={() => setDashPage(p => Math.min(Math.ceil(policies.length / dashRowsPerPage) - 1, p + 1))}
                    disabled={dashPage >= Math.ceil(policies.length / dashRowsPerPage) - 1}
                    className="w-7 h-7 flex items-center justify-center rounded border border-[#e5eeff] bg-white text-[#0b1c30] disabled:opacity-30 hover:bg-[#eff4ff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Analysis Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0b1c30] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">psychology</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-[#0051d5]">Heurística &amp; Coberturas</span>
                <span className="font-bold text-base text-[#0b1c30] mt-0.5">88.4% de Clareza Média</span>
                <p className="text-xs text-[#565e74] mt-1">Conformidade com padrões SUSEP e clausulados internacionais.</p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-[#565e74]">Risco Exposição Total</span>
                <span className="font-bold text-base text-[#0b1c30] mt-0.5">R$ 480.000.000</span>
                <p className="text-xs text-[#565e74] mt-1">Capacidade nominal consolidada sob auditoria em tempo real.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Critical Subscription Alert Card */}
          <div className="p-5 bg-red-50/70 border border-red-200 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">fmd_bad</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-900 uppercase tracking-wider">
                    Alerta de Subscrição
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-800 font-['JetBrains_Mono'] text-[10px] font-bold">
                    48h
                  </span>
                </div>
                <p className="text-xs text-[#0b1c30] font-semibold mt-1 leading-snug">
                  3 apólices com exclusão de insolvência severa detectadas pela IA nas últimas 48h.
                </p>
                <p className="text-xs text-[#565e74] mt-2">
                  Cláusula <span className="font-['JetBrains_Mono'] font-bold text-red-600">EXCL-INS-9</span> suprime cobertura de custas de defesa em recuperação judicial.
                </p>
                <button
                  onClick={() => navigate('/comparisons')}
                  className="mt-4 px-4 py-2 bg-[#0b1c30] hover:bg-[#1e293b] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start"
                >
                  <span>Examinar Cláusulas</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Activity Pipeline Stepper */}
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">account_tree</span>
                <span className="font-bold text-base text-[#0b1c30]">Pipeline de Atividade</span>
              </div>
              <span className="font-['JetBrains_Mono'] text-xs text-[#0051d5] font-semibold">DO-2026</span>
            </div>
            <p className="text-xs text-[#565e74] my-3">Ciclo de auditoria do documento mais recente</p>

            {/* Stepper Steps */}
            <div className="relative flex flex-col gap-4 pl-2">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#eff4ff]"></div>

              {/* Step 1 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0 z-10 text-[12px] font-bold">
                  ✓
                </div>
                <div className="flex flex-col text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#0b1c30]">Documento carregado</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#76777d]">10:14</span>
                  </div>
                  <span className="text-[#565e74] mt-0.5">Apolice_DO_ABC_2026.pdf (8.4 MB)</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0 z-10 text-[12px] font-bold">
                  ✓
                </div>
                <div className="flex flex-col text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#0b1c30]">OCR Concluído</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#76777d]">10:15</span>
                  </div>
                  <span className="text-[#565e74] mt-0.5">42 páginas extraídas (acurácia 99.4%)</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0051d5] text-white flex items-center justify-center shrink-0 z-10 text-[12px] font-bold">
                  ✓
                </div>
                <div className="flex flex-col text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[#0b1c30]">Inferência IA</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#76777d]">10:17</span>
                  </div>
                  <span className="text-[#565e74] mt-0.5">14 coberturas e 9 exclusões mapeadas</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 z-10 text-[12px] font-bold">
                  ✓
                </div>
                <div className="flex flex-col text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-emerald-800">Análise Concluída</span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#76777d]">10:19</span>
                  </div>
                  <span className="text-[#565e74] mt-0.5">Relatório executivo gerado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Capacity Widget */}
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#e5eeff] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                Benchmark de Clausulado
              </span>
              <span className="material-symbols-outlined text-[#0051d5] text-[18px]">auto_awesome</span>
            </div>
            <p className="text-xs text-[#565e74]">
              O modelo D&amp;O Intel 4.5 opera com latência média de 4.2s por laudo.
            </p>
            <div className="h-2 w-full bg-[#eff4ff] rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[#0051d5] rounded-full" style={{ width: '88%' }}></div>
            </div>
            <div className="flex justify-between font-['JetBrains_Mono'] text-xs text-[#565e74] pt-1">
              <span>Capacidade IA alocada</span>
              <span className="font-bold text-[#0b1c30]">88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}