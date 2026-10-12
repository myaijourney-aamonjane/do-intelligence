import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    PieChart, Pie,
    AreaChart, Area, CartesianGrid,
} from 'recharts'

const API = 'http://localhost:8000'

type LogEntry = {
    id: number
    timestamp: string
    action: string
    user: string
    details: string
    level?: string
}

const SEED_LOGS: LogEntry[] = [
    { id: 1, timestamp: '2026-10-07T09:00:00Z', action: 'DOCUMENT_UPLOAD', user: 'sistema', level: 'SUCCESS', details: 'Upload de Apólice_D&O_AlphaRe_2025.pdf com sucesso. Tamanho: 2.4 MB, 18 páginas.' },
    { id: 2, timestamp: '2026-10-07T09:03:00Z', action: 'OCR_EXTRACTION', user: 'DocumentAgent', level: 'INFO', details: 'Extração OCR concluída via PyMuPDF. 18 páginas processadas, 0 falhas.' },
    { id: 3, timestamp: '2026-10-07T09:05:00Z', action: 'RAG_INGESTION', user: 'DocumentAgent', level: 'INFO', details: 'Ingestão RAG concluída. 142 chunks vectorizados no ChromaDB.' },
    { id: 4, timestamp: '2026-10-07T09:07:00Z', action: 'FIELD_EXTRACTION', user: 'PolicyExtractionAgent', level: 'SUCCESS', details: 'Campos estruturados extraídos: limite 150M MZN, franquia 2.5M MZN, prémio 12.5M MZN.' },
    { id: 5, timestamp: '2026-10-07T09:10:00Z', action: 'CLAUSE_CLASSIFICATION', user: 'ClauseIntelligenceAgent', level: 'SUCCESS', details: '6 cláusulas classificadas: 3 Cobertura, 2 Exclusão, 1 Condição Especial.' },
    { id: 6, timestamp: '2026-10-07T09:12:00Z', action: 'RISK_SCORING', user: 'RiskInsightAgent', level: 'WARNING', details: 'Cláusula CL-EXC-04 com risco ALTO identificada: exclusão de atos dolosos abrangente.' },
    { id: 7, timestamp: '2026-10-07T09:15:00Z', action: 'POLICY_COMPARISON', user: 'PolicyComparisonAgent', level: 'SUCCESS', details: 'Comparação POL-DO-2025-001 vs POL-DO-2025-002 concluída. Delta de cobertura: -50M MZN.' },
    { id: 8, timestamp: '2026-10-07T09:18:00Z', action: 'REPORT_GENERATION', user: 'ReportAgent', level: 'SUCCESS', details: 'Relatório executivo gerado. 4 secções, 12 diferenças encontradas.' },
    { id: 9, timestamp: '2026-10-07T09:20:00Z', action: 'DOCUMENT_UPLOAD', user: 'carlos.mendes@alphare.com', level: 'SUCCESS', details: 'Upload de Apólice_D&O_BetaSeguros_2025.pdf com sucesso. Tamanho: 1.9 MB, 14 páginas.' },
    { id: 10, timestamp: '2026-10-07T09:22:00Z', action: 'FIELD_EXTRACTION', user: 'PolicyExtractionAgent', level: 'SUCCESS', details: 'Campos estruturados extraídos: limite 100M MZN, franquia 5M MZN, prémio 9.8M MZN.' },
    { id: 11, timestamp: '2026-10-07T09:25:00Z', action: 'AUDIT_LOG', user: 'sistema', level: 'INFO', details: 'Sessão iniciada por carlos.mendes@alphare.com. IP: 10.1.40.3.' },
    { id: 12, timestamp: '2026-10-07T09:30:00Z', action: 'EVIDENCE_QUERY', user: 'carlos.mendes@alphare.com', level: 'INFO', details: 'Consulta de evidência para POL-DO-2025-001, campo aggregate_limit, página 5.' },
]

const LEVEL_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    SUCCESS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Success' },
    INFO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Info' },
    WARNING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Aviso' },
    ERROR: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Erro' },
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', label: 'Crítico' },
}

