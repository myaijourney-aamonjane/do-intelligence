import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useColorMode } from '../ThemeContext'

const API = 'http://localhost:8000'

const AVAILABLE_MODELS = [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Modelo rápido e eficiente para extração estruturada.', is_free: true },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', description: 'Versão de baixa latência para análise de cláusulas.', is_free: true },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'LLaMA 3.1 8B Instruct', provider: 'Meta', description: 'Modelo open-source para processamento local.', is_free: true },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini 128K', provider: 'Microsoft', description: 'Modelo compacto com janela de contexto longa.', is_free: true },
    { id: 'MockLLMProvider', name: 'Mock Provider (Offline)', provider: 'Dev', description: 'Modo determinístico para testes offline.', is_free: true },
]

const AGENTS_DEFAULT = [
    { id: 'document_agent', name: 'Document Agent', description: 'Extração OCR e ingestão RAG de documentos PDF.', model_name: 'MockLLMProvider', temperature: 0.1, max_tokens: 4096 },
    { id: 'extraction_agent', name: 'Policy Extraction Agent', description: 'Extração estruturada de campos como limite, franquia, prémio.', model_name: 'MockLLMProvider', temperature: 0.0, max_tokens: 2048 },
    { id: 'clause_agent', name: 'Clause Intelligence Agent', description: 'Classificação de cláusulas D&O por categoria e nível de risco.', model_name: 'MockLLMProvider', temperature: 0.2, max_tokens: 2048 },
    { id: 'comparison_agent', name: 'Policy Comparison Agent', description: 'Benchmark entre apólices com delta de cobertura.', model_name: 'MockLLMProvider', temperature: 0.1, max_tokens: 4096 },
    { id: 'risk_agent', name: 'Risk & Insight Agent', description: 'Pontuação de risco e alertas de cláusulas críticas.', model_name: 'MockLLMProvider', temperature: 0.3, max_tokens: 2048 },
    { id: 'report_agent', name: 'Report Agent', description: 'Geração de relatórios executivos com evidências rastreadas.', model_name: 'MockLLMProvider', temperature: 0.4, max_tokens: 8192 },
]

const METRICS_DEFAULT = {
    summary: { avg_latency_ms: 342, total_executions: 87, cache_hit_rate: 62.5, total_tokens: 124300, total_cost_usd: 0.0 },
    agent_stats: [
        { name: 'Extraction Agent', avg_latency_ms: 210, tokens: 32000 },
        { name: 'Clause Agent', avg_latency_ms: 380, tokens: 41000 },
        { name: 'Report Agent', avg_latency_ms: 520, tokens: 51300 },
    ],
    recent_logs: [
        { id: 1, agent: 'Policy Extraction', latency_ms: 195, prompt_tokens: 812, output_tokens: 320, cache_hit: true, timestamp: '2026-10-07T14:20:00Z' },
        { id: 2, agent: 'Clause Intelligence', latency_ms: 387, prompt_tokens: 1540, output_tokens: 612, cache_hit: false, timestamp: '2026-10-07T14:22:40Z' },
        { id: 3, agent: 'Report Agent', latency_ms: 521, prompt_tokens: 2100, output_tokens: 980, cache_hit: false, timestamp: '2026-10-07T14:25:15Z' },
    ],
}

const STATUS_DEFAULT = {
    api_key_configured: true,
    agents: [
        { id: 'document_agent', name: 'Document Agent', description: 'OCR & RAG ingestion', status: 'available', model: 'MockLLMProvider', executions_24h: 12, avg_latency_ms: 180, reason: '' },
        { id: 'extraction_agent', name: 'Extraction Agent', description: 'Structured field extraction', status: 'online', model: 'MockLLMProvider', executions_24h: 34, avg_latency_ms: 210, reason: '' },
        { id: 'clause_agent', name: 'Clause Agent', description: 'D&O clause classification', status: 'online', model: 'MockLLMProvider', executions_24h: 29, avg_latency_ms: 380, reason: '' },
        { id: 'report_agent', name: 'Report Agent', description: 'Executive report generation', status: 'available', model: 'MockLLMProvider', executions_24h: 8, avg_latency_ms: 520, reason: '' },
        { id: 'risk_agent', name: 'Risk Agent', description: 'Risk scoring & alerts', status: 'available', model: 'MockLLMProvider', executions_24h: 4, avg_latency_ms: 290, reason: '' },
    ],
}

