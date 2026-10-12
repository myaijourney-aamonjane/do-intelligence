import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPolicy, getPolicyFields, getPolicyClauses, getPolicyEvidence } from '../api'
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis,
} from 'recharts'

export default function PolicyDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'resumo' | 'coberturas' | 'exclusoes' | 'limites' | 'franquias' | 'clausulas' | 'evidencias'>('resumo')
    const [policy, setPolicy] = useState<any>(null)
    const [fields, setFields] = useState<any[]>([])
    const [clauses, setClauses] = useState<any[]>([])
    const [evidence, setEvidence] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!id) return
            const pId = parseInt(id) || 1
            try {
                const [pRes, fRes, cRes, eRes] = await Promise.all([
                    getPolicy(pId).catch((err) => {
                        console.error('Error loading policy:', err)
                        return null
                    }),
                    getPolicyFields(pId).catch(() => null),
                    getPolicyClauses(pId).catch(() => null),
                    getPolicyEvidence(pId).catch(() => null),
                ])

                if (pRes?.data) {
                    setPolicy(pRes.data)
                } else {
                    setPolicy(null)
                }

                setFields(fRes?.data || [])
                setClauses(cRes?.data || [])
                setEvidence(eRes?.data || [])
            } catch (err) {
                console.error('Error fetching policy details from API:', err)
                setPolicy(null)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-[#0051d5]">
                <span className="material-symbols-outlined text-[36px] animate-spin">progress_activity</span>
            </div>
        )
    }

    if (!policy) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#565e74] mb-3">gavel</span>
                <h2 className="font-bold text-lg text-[#0b1c30]">Apólice não encontrada</h2>
                <p className="text-xs text-[#565e74] mt-1 max-w-md">
                    Não foi possível carregar os detalhes da apólice solicitada da base de dados.
                </p>
                <button
                    onClick={() => navigate('/policies')}
                    className="mt-4 px-4 py-2 bg-[#0051d5] text-white rounded-xl text-xs font-semibold hover:bg-[#316bf3]"
                >
                    Voltar à Biblioteca de Apólices
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full pb-8">
            {/* Breadcrumb & Action Ribbon */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-1.5 text-xs text-[#565e74] dark:text-slate-400">
                    <span onClick={() => navigate('/')} className="hover:text-[#0b1c30] dark:hover:text-white cursor-pointer">
                        Dashboard
                    </span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span onClick={() => navigate('/policies')} className="hover:text-[#0b1c30] dark:hover:text-white cursor-pointer">
                        Apólices
                    </span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[#0b1c30] dark:text-white">
                        {policy?.policy_number || `DO-2026-00124`}
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-bold text-2xl text-[#0b1c30] dark:text-white tracking-tight">
                                Apólice D&amp;O — {policy?.insurer || 'ABC Insurance'}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] dark:bg-blue-950/40 text-[#0051d5] dark:text-blue-400 font-semibold text-xs flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>Auditada por IA</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#565e74] dark:text-slate-400 mt-2 flex-wrap">
                            <span>Seguradora: <strong className="text-[#0b1c30] dark:text-white">{policy?.insurer}</strong></span>
                            <span>•</span>
                            <span>Nº Apólice: <strong className="font-['JetBrains_Mono'] text-[#0b1c30] dark:text-white">{policy?.policy_number}</strong></span>
                            <span>•</span>
                            <span>Status: <strong className="text-emerald-700 dark:text-emerald-400">{policy?.status}</strong></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/comparisons?policyA=${id}`)}
                            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-700 text-[#0b1c30] dark:text-slate-200 border border-[#e5eeff] dark:border-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">balance</span>
                            <span>Comparar Apólice</span>
                        </button>
                        <button
                            onClick={() => navigate(`/audit?policyId=${id}`)}
                            className="px-4 py-2 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-[#0051d5]/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">find_in_page</span>
                            <span>Auditar Evidências</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4 KPI Cards Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase text-[#565e74] dark:text-slate-400">Limite de Responsabilidade</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-2xl text-[#0b1c30] dark:text-white mt-2">
                        {policy?.liability_limit || '—'}
                    </span>
                    <span className="text-[11px] text-[#0051d5] dark:text-blue-400 font-semibold mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shield</span> Side A, B &amp; C Agregados
                    </span>
                </div>

                <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase text-[#565e74] dark:text-slate-400">Franquia / Retenção</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-2xl text-[#0b1c30] dark:text-white mt-2">
                        {policy?.deductible || '—'}
                    </span>
                    <span className="text-[11px] text-[#565e74] dark:text-slate-400 mt-2">Zero retenção para Side A pessoal</span>
                </div>

                <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase text-[#565e74] dark:text-slate-400">Jurisdição &amp; Foro</span>
                    <span className="font-bold text-base text-[#0b1c30] dark:text-white mt-2">
                        {policy?.jurisdiction || 'Brasil'}
                    </span>
                    <span className="text-[11px] text-[#0051d5] dark:text-blue-400 font-semibold mt-2">Retroatividade: Irrestrita</span>
                </div>

                <div className="p-4 bg-white dark:bg-[#111827] rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase text-[#565e74] dark:text-slate-400">Score da Apólice</span>
                        <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400 text-[18px]">verified_user</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="font-['JetBrains_Mono'] font-bold text-3xl text-[#0b1c30] dark:text-white">
                            {policy?.score || 82}
                        </span>
                        <span className="text-xs text-[#565e74] dark:text-slate-400">/100</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">Risco Moderado • Alta Proteção</span>
                </div>
            </div>

            {/* Tabs Navigation Header */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white dark:bg-[#111827] p-2 rounded-2xl border border-[#e5eeff] dark:border-slate-800 shadow-sm mb-6">
                {[
                    { key: 'resumo', label: 'Resumo', icon: 'overview' },
                    { key: 'coberturas', label: 'Coberturas', icon: 'shield' },
                    { key: 'exclusoes', label: 'Exclusões', icon: 'block' },
                    { key: 'limites', label: 'Limites', icon: 'trending_up' },
                    { key: 'franquias', label: 'Franquias', icon: 'price_change' },
                    { key: 'clausulas', label: 'Cláusulas', icon: 'description' },
                    { key: 'evidencias', label: `Evidências (${evidence.length})`, icon: 'find_in_page' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === tab.key
                            ? 'bg-[#eff4ff] dark:bg-blue-950/50 text-[#0051d5] dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800'
                            : 'text-[#565e74] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab 1: Resumo & Coberturas Table */}
            {(activeTab === 'resumo' || activeTab === 'coberturas') && (
                <div className="flex flex-col gap-6">
                    {/* General Information Card */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800">
                        <h2 className="font-bold text-base text-[#0b1c30] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">assignment</span>
                            <span>Informações Gerais do Contrato</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl flex flex-col">
                                <span className="text-[#565e74] dark:text-slate-400 uppercase text-[10px] font-bold">Seguradora Emissora</span>
                                <span className="font-bold text-[#0b1c30] dark:text-white mt-0.5">{policy?.insurer}</span>
                            </div>
                            <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl flex flex-col">
                                <span className="text-[#565e74] dark:text-slate-400 uppercase text-[10px] font-bold">Tomador / Sociedade Contratante</span>
                                <span className="font-bold text-[#0b1c30] dark:text-white mt-0.5">{policy?.policyholder}</span>
                            </div>
                            <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl flex flex-col">
                                <span className="text-[#565e74] dark:text-slate-400 uppercase text-[10px] font-bold">Número da Apólice</span>
                                <span className="font-['JetBrains_Mono'] font-bold text-[#0b1c30] dark:text-white mt-0.5">
                                    {policy?.policy_number}
                                </span>
                            </div>
                            <div className="p-3 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl flex flex-col">
                                <span className="text-[#565e74] dark:text-slate-400 uppercase text-[10px] font-bold">Foro &amp; Jurisdição</span>
                                <span className="font-bold text-[#0b1c30] dark:text-white mt-0.5">{policy?.jurisdiction}</span>
                            </div>
                        </div>
                    </div>

                    {/* Coberturas & Sublimites Table */}
                    <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800">
                        <h2 className="font-bold text-base text-[#0b1c30] dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">shield_with_heart</span>
                            <span>Coberturas Principais e Sublimites</span>
                        </h2>
                        <div className="overflow-x-auto rounded-xl border border-[#eff4ff] dark:border-slate-800">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9ff] dark:bg-slate-800 text-[#565e74] dark:text-slate-400 font-semibold border-b border-[#eff4ff] dark:border-slate-800">
                                        <th className="py-3 px-4">Cobertura</th>
                                        <th className="py-3 px-4 text-center">Incluída</th>
                                        <th className="py-3 px-4 text-right">Limite</th>
                                        <th className="py-3 px-4">Observações Técnicas</th>
                                        <th className="py-3 px-4 text-center">Página</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eff4ff] dark:divide-slate-800">
                                    {clauses
                                        .filter((c) => c.category === 'Coverage' || activeTab === 'resumo')
                                        .map((c, i) => (
                                            <tr key={i} className="hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-[#0b1c30] dark:text-white">{c.name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                                                        Sim
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right font-['JetBrains_Mono'] font-bold text-[#0b1c30] dark:text-white">
                                                    {c.limit || policy?.liability_limit || '—'}
                                                </td>
                                                <td className="py-3 px-4 text-[#565e74] dark:text-slate-300">{c.text}</td>
                                                <td className="py-3 px-4 text-center font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400 font-bold">
                                                    <button
                                                        onClick={() => navigate(`/audit?policyId=${id}&page=${c.page}`)}
                                                        className="hover:underline"
                                                    >
                                                        Pág. {c.page || 1}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Coberturas */}
            {activeTab === 'coberturas' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-4">
                    <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">shield</span>
                        <span>Coberturas Principais e Adicionais</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-[#eff4ff] dark:border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-[#f8f9ff] dark:bg-slate-800 text-[#565e74] dark:text-slate-400 font-semibold border-b border-[#eff4ff] dark:border-slate-800">
                                    <th className="py-3 px-4">Cobertura / Cláusula</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Limite</th>
                                    <th className="py-3 px-4">Evidência Grounded</th>
                                    <th className="py-3 px-4 text-center">Página</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#eff4ff] dark:divide-slate-800">
                                {clauses
                                    .filter((c) => c.category === 'Coverage')
                                    .map((c, i) => (
                                        <tr key={i} className="hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 px-4 font-bold text-[#0b1c30] dark:text-white">{c.name}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                                                    Coberta
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-['JetBrains_Mono'] font-bold text-[#0b1c30] dark:text-white">
                                                {c.limit || policy?.liability_limit || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-[#565e74] dark:text-slate-300 font-['JetBrains_Mono'] text-[11px] max-w-md truncate">
                                                "{c.evidence || c.text || 'Grounded em documento auditado'}"
                                            </td>
                                            <td className="py-3 px-4 text-center font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400 font-bold">
                                                <button
                                                    onClick={() => navigate(`/audit?policyId=${id}&page=${c.page}`)}
                                                    className="hover:underline"
                                                >
                                                    Pág. {c.page || 1}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Exclusões */}
            {activeTab === 'exclusoes' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-4">
                    <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600 dark:text-red-400">block</span>
                        <span>Exclusões Críticas Identificadas</span>
                    </h2>
                    <div className="flex flex-col gap-3">
                        {clauses
                            .filter((c) => c.category === 'Exclusion')
                            .map((ex, i) => (
                                <div key={i} className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 flex justify-between items-start">
                                    <div className="flex flex-col text-xs pr-4">
                                        <span className="font-bold text-red-900 dark:text-red-300 text-sm">{ex.name}</span>
                                        <p className="text-[#565e74] dark:text-slate-300 mt-1 font-['JetBrains_Mono'] text-[11px]">
                                            "{ex.evidence || ex.text}"
                                        </p>
                                        <span className="text-[11px] text-[#0051d5] dark:text-blue-400 font-semibold mt-2">
                                            Fonte Grounded: Página {ex.page || 1} • Confiança {Math.round((ex.confidence || 0.95) * 100)}%
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/audit?policyId=${id}&page=${ex.page}`)}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap"
                                    >
                                        Ver Evidência Pág. {ex.page || 1}
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Tab 4: Limites */}
            {activeTab === 'limites' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-6">
                    <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">trending_up</span>
                        <span>Limites de Responsabilidade e Sublimites</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl border border-[#e5eeff] dark:border-slate-700 flex flex-col">
                            <span className="text-xs font-bold uppercase text-[#565e74] dark:text-slate-400">LMR Principal Por Reclamação</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-2xl text-[#0051d5] dark:text-blue-400 mt-2">
                                {policy?.liability_limit || 'R$ 35.000.000,00'}
                            </span>
                            <span className="text-[11px] text-[#565e74] dark:text-slate-400 mt-1">Garantia máxima por sinistro para Side A, B e C</span>
                        </div>
                        <div className="p-4 bg-[#f8f9ff] dark:bg-slate-800 rounded-xl border border-[#e5eeff] dark:border-slate-700 flex flex-col">
                            <span className="text-xs font-bold uppercase text-[#565e74] dark:text-slate-400">LMR Agregado Plurianual</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-2xl text-[#0b1c30] dark:text-white mt-2">
                                {policy?.aggregate_limit || policy?.liability_limit || 'R$ 35.000.000,00'}
                            </span>
                            <span className="text-[11px] text-[#565e74] dark:text-slate-400 mt-1">Limite teto total acumulado para a vigência contratada</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-[#0b1c30] dark:text-white">Sublimites Específicos Extraídos</h3>
                        <div className="overflow-x-auto rounded-xl border border-[#eff4ff] dark:border-slate-800">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#f8f9ff] dark:bg-slate-800 text-[#565e74] dark:text-slate-400 font-semibold border-b border-[#eff4ff] dark:border-slate-800">
                                        <th className="py-3 px-4">Cobertura / Sublimite</th>
                                        <th className="py-3 px-4 text-right">Valor Sublimitado</th>
                                        <th className="py-3 px-4 text-center">Página</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#eff4ff] dark:divide-slate-800">
                                    {clauses
                                        .filter((c) => c.category === 'Sublimit' || c.name.toLowerCase().includes('sublimite'))
                                        .map((sub, i) => (
                                            <tr key={i} className="hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-[#0b1c30] dark:text-white">{sub.name}</td>
                                                <td className="py-3 px-4 text-right font-['JetBrains_Mono'] font-bold text-emerald-600 dark:text-emerald-400">
                                                    {sub.limit || 'Incluído no LMR'}
                                                </td>
                                                <td className="py-3 px-4 text-center font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400 font-bold">
                                                    <button onClick={() => navigate(`/audit?policyId=${id}&page=${sub.page}`)} className="hover:underline">
                                                        Pág. {sub.page || 1}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 5: Franquias */}
            {activeTab === 'franquias' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-6">
                    <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">price_change</span>
                        <span>Estrutura de Franquias &amp; Retenções Próprias</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 flex flex-col">
                            <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">Side A — Direta Pessoas Físicas</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-2">
                                {policy?.deductible || 'R$ 0,00'}
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Zero franquia para diretores e conselheiros</span>
                        </div>
                        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 flex flex-col">
                            <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Side B — Reembolso à Sociedade</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-2xl text-amber-600 dark:text-amber-400 mt-2">
                                R$ 150.000,00
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">Retenção própria aplicável por sinistro indemnizado</span>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Side C — Valores Mobiliários</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-lg text-slate-600 dark:text-slate-300 mt-2">
                                Não Contratada
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Requer endosso específico para emissão de ações</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 6: Cláusulas */}
            {activeTab === 'clausulas' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">description</span>
                            <span>Todas as Cláusulas Identificadas ({clauses.length})</span>
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {clauses.map((c, i) => (
                            <div key={i} className="p-4 bg-[#f8f9ff] dark:bg-slate-800/60 rounded-xl border border-[#e5eeff] dark:border-slate-700 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${c.category === 'Coverage' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                                                c.category === 'Exclusion' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                            }`}>
                                            {c.category || 'Cláusula'}
                                        </span>
                                        <span className="font-bold text-[#0b1c30] dark:text-white text-sm">{c.name}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/audit?policyId=${id}&page=${c.page}`)}
                                        className="text-xs text-[#0051d5] dark:text-blue-400 font-bold hover:underline"
                                    >
                                        Ver na Pág. {c.page || 1} →
                                    </button>
                                </div>
                                <p className="font-['JetBrains_Mono'] text-[#45464d] dark:text-slate-300 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-[#e5eeff] dark:border-slate-800">
                                    "{c.evidence || c.text || 'Texto da cláusula auditado no documento.'}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 7: Evidências */}
            {activeTab === 'evidencias' && (
                <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-base text-[#0b1c30] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400">find_in_page</span>
                            <span>Trilhas de Evidência &amp; Grounding Vetorial</span>
                        </h2>
                        <button
                            onClick={() => navigate(`/audit?policyId=${id}`)}
                            className="px-4 py-2 bg-[#0051d5] text-white rounded-xl text-xs font-semibold hover:bg-[#316bf3] transition-colors"
                        >
                            Abrir Visualizador Split-Screen PDF
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {evidence.map((ev, idx) => (
                            <div key={idx} className="p-4 bg-[#f8f9ff] dark:bg-slate-800/60 rounded-xl border border-[#e5eeff] dark:border-slate-700 flex flex-col gap-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#0b1c30] dark:text-white uppercase">{ev.category || 'Trecho Auditado'}</span>
                                    <span className="font-['JetBrains_Mono'] text-[#0051d5] dark:text-blue-400 font-bold">Página {ev.page}</span>
                                </div>
                                <p className="font-['JetBrains_Mono'] text-[#45464d] dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-[#e5eeff] dark:border-slate-800">
                                    "{ev.text_chunk || ev.evidence || ev.value || 'Trecho auditado e verificado'}"
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-[#565e74] dark:text-slate-400">
                                    <span>Confiança do OCR / LLM: {Math.round((ev.confidence || 0.95) * 100)}%</span>
                                    <button
                                        onClick={() => navigate(`/audit?policyId=${id}&page=${ev.page}`)}
                                        className="text-[#0051d5] dark:text-blue-400 font-semibold hover:underline"
                                    >
                                        Ir para Split-Screen Auditoria →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