const ACTION_ICONS: Record<string, string> = {
    DOCUMENT_UPLOAD: 'upload_file',
    OCR_EXTRACTION: 'document_scanner',
    RAG_INGESTION: 'hub',
    FIELD_EXTRACTION: 'data_object',
    CLAUSE_CLASSIFICATION: 'category',
    RISK_SCORING: 'warning',
    POLICY_COMPARISON: 'balance',
    REPORT_GENERATION: 'summarize',
    AUDIT_LOG: 'manage_accounts',
    EVIDENCE_QUERY: 'search',
}

const PAGE_SIZE = 6

export default function Logs() {
    const [allLogs, setAllLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState<string>('ALL')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [page, setPage] = useState(1)
    const [expandedRow, setExpandedRow] = useState<number | null>(null)
    const [confirmClear, setConfirmClear] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
    const [insightsOpen, setInsightsOpen] = useState(true)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    useEffect(() => {
        setLoading(true)
        axios.get(`${API}/api/logs`).then(res => {
            if (Array.isArray(res.data) && res.data.length > 0) {
                setAllLogs(res.data.map((l: any, i: number) => ({
                    id: l.id ?? i + 1,
                    timestamp: l.timestamp ?? new Date().toISOString(),
                    action: l.action ?? 'SYSTEM',
                    user: l.user ?? 'sistema',
                    level: l.level ?? 'INFO',
                    details: l.details ?? '',
                })))
            }
        }).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(val)
            setPage(1)
        }, 400)
    }, [])

    const filtered = allLogs.filter(l => {
        const matchLevel = levelFilter === 'ALL' || l.level === levelFilter
        const matchSearch = !debouncedSearch ||
            l.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            l.details.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            l.user.toLowerCase().includes(debouncedSearch.toLowerCase())
        const matchFrom = !dateFrom || new Date(l.timestamp) >= new Date(dateFrom)
        const matchTo = !dateTo || new Date(l.timestamp) <= new Date(dateTo + 'T23:59:59Z')
        return matchLevel && matchSearch && matchFrom && matchTo
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const hasFilters = levelFilter !== 'ALL' || debouncedSearch || dateFrom || dateTo

    const summary = {
        total: allLogs.length,
        SUCCESS: allLogs.filter(l => l.level === 'SUCCESS').length,
        INFO: allLogs.filter(l => l.level === 'INFO').length,
        WARNING: allLogs.filter(l => l.level === 'WARNING').length,
        ERROR: allLogs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length,
    }

    // Chart: Events by level (bar)
    const levelBarData = useMemo(() => [
        { name: 'Sucesso', count: summary.SUCCESS, fill: '#10b981' },
        { name: 'Info', count: summary.INFO, fill: '#3b82f6' },
        { name: 'Aviso', count: summary.WARNING, fill: '#f59e0b' },
        { name: 'Erro', count: summary.ERROR, fill: '#ef4444' },
    ], [summary])

    // Chart: Events by action (pie top 5)
    const actionPieData = useMemo(() => {
        const map: Record<string, number> = {}
        allLogs.forEach(l => { map[l.action] = (map[l.action] || 0) + 1 })
        return Object.keys(map).map(k => ({ name: k.replace(/_/g, ' '), value: map[k] })).sort((a, b) => b.value - a.value).slice(0, 5)
    }, [allLogs])

    const PIE_COLORS = ['#0051d5', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

    // Chart: Timeline events per hour
    const timelineData = useMemo(() => {
        const map: Record<string, number> = {}
        allLogs.forEach(l => {
            const hour = new Date(l.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            map[hour] = (map[hour] || 0) + 1
        })
        return Object.keys(map).sort().map(k => ({ time: k, events: map[k] }))
    }, [allLogs])

    const insights = allLogs.filter(l => l.level === 'WARNING' || l.level === 'ERROR' || l.level === 'CRITICAL')
        .slice(0, 3)

    const handleExport = () => {
        const bom = '\uFEFF'
        const headers = ['ID;Data/Hora;Ação;Agente/Utilizador;Nível;Detalhes']
        const rows = filtered.map(l => `${l.id};${new Date(l.timestamp).toLocaleString('pt-PT')};${l.action};${l.user};${l.level ?? 'INFO'};"${l.details.replace(/"/g, '""')}"`)
        const csv = bom + [...headers, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
        showToast(`${filtered.length} registos exportados com sucesso!`)
    }

    const handleClear = () => {
        setConfirmClear(false)
        const removed = filtered.length
        setAllLogs(prev => prev.filter(l => !filtered.find(f => f.id === l.id)))
        setPage(1)
        showToast(`${removed} registos eliminados.`, 'info')
    }

    const levels = ['ALL', 'SUCCESS', 'INFO', 'WARNING', 'ERROR']
    const levelChipStyle = (l: string) => {
        if (l === 'ALL') return levelFilter === 'ALL'
            ? 'bg-[#0051d5] text-white border-[#0051d5]'
            : 'bg-white text-[#45464d] border-[#e5eeff] hover:bg-[#eff4ff]'
        const cfg = LEVEL_CONFIG[l]
        return levelFilter === l
            ? `${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold`
            : `bg-white ${cfg.text} border ${cfg.border} hover:${cfg.bg}`
    }

    return (
        <div className="w-full pb-8 space-y-5">

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0051d5] text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-96 border border-[#e5eeff] dark:border-slate-700">
                        <h3 className="text-base font-bold text-[#0b1c30] dark:text-white mb-2">Limpar Logs</h3>
                        <p className="text-sm text-[#45464d] dark:text-slate-300 mb-5">
                            {hasFilters
                                ? `Serão eliminados ${filtered.length} registos que correspondem aos filtros actuais.`
                                : `Serão eliminados todos os ${allLogs.length} registos de log. Esta acção não pode ser revertida.`}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg text-sm text-[#45464d] dark:text-slate-300 hover:bg-[#f8f9ff] dark:hover:bg-slate-700 border border-[#e5eeff] dark:border-slate-600 transition-colors">Cancelar</button>
                            <button onClick={handleClear} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[24px] text-[#0051d5]">terminal</span>
                        <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">Logs do Sistema</h1>
                    </div>
                    <p className="text-sm text-[#45464d] dark:text-slate-400 mt-1">Trilha de auditoria imutável de todas as acções executadas por agentes de IA, uploads e eventos de segurança.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 text-[#0b1c30] dark:text-slate-200 rounded-lg hover:bg-[#eff4ff] dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">download</span>Exportar CSV
                    </button>
                    <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); showToast('Logs actualizados!', 'info') }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 text-[#0b1c30] dark:text-slate-200 rounded-lg hover:bg-[#eff4ff] dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>Atualizar
                    </button>
                    <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete_sweep</span>Limpar
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total de Eventos', value: summary.total, icon: 'receipt_long', bg: 'bg-[#eff4ff] dark:bg-blue-950/30', color: 'text-[#0051d5] dark:text-blue-400' },
                    { label: 'Sucessos', value: summary.SUCCESS, icon: 'check_circle', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-700 dark:text-emerald-400' },
                    { label: 'Informativos', value: summary.INFO, icon: 'info', bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-700 dark:text-blue-400' },
                    { label: 'Avisos', value: summary.WARNING, icon: 'warning', bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-700 dark:text-amber-400' },
                    { label: 'Erros', value: summary.ERROR, icon: 'error', bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-700 dark:text-red-400' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl p-3">
                        {loading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                                <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        ) : (
                            <>
                                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-1.5`}>
                                    <span className={`material-symbols-outlined text-[18px] ${kpi.color}`}>{kpi.icon}</span>
                                </div>
                                <p className="text-xl font-bold text-[#0b1c30] dark:text-white">{kpi.value}</p>
                                <p className="text-xs text-[#45464d] dark:text-slate-400">{kpi.label}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Grid: Logs (8 cols) + Analytics (4 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-4">

                    {/* Insights */}
                    <div className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setInsightsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0b1c30] dark:text-white hover:bg-[#f8f9ff] dark:hover:bg-slate-800 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-amber-600">lightbulb</span>
                                Insights de Diagnóstico &amp; Recomendações
                                {insights.length > 0 && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">{insights.length}</span>
                                )}
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-[#76777d]">{insightsOpen ? 'expand_less' : 'expand_more'}</span>
                        </button>
                        {insightsOpen && (
                            <div className="border-t border-[#eff4ff] dark:border-slate-800 divide-y divide-[#f8f9ff] dark:divide-slate-800">
                                {insights.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-[#45464d] dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[36px] text-emerald-400 mb-2">shield_check</span>
                                        <p className="text-sm">Sem erros críticos registados. O sistema está a operar normalmente.</p>
                                    </div>
                                ) : (
                                    insights.map(ins => {
                                        const cfg = LEVEL_CONFIG[ins.level ?? 'INFO']
                                        return (
                                            <div key={ins.id} className="px-4 py-3 flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-[16px] ${cfg.text}`}>{ACTION_ICONS[ins.action] ?? 'info'}</span>
                                                    <span className="text-xs font-semibold text-[#0b1c30] dark:text-white">{ins.action}</span>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                                                    <span className="text-[10px] text-[#76777d] dark:text-slate-500 ml-auto">{new Date(ins.timestamp).toLocaleString('pt-PT')}</span>
                                                </div>
                                                <p className="text-xs text-[#45464d] dark:text-slate-400 truncate">{ins.details}</p>
                                                <p className="text-[11px] text-[#0051d5] dark:text-blue-400 bg-[#eff4ff] dark:bg-blue-950/30 px-2 py-1 rounded-lg">
                                                    <span className="font-semibold">Recomendação:</span> Reveja a cláusula identificada com o jurídico antes de emitir a apólice.
                                                </p>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative flex items-center flex-1 min-w-[200px]">
                                <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-[#76777d] pointer-events-none">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    placeholder="Pesquisar mensagem, agente, acção..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg text-xs text-[#0b1c30] dark:text-white placeholder:text-[#76777d] focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                                />
                            </div>
                            {/* Date Range */}
                            <div className="flex items-center gap-2">
                                <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
                                    className="text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2 py-1.5 text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]" />
                                <span className="text-[#76777d] dark:text-slate-400 text-xs">até</span>
                                <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
                                    className="text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2 py-1.5 text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]" />
                            </div>
                            {hasFilters && (
                                <button onClick={() => { setSearch(''); setDebouncedSearch(''); setLevelFilter('ALL'); setDateFrom(''); setDateTo(''); setPage(1) }}
                                    className="flex items-center gap-1 text-xs text-[#45464d] dark:text-slate-300 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 border border-[#e5eeff] dark:border-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>Limpar filtros
                                </button>
                            )}
                        </div>
                        {/* Level chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            {levels.map(l => (
                                <button key={l} onClick={() => { setLevelFilter(l); setPage(1) }}
                                    className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all ${levelChipStyle(l)}`}>
                                    {l === 'ALL' ? 'Todos' : LEVEL_CONFIG[l]?.label ?? l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#f8f9ff] dark:bg-slate-800/60 border-b border-[#eff4ff] dark:border-slate-800">
                                    {['Nível', 'Acção', 'Agente / Utilizador', 'Detalhes', 'Data/Hora', ''].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f8f9ff] dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-3"><div className="h-5 w-16 bg-slate-100 rounded-full" /></td>
                                            <td className="px-4 py-3"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                                            <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                                            <td className="px-4 py-3"><div className="h-4 w-48 bg-slate-100 rounded" /></td>
                                            <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                                            <td className="px-4 py-3" />
                                        </tr>
                                    ))
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <span className="material-symbols-outlined text-[40px] text-[#c4d0e7] mb-2 block">
                                                {hasFilters ? 'search_off' : 'receipt_long'}
                                            </span>
                                            <p className="text-sm text-[#45464d]">{hasFilters ? 'Sem resultados para os filtros aplicados.' : 'Nenhum log registado.'}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(log => {
                                        const cfg = LEVEL_CONFIG[log.level ?? 'INFO'] ?? LEVEL_CONFIG.INFO
                                        const icon = ACTION_ICONS[log.action] ?? 'circle'
                                        const expanded = expandedRow === log.id
                                        return (
                                            <React.Fragment key={log.id}>
                                                <tr className={`hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${expanded ? 'bg-[#f8f9ff] dark:bg-slate-800/50' : ''}`} onClick={() => setExpandedRow(expanded ? null : log.id)}>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`material-symbols-outlined text-[14px] ${cfg.text}`}>{icon}</span>
                                                            <span className="font-['JetBrains_Mono'] text-[10px] text-[#0b1c30] dark:text-white font-medium">{log.action}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#45464d] dark:text-slate-300 font-medium">{log.user}</td>
                                                    <td className="px-4 py-3 text-[#45464d] dark:text-slate-400 max-w-xs truncate">{log.details}</td>
                                                    <td className="px-4 py-3 text-[#76777d] dark:text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-PT')}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`material-symbols-outlined text-[16px] text-[#76777d] transition-transform ${expanded ? 'rotate-180' : ''}`}>expand_more</span>
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr className="bg-[#f8f9ff] dark:bg-slate-800/60">
                                                        <td colSpan={6} className="px-8 py-4">
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <p className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1">Mensagem Completa</p>
                                                                    <p className="text-xs text-[#0b1c30] dark:text-slate-200">{log.details}</p>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1">Agente / Utilizador</p>
                                                                        <p className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] dark:text-white">{log.user}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1">Timestamp (UTC)</p>
                                                                        <p className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] dark:text-white">{log.timestamp}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1">ID do Registo</p>
                                                                        <p className="font-['JetBrains_Mono'] text-xs text-[#0b1c30] dark:text-white">#{log.id}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {!loading && filtered.length > 0 && (
                            <div className="px-4 py-3 border-t border-[#eff4ff] dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-[#45464d] dark:text-slate-400">
                                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} registos
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg text-[#0b1c30] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">chevron_left</span>Anterior
                                    </button>
                                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#45464d] dark:text-slate-300 bg-[#f8f9ff] dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-[#e5eeff] dark:border-slate-700">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg text-[#0b1c30] dark:text-slate-200 hover:bg-[#eff4ff] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Seguinte<span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>{/* end xl:col-span-8 */}

                {/* ── Analytics Sidebar (xl: 4 cols) ── */}
                <div className="xl:col-span-4 space-y-4">

                    {/* Chart 1: Timeline Area */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">timeline</span>
                            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Eventos por Hora</h3>
                        </div>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5eeff" />
                                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                    <Area type="monotone" dataKey="events" stroke="#0051d5" fill="#0051d5" fillOpacity={0.15} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Level Distribution Bar */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">bar_chart</span>
                            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Distribuição por Nível</h3>
                        </div>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={levelBarData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
                                        {levelBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 3: Actions Pie */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#e5eeff] dark:border-slate-800">
                            <span className="material-symbols-outlined text-[20px] text-[#0051d5]">donut_large</span>
                            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white">Acções Mais Frequentes</h3>
                        </div>
                        <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={actionPieData} cx="50%" cy="50%" outerRadius={55} innerRadius={28} dataKey="value" paddingAngle={3}>
                                        {actionPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-1.5 pt-1 border-t border-[#e5eeff] dark:border-slate-800">
                            {actionPieData.map((item, i) => (
                                <div key={item.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                        <span className="text-[#45464d] dark:text-slate-300 truncate max-w-[130px]">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-[#0b1c30] dark:text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gradient Summary Card */}
                    <div className="bg-gradient-to-br from-[#0b1c30] to-[#0051d5] rounded-2xl p-5 text-white shadow-md space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Integridade do Sistema</span>
                            <span className="material-symbols-outlined text-[20px] text-blue-200">terminal</span>
                        </div>
                        <p className="text-3xl font-bold font-['JetBrains_Mono']">{summary.total}</p>
                        <div className="w-full bg-white/20 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: summary.total > 0 ? `${(summary.SUCCESS / summary.total) * 100}%` : '0%' }} />
                        </div>
                        <p className="text-[11px] text-blue-200">
                            {summary.total > 0 ? Math.round((summary.SUCCESS / summary.total) * 100) : 0}% de eventos concluídos com sucesso.
                        </p>
                    </div>

                </div>{/* end sidebar */}
            </div>{/* end main grid */}
        </div>
    )
}