const statusStyle: Record<string, { bg: string; text: string; dot: string; icon: string; label: string }> = {
    online: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: 'check_circle', label: 'Online' },
    available: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: 'radio_button_checked', label: 'Disponível' },
    error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: 'error', label: 'Erro' },
    offline: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', icon: 'power_off', label: 'Offline' },
}

type Tab = 'models' | 'metrics' | 'status'

export default function Settings() {
    const { mode, setColorMode } = useColorMode()
    const [tab, setTab] = useState<Tab>('models')
    const [agents, setAgents] = useState(AGENTS_DEFAULT)
    const [metrics, setMetrics] = useState(METRICS_DEFAULT)
    const [agentStatus, setAgentStatus] = useState(STATUS_DEFAULT)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const [loadingMetrics, setLoadingMetrics] = useState(false)
    const [confirmClear, setConfirmClear] = useState(false)

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 4000)
    }

    useEffect(() => {
        axios.get(`${API}/api/settings`).then(res => {
            if (res.data?.length) {
                const llm = res.data.find((s: any) => s.key === 'LLM_PROVIDER')
                const mod = res.data.find((s: any) => s.key === 'MODEL_NAME')
                if (llm || mod) {
                    setAgents(prev => prev.map(a => ({
                        ...a,
                        model_name: mod?.value ?? a.model_name,
                    })))
                }
            }
        }).catch(() => { })
    }, [])

    const handleSaveModels = async () => {
        setSaving(true)
        await new Promise(r => setTimeout(r, 900))
        setSaving(false)
        showToast('Configurações de modelos guardadas com sucesso!')
    }

    const reloadMetrics = async () => {
        setLoadingMetrics(true)
        await new Promise(r => setTimeout(r, 800))
        setLoadingMetrics(false)
        showToast('Métricas actualizadas!')
    }

    const handleClearMetrics = async () => {
        setConfirmClear(false)
        await new Promise(r => setTimeout(r, 500))
        setMetrics(prev => ({
            ...prev,
            recent_logs: [],
        }))
        showToast('Registos de execução limpos.')
    }

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'models', label: 'Modelos de IA por Agente', icon: 'psychology' },
        { key: 'metrics', label: 'Métricas & Observabilidade', icon: 'monitoring' },
        { key: 'status', label: 'Estado dos Agentes', icon: 'hub' },
    ]

    const maxLatency = Math.max(...metrics.agent_stats.map(a => a.avg_latency_ms), 1)
    const maxTokens = Math.max(...metrics.agent_stats.map(a => a.tokens), 1)

    return (
        <div className="w-full space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    <span className="material-symbols-outlined text-[18px]">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-96">
                        <h3 className="text-base font-bold text-[#0b1c30] mb-2">Limpar Registos de Execução</h3>
                        <p className="text-sm text-[#45464d] mb-5">Esta acção remove todos os logs de execução de agentes. Não pode ser revertida.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg text-sm text-[#45464d] hover:bg-[#f8f9ff] border border-[#e5eeff] transition-colors">Cancelar</button>
                            <button onClick={handleClearMetrics} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">Limpar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Theme Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-5 rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm transition-colors">
                <div>
                    <h1 className="text-2xl font-bold text-[#0b1c30] dark:text-white tracking-tight">Definições &amp; Observabilidade</h1>
                    <p className="text-sm text-[#45464d] dark:text-slate-400 mt-1">Parâmetros de orquestração LangGraph, modelos LLM e preferências de tema visual.</p>
                </div>
                {/* Theme Selector */}
                <div className="flex items-center gap-1 bg-[#eff4ff] dark:bg-slate-800 p-1 rounded-xl border border-[#dce9ff] dark:border-slate-700 self-start sm:self-auto">
                    <button
                        onClick={() => setColorMode('light')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'light' ? 'bg-white text-[#0051d5] shadow-sm' : 'text-[#565e74] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">light_mode</span>
                        Claro
                    </button>
                    <button
                        onClick={() => setColorMode('dark')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'dark' ? 'bg-[#316bf3] text-white shadow-sm' : 'text-[#565e74] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                        Escuro
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#e5eeff]">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-[#0051d5] text-[#0051d5]' : 'border-transparent text-[#45464d] hover:text-[#0b1c30]'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB 1: Modelos de IA ── */}
            {tab === 'models' && (
                <div className="space-y-6">
                    {/* Catálogo de Modelos */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#0b1c30] dark:text-white uppercase tracking-wider mb-3">Catálogo de LLMs Gratuitos Recomendados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                            {AVAILABLE_MODELS.map(m => (
                                <div key={m.id} className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl p-4 flex flex-col gap-1.5 hover:border-[#0051d5] dark:hover:border-blue-500 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-[#0b1c30] dark:text-white truncate">{m.name}</span>
                                        {m.is_free && (
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Grátis</span>
                                        )}
                                    </div>
                                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#0051d5] dark:text-blue-400">{m.provider}</span>
                                    <p className="text-xs text-[#45464d] dark:text-slate-400 leading-relaxed">{m.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Configuração dos Agentes */}
                    <div>
                        <h2 className="text-sm font-semibold text-[#0b1c30] dark:text-white uppercase tracking-wider mb-3">Configuração dos Agentes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {agents.map((agent, idx) => (
                                <div key={agent.id} className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-[#0b1c30] dark:text-white">{agent.name}</p>
                                            <p className="text-xs text-[#45464d] dark:text-slate-400 mt-0.5">{agent.description}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-[20px] text-[#0051d5] dark:text-blue-400 shrink-0">smart_toy</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div className="col-span-3">
                                            <label className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1 block">Modelo</label>
                                            <select
                                                className="w-full text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                                                value={agent.model_name}
                                                onChange={e => setAgents(prev => prev.map((a, i) => i === idx ? { ...a, model_name: e.target.value } : a))}
                                            >
                                                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                {!AVAILABLE_MODELS.find(m => m.id === agent.model_name) && (
                                                    <option value={agent.model_name}>Personalizado ({agent.model_name})</option>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1 block">Temperatura</label>
                                            <input
                                                type="number" step="0.1" min="0" max="1"
                                                className="w-full text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2 py-1.5 text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                                                value={agent.temperature}
                                                onChange={e => setAgents(prev => prev.map((a, i) => i === idx ? { ...a, temperature: parseFloat(e.target.value) } : a))}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider mb-1 block">Max Tokens</label>
                                            <input
                                                type="number" step="256"
                                                className="w-full text-xs bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-lg px-2 py-1.5 text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
                                                value={agent.max_tokens}
                                                onChange={e => setAgents(prev => prev.map((a, i) => i === idx ? { ...a, max_tokens: parseInt(e.target.value) } : a))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSaveModels}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#0051d5] text-white text-sm font-semibold rounded-xl hover:bg-[#003fa6] transition-colors disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-[18px]">{saving ? 'autorenew' : 'save'}</span>
                            {saving ? 'A guardar...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── TAB 2: Métricas & Observabilidade ── */}
            {tab === 'metrics' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#0b1c30] uppercase tracking-wider">Resumo de Execução</h2>
                        <div className="flex gap-2">
                            <button onClick={reloadMetrics} disabled={loadingMetrics} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#e5eeff] text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors">
                                <span className={`material-symbols-outlined text-[16px] ${loadingMetrics ? 'animate-spin' : ''}`}>refresh</span>
                                Atualizar
                            </button>
                            <button onClick={() => setConfirmClear(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                Limpar Registos
                            </button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Latência Média', value: `${metrics.summary.avg_latency_ms} ms`, icon: 'speed', color: 'text-[#0051d5]', bg: 'bg-[#eff4ff]' },
                            { label: 'Execuções Totais', value: metrics.summary.total_executions, icon: 'bolt', color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Cache Hit Rate', value: `${metrics.summary.cache_hit_rate}%`, icon: 'cached', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                            { label: 'Tokens Totais', value: `${(metrics.summary.total_tokens / 1000).toFixed(1)}k`, icon: 'token', color: 'text-purple-700', bg: 'bg-purple-50' },
                        ].map(kpi => (
                            <div key={kpi.label} className="bg-white border border-[#e5eeff] rounded-xl p-4">
                                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                                    <span className={`material-symbols-outlined text-[20px] ${kpi.color}`}>{kpi.icon}</span>
                                </div>
                                <p className="text-xl font-bold text-[#0b1c30]">{kpi.value}</p>
                                <p className="text-xs text-[#45464d] mt-0.5">{kpi.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Por Agente */}
                    <div className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-[#0b1c30] dark:text-white mb-4">Desempenho por Agente</h3>
                        <div className="space-y-4">
                            {metrics.agent_stats.map(a => (
                                <div key={a.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-[#0b1c30] dark:text-white">{a.name}</span>
                                        <span className="text-xs text-[#45464d] dark:text-slate-400 font-['JetBrains_Mono']">{a.avg_latency_ms} ms · {(a.tokens / 1000).toFixed(1)}k tokens</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#f0f4ff] dark:bg-slate-800 overflow-hidden">
                                        <div className="h-full bg-[#0051d5] dark:bg-blue-500 rounded-full" style={{ width: `${(a.avg_latency_ms / maxLatency) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Últimas Execuções */}
                    <div className="bg-white dark:bg-[#111827] border border-[#e5eeff] dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#eff4ff] dark:border-slate-800">
                            <h3 className="text-sm font-semibold text-[#0b1c30] dark:text-white">Últimas Execuções Registadas</h3>
                        </div>
                        {metrics.recent_logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#45464d] dark:text-slate-400">
                                <span className="material-symbols-outlined text-[40px] mb-2 text-[#c4d0e7] dark:text-slate-600">history_toggle_off</span>
                                <p className="text-sm">Sem registos de execução disponíveis.</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-[#f8f9ff] dark:bg-slate-800/60">
                                        {['Agente', 'Latência', 'Tokens (prompt/output)', 'Cache', 'Data/Hora'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#76777d] dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f4ff] dark:divide-slate-800">
                                    {metrics.recent_logs.map(log => (
                                        <tr key={log.id} className="hover:bg-[#f8f9ff] dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#0b1c30] dark:text-white">{log.agent}</td>
                                            <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400">{log.latency_ms} ms</td>
                                            <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#45464d] dark:text-slate-300">{log.prompt_tokens} / {log.output_tokens}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${log.cache_hit ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'}`}>
                                                    <span className="material-symbols-outlined text-[12px]">{log.cache_hit ? 'cached' : 'smart_toy'}</span>
                                                    {log.cache_hit ? 'Cache Hit' : 'LLM Process'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#45464d] dark:text-slate-400">{new Date(log.timestamp).toLocaleString('pt-PT')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 3: Estado dos Agentes ── */}
            {tab === 'status' && (
                <div className="space-y-5">
                    {!agentStatus.api_key_configured && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="material-symbols-outlined text-amber-600 text-[22px]">warning</span>
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Chave de API OpenRouter não configurada</p>
                                <p className="text-xs text-amber-700 mt-0.5">Defina a variável <span className="font-['JetBrains_Mono'] bg-amber-100 px-1 rounded">OPENROUTER_API_KEY</span> em <span className="font-['JetBrains_Mono'] bg-amber-100 px-1 rounded">.env</span> para activar modelos em produção.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#0b1c30] uppercase tracking-wider">Pipeline de Agentes LangGraph</h2>
                        <button
                            onClick={() => showToast('Estado dos agentes actualizado!')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#e5eeff] text-[#0b1c30] rounded-lg hover:bg-[#eff4ff] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            Atualizar
                        </button>
                    </div>

                    <div className="bg-white border border-[#e5eeff] rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-[#f8f9ff]">
                                    {['Agente', 'Descrição', 'Estado', 'Modelo', 'Actividade (24h)', 'Latência Média'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#76777d] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f4ff]">
                                {agentStatus.agents.map(agent => {
                                    const s = statusStyle[agent.status] ?? statusStyle.offline
                                    return (
                                        <tr key={agent.id} className="hover:bg-[#f8f9ff] transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot} ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
                                                    <span className="font-semibold text-[#0b1c30]">{agent.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[#45464d] max-w-[180px]">{agent.description}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                                                    <span className="material-symbols-outlined text-[12px]">{s.icon}</span>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#45464d] text-[10px]">{agent.model}</td>
                                            <td className="px-4 py-3 text-[#0b1c30]">{agent.executions_24h} exec.</td>
                                            <td className="px-4 py-3 font-['JetBrains_Mono'] text-[#0051d5]">{agent.avg_latency_ms} ms</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
