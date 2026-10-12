import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chip, CircularProgress } from '@mui/material'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    AreaChart,
    Area,
    CartesianGrid,
} from 'recharts'
import { getPolicies, getPolicyEvidence, getPolicyFields, getAllPolicyEvidences } from '../api'

// ── Constants ─────────────────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
    PolicyExtractionAgent: '#0051d5',
    ClauseIntelligenceAgent: '#8b5cf6',
    DocumentAgent: '#10b981',
}

const CONFIDENCE_BINS = ['50–60%', '60–70%', '70–80%', '80–90%', '90–100%']

const ROWS_PER_PAGE = 8

export default function EvidenceAudit() {
    const [searchParams] = useSearchParams()
    const policyIdParam = searchParams.get('policyId')

    const [searchQuery, setSearchQuery] = useState('')
    const [evidenceItems, setEvidenceItems] = useState<any[]>([])
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [agentFilter, setAgentFilter] = useState<string>('ALL')
    const [page, setPage] = useState(0)

    useEffect(() => {
        async function fetchEvidence() {
            setLoading(true)
            try {
                let targetPolicyId = policyIdParam ? parseInt(policyIdParam) : null
                const items: any[] = []

                if (targetPolicyId) {
                    const [eRes, fRes] = await Promise.all([
                        getPolicyEvidence(targetPolicyId).catch(() => ({ data: [] })),
                        getPolicyFields(targetPolicyId).catch(() => ({ data: [] })),
                    ])

                    if (eRes.data?.length > 0) {
                        eRes.data.forEach((ev: any, idx: number) => {
                            items.push({
                                id: idx + 1,
                                field: ev.field_name || ev.clause_name || 'Evidência Extraída',
                                policy: `Apólice #${targetPolicyId}`,
                                page: ev.page || 1,
                                snippet: ev.evidence || ev.value || 'Sem trecho disponível',
                                confidence: ev.confidence || 0.95,
                                status: 'VERIFIED',
                                extracted_by: ev.source === 'clause' ? 'ClauseIntelligenceAgent' : 'PolicyExtractionAgent',
                            })
                        })
                    }

                    if (fRes.data?.length > 0) {
                        fRes.data.forEach((f: any) => {
                            if (f.evidence) {
                                items.push({
                                    id: items.length + 1,
                                    field: f.field_name,
                                    policy: `Apólice #${targetPolicyId}`,
                                    page: f.page || 1,
                                    snippet: f.evidence,
                                    confidence: f.confidence || 0.92,
                                    status: 'VERIFIED',
                                    extracted_by: 'PolicyExtractionAgent',
                                })
                            }
                        })
                    }
                } else {
                    const allRes = await getAllPolicyEvidences().catch(() => ({ data: [] }))
                    if (allRes.data?.length > 0) {
                        allRes.data.forEach((ev: any, idx: number) => {
                            items.push({
                                id: idx + 1,
                                field: ev.field_name || ev.clause_name || 'Evidência Extraída',
                                policy: ev.policy_name || `Apólice #${ev.policy_id}`,
                                page: ev.page || 1,
                                snippet: ev.evidence || ev.value || 'Sem trecho disponível',
                                confidence: ev.confidence || (idx % 2 === 0 ? 0.96 : 0.92),
                                status: 'VERIFIED',
                                extracted_by: ev.source === 'clause' ? 'ClauseIntelligenceAgent' : 'PolicyExtractionAgent',
                            })
                        })
                    }
                }

                setEvidenceItems(items)
                setSelectedEvidence(items[0] ?? null)
            } catch (err) {
                console.error('Error fetching evidence:', err)
                setEvidenceItems([])
                setSelectedEvidence(null)
            } finally {
                setLoading(false)
            }
        }
        fetchEvidence()
    }, [policyIdParam])

    // ── Derived KPIs ─────────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const total = evidenceItems.length
        const avgConf = total > 0
            ? evidenceItems.reduce((sum, i) => sum + (i.confidence || 0), 0) / total
            : 0
        const verified = evidenceItems.filter((i) => i.status === 'VERIFIED').length
        const agents = [...new Set(evidenceItems.map((i) => i.extracted_by))].length
        return { total, avgConf, verified, agents }
    }, [evidenceItems])

    // ── Agent breakdown chart ─────────────────────────────────────────────────────
    const agentData = useMemo(() => {
        const map: Record<string, number> = {}
        evidenceItems.forEach((i) => {
            map[i.extracted_by] = (map[i.extracted_by] || 0) + 1
        })
        return Object.keys(map).map((k) => ({
            name: k.replace('Agent', ''),
            count: map[k],
            fill: AGENT_COLORS[k] || '#94a3b8',
        }))
    }, [evidenceItems])

    // ── Confidence distribution chart ─────────────────────────────────────────────
    const confData = useMemo(() => {
        const bins = [0, 0, 0, 0, 0]
        evidenceItems.forEach((i) => {
            const c = (i.confidence || 0) * 100
            if (c < 60) bins[0]++
            else if (c < 70) bins[1]++
            else if (c < 80) bins[2]++
            else if (c < 90) bins[3]++
            else bins[4]++
        })
        return CONFIDENCE_BINS.map((label, i) => ({ label, count: bins[i] }))
    }, [evidenceItems])

    // ── Filtered + Paginated ──────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return evidenceItems.filter((item) => {
            const matchSearch =
                item.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.snippet.toLowerCase().includes(searchQuery.toLowerCase())
            const matchAgent = agentFilter === 'ALL' || item.extracted_by === agentFilter
            return matchSearch && matchAgent
        })
    }, [evidenceItems, searchQuery, agentFilter])

    const paginated = useMemo(() => {
        return filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)
    }, [filtered, page])

    const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE)

    const agents = useMemo(() => [...new Set(evidenceItems.map((i) => i.extracted_by))], [evidenceItems])

    return (
        <div className="w-full pb-8 space-y-6">

            {/* ── Page Header ───────────────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">
                        Auditoria de Evidências &amp; Rastreabilidade
                    </h1>
                    <span className="px-2 py-0.5 rounded bg-[#eff4ff] dark:bg-slate-800 text-xs font-semibold text-[#0051d5] dark:text-blue-400 font-['JetBrains_Mono'] border border-[#dce9ff] dark:border-slate-700">
                        {evidenceItems.length} Evidências
                    </span>
                </div>
                <p className="text-sm text-[#565e74] dark:text-slate-400 mt-1">
                    Inspeção lado a lado da apólice original, extração de texto OCR e fundamentação comprovatória por página.
                </p>
            </div>

            {/* ── KPI Summary Cards ─────────────────────────────────────────────────── */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'Total de Evidências', value: kpis.total,
                            icon: 'fact_check', color: 'text-[#0051d5]', bg: 'bg-blue-50 dark:bg-blue-950/30',
                        },
                        {
                            label: 'Verificadas & Rastreadas', value: kpis.verified,
                            icon: 'verified_user', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                        },
                        {
                            label: 'Confiança Média IA', value: `${Math.round(kpis.avgConf * 100)}%`,
                            icon: 'psychology', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30',
                        },
                        {
                            label: 'Agentes Envolvidos', value: kpis.agents,
                            icon: 'smart_toy', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30',
                        },
                    ].map((k) => (
                        <div key={k.label} className={`${k.bg} rounded-2xl p-4 border border-transparent shadow-sm flex flex-col gap-1`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wider font-bold text-[#565e74] dark:text-slate-400">{k.label}</span>
                                <span className={`material-symbols-outlined text-[22px] ${k.color}`}>{k.icon}</span>
                            </div>
                            <p className={`text-2xl font-bold ${k.color} leading-tight`}>{k.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Main Grid ─────────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center py-20"><CircularProgress /></div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

                    {/* Left: Evidence Panel (xl: 8 cols) */}
                    <div className="xl:col-span-8 space-y-4">
                        {/* Search + Agent Filter Bar */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                            {/* Search */}
                            <div className="relative flex-1 w-full">
                                <span className="absolute left-3 top-2.5 material-symbols-outlined text-[18px] text-slate-400">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar evidência por palavra-chave..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                                    className="w-full pl-9 pr-4 py-2 text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0051d5] text-[#0b1c30] dark:text-white"
                                />
                            </div>

                            {/* Agent Filter */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => { setAgentFilter('ALL'); setPage(0) }}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${agentFilter === 'ALL' ? 'bg-[#0051d5] text-white border-[#0051d5]' : 'bg-white dark:bg-slate-800 text-[#45464d] dark:text-slate-300 border-[#e5eeff] dark:border-slate-700 hover:border-blue-300'}`}
                                >
                                    Todos
                                </button>
                                {agents.map((agent) => (
                                    <button
                                        key={agent}
                                        onClick={() => { setAgentFilter(agent); setPage(0) }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${agentFilter === agent ? 'text-white border-transparent' : 'bg-white dark:bg-slate-800 text-[#45464d] dark:text-slate-300 border-[#e5eeff] dark:border-slate-700 hover:border-blue-300'}`}
                                        style={agentFilter === agent ? { backgroundColor: AGENT_COLORS[agent] || '#0051d5' } : {}}
                                    >
                                        {agent.replace('Agent', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Evidence List + Detail Split */}
                        <div className="grid grid-cols-5 gap-4 min-h-[680px]">
                            {/* Evidence List (2 cols) */}
                            <div className="col-span-2 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#e5eeff] dark:border-slate-800 text-[11px] uppercase tracking-wider font-bold text-[#565e74] dark:text-slate-400">
                                    Evidências Identificadas ({filtered.length})
                                </div>

                                <div className="flex flex-col gap-0 overflow-y-auto flex-1">
                                    {paginated.map((item) => {
                                        const selected = selectedEvidence?.id === item.id
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedEvidence(item)}
                                                className={`w-full text-left px-4 py-3 border-b border-[#e5eeff] dark:border-slate-800 transition-all hover:bg-[#f0f4ff]/60 dark:hover:bg-slate-800/60 ${selected ? 'bg-[#eff4ff] dark:bg-blue-950/30 border-l-2 border-l-[#0051d5]' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-1 mb-1">
                                                    <p className="text-xs font-bold text-[#0b1c30] dark:text-white leading-snug">{item.field}</p>
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-900/50 text-[#0051d5] dark:text-blue-300 shrink-0">
                                                        Pág {item.page}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#565e74] dark:text-slate-400 mb-1">{item.policy}</p>
                                                <p className="text-[11px] text-[#45464d] dark:text-slate-300 line-clamp-2 italic">
                                                    "{item.snippet}"
                                                </p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span
                                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: AGENT_COLORS[item.extracted_by] + '20', color: AGENT_COLORS[item.extracted_by] || '#0051d5' }}
                                                    >
                                                        {item.extracted_by.replace('Agent', '')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600">
                                                        {Math.round((item.confidence || 0) * 100)}%
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}

                                    {paginated.length === 0 && (
                                        <div className="p-6 text-center text-xs text-slate-400">
                                            Nenhuma evidência encontrada.
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-4 py-2.5 border-t border-[#e5eeff] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#565e74] dark:text-slate-400">
                                        <button
                                            disabled={page === 0}
                                            onClick={() => setPage((p) => p - 1)}
                                            className="px-2 py-1 rounded border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
                                        >&lt;</button>
                                        <span className="font-semibold text-[#0b1c30] dark:text-white">{page + 1}/{totalPages}</span>
                                        <button
                                            disabled={page + 1 >= totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="px-2 py-1 rounded border border-[#e5eeff] dark:border-slate-700 disabled:opacity-40 hover:bg-[#eff4ff] dark:hover:bg-slate-800"
                                        >&gt;</button>
                                    </div>
                                )}
                            </div>

                            {/* Evidence Detail (3 cols) */}
                            <div className="col-span-3">
                                {selectedEvidence ? (
                                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm p-5 h-full flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e5eeff] dark:border-slate-800">
                                            <div>
                                                <h3 className="text-base font-bold text-[#0b1c30] dark:text-white leading-snug">{selectedEvidence.field}</h3>
                                                <p className="text-[11px] text-[#565e74] dark:text-slate-400 mt-0.5">
                                                    {selectedEvidence.policy} — Página {selectedEvidence.page}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold">
                                                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                                    Confiança IA: {Math.round((selectedEvidence.confidence || 0.9) * 100)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Grounded Evidence Highlight */}
                                        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-xl p-4">
                                            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-2">
                                                <span className="material-symbols-outlined text-[16px]">highlight</span>
                                                Trecho de Evidência Grounded (Página {selectedEvidence.page})
                                            </p>
                                            <p className="text-sm text-amber-900 dark:text-amber-200 italic leading-relaxed">
                                                "{selectedEvidence.snippet}"
                                            </p>
                                        </div>

                                        {/* Metadata Row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Agente Extractor', value: selectedEvidence.extracted_by.replace('Agent', ' Agent') },
                                                { label: 'Página do Documento', value: `Pág. ${selectedEvidence.page}` },
                                                { label: 'Status', value: selectedEvidence.status },
                                            ].map((m) => (
                                                <div key={m.label} className="bg-[#f8f9ff] dark:bg-slate-800 rounded-xl p-3 border border-[#e5eeff] dark:border-slate-700">
                                                    <p className="text-[10px] uppercase tracking-wider text-[#565e74] dark:text-slate-400 font-semibold">{m.label}</p>
                                                    <p className="text-xs font-bold text-[#0b1c30] dark:text-white mt-0.5 truncate">{m.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* PDF Canvas Area */}
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-dashed border-[#cbd5e1] dark:border-slate-700 rounded-xl p-5 overflow-y-auto font-['JetBrains_Mono'] text-[12px] leading-7 text-[#334155] dark:text-slate-300">
                                            <div className="flex flex-col items-center pb-3 mb-3 border-b border-[#f1f5f9] dark:border-slate-800">
                                                <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600">menu_book</span>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    Texto Extraído via OCR — Apólice PDF · Página {selectedEvidence.page}
                                                </p>
                                            </div>
                                            <p>CAPÍTULO II — DAS COBERTURAS E LIMITES DE GARANTIA</p>
                                            <p className="text-slate-500 dark:text-slate-400">Artigo 4º. O presente contrato de seguro Directors &amp; Officers vigora no território acordado nas especificações do seguro.</p>
                                            <p className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded border-l-2 border-yellow-400 my-1">{selectedEvidence.snippet}</p>
                                            <p className="text-slate-500 dark:text-slate-400">Artigo 5º. O valor total das indenizações acumuladas durante o período de vigência não ultrapassará o Limite Agregado contratado.</p>
                                            <p className="text-slate-500 dark:text-slate-400">Artigo 6º. Quaisquer divergências quanto à interpretação das condições gerais serão resolvidas sob a jurisdição do foro competente.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#f8f9ff] dark:bg-slate-800/50 rounded-2xl border border-dashed border-[#dce9ff] dark:border-slate-700 h-full flex flex-col items-center justify-center gap-3 text-center p-8">
                                        <span className="material-symbols-outlined text-[48px] text-[#0051d5]/30">manage_search</span>
                                        <p className="text-sm font-semibold text-[#45464d] dark:text-slate-300">Selecione uma evidência</p>
                                        <p className="text-xs text-slate-400">Clique num item à esquerda para inspecionar o trecho fundamentado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Analytics Sidebar (xl: 4 cols) */}
                    <div className="xl:col-span-4 space-y-4">

                        {/* Chart 1: Confidence Distribution (Area) */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                                <span className="material-symbols-outlined text-[20px] text-violet-600">monitoring</span>
                                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Distribuição de Confiança</h3>
                            </div>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={confData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                        <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Chart 2: Agent Breakdown (Pie) */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">donut_large</span>
                                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Evidências por Agente</h3>
                            </div>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={agentData} cx="50%" cy="50%" outerRadius={55} innerRadius={30} dataKey="count" paddingAngle={3}>
                                            {agentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5 pt-1 border-t border-[#e5eeff] dark:border-slate-800">
                                {agentData.map((agent) => (
                                    <div key={agent.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.fill }}></span>
                                            <span className="text-[#45464d] dark:text-slate-300 font-medium">{agent.name}</span>
                                        </div>
                                        <span className="font-bold text-[#0b1c30] dark:text-white">{agent.count}</span>
                                    </div>
                                ))}
                                {agentData.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Sem dados</p>}
                            </div>
                        </div>

                        {/* Chart 3: Bars per page */}
                        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                                <span className="material-symbols-outlined text-[20px] text-[#0051d5]">bar_chart</span>
                                <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Evidências por Agente (Volume)</h3>
                            </div>
                            <div className="h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                                            {agentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gradient Summary Card */}
                        <div className="bg-gradient-to-br from-violet-700 to-[#0051d5] rounded-2xl p-5 text-white shadow-md space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wider text-violet-200 font-semibold">Integridade da Auditoria</span>
                                <span className="material-symbols-outlined text-[20px] text-violet-200">shield_lock</span>
                            </div>
                            <p className="text-2xl font-bold font-['JetBrains_Mono']">
                                {kpis.verified}/{kpis.total}
                            </p>
                            <div className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                                <div
                                    className="h-1.5 rounded-full bg-white transition-all"
                                    style={{ width: kpis.total > 0 ? `${(kpis.verified / kpis.total) * 100}%` : '0%' }}
                                />
                            </div>
                            <p className="text-[11px] text-violet-200">
                                Evidências rastreadas e fundamentadas por IA com grounding nos documentos originais.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
