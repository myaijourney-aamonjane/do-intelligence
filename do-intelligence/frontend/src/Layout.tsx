import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useColorMode } from './ThemeContext'

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { mode, toggleColorMode } = useColorMode()
    const [searchQuery, setSearchQuery] = useState('')
    const [isCollapsed, setIsCollapsed] = useState(false)

    const navItems = [
        { label: 'Dashboard', icon: 'grid_view', path: '/' },
        { label: 'Apólices', icon: 'folder_open', path: '/policies' },
        { label: 'Nova Análise', icon: 'upload_file', path: '/new-analysis' },
        { label: 'Comparações', icon: 'balance', path: '/comparisons' },
        { label: 'Auditoria de Evidência', icon: 'find_in_page', path: '/audit' },
        { label: 'Logs & Atividade', icon: 'history', path: '/logs' },
        { label: 'Configurações', icon: 'settings', path: '/settings' },
    ]

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/policies?search=${encodeURIComponent(searchQuery)}`)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0b0f19] font-['Inter'] text-[#0b1c30] dark:text-slate-100 flex transition-colors duration-200">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-[#111827] z-50 flex flex-col justify-between border-r border-[#e5eeff] dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out`}>
                <div className="flex flex-col">
                    {/* Logo & Brand Header */}
                    <div className="h-16 px-4 flex items-center justify-between border-b border-[#eff4ff] dark:border-slate-800">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-[#0051d5] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#0051d5]/20 shrink-0">
                                <span className="material-symbols-outlined text-[22px]">shield</span>
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col truncate">
                                    <span className="font-bold text-base text-[#0b1c30] dark:text-white tracking-tight leading-tight">D&amp;O Intel</span>
                                    <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] dark:text-slate-400 uppercase tracking-wider">Policy Analysis</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1 px-3 mt-4">
                        {navItems.map((item) => {
                            const active =
                                item.path === '/'
                                    ? location.pathname === '/'
                                    : location.pathname.startsWith(item.path)
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left ${active
                                        ? 'bg-[#eff4ff] dark:bg-slate-800/80 text-[#0051d5] dark:text-blue-400 font-semibold shadow-sm'
                                        : 'text-[#45464d] dark:text-slate-300 hover:bg-[#f8f9ff] dark:hover:bg-slate-800/50 hover:text-[#0b1c30] dark:hover:text-white'
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[20px] ${active ? 'text-[#0051d5] dark:text-blue-400' : 'text-[#76777d] dark:text-slate-400'
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* User Profile Footer */}
                <div className={`p-3 bg-[#eff4ff] dark:bg-slate-800/60 m-3 rounded-xl flex flex-col gap-2 transition-all duration-300`}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-[#131b2e] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                CM
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col truncate">
                                    <span className="text-xs font-semibold text-[#0b1c30] dark:text-white truncate">Carlos Mendes</span>
                                    <span className="text-[11px] text-[#45464d] dark:text-slate-400 truncate">Underwriter Sênior</span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-1 text-[#45464d] dark:text-slate-300 hover:text-[#0051d5] dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                                title="Configurações de Conta"
                            >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                            </button>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="pt-1 border-t border-[#dce9ff] dark:border-slate-700">
                            <span className="font-['JetBrains_Mono'] text-[10px] text-[#565e74] dark:text-slate-400 block truncate font-medium">
                                Alpha Re &amp; Seguros S.A.
                            </span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Container */}
            <div className={`${isCollapsed ? 'pl-20' : 'pl-64'} flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out`}>
                {/* Topbar */}
                <header className={`fixed top-0 ${isCollapsed ? 'left-20' : 'left-64'} right-0 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md z-40 px-6 flex items-center justify-between border-b border-[#e5eeff] dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out`}>
                    {/* Hamburger Toggle & Breadcrumb */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 text-[#45464d] dark:text-slate-300 hover:text-[#0051d5] dark:hover:text-white hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {isCollapsed ? 'menu_open' : 'menu'}
                            </span>
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-[#45464d] dark:text-slate-300">
                            <span className="hover:text-[#0b1c30] dark:hover:text-white cursor-pointer" onClick={() => navigate('/')}>
                                Alpha Re
                            </span>
                            <span className="material-symbols-outlined text-[14px] text-[#76777d] dark:text-slate-500">chevron_right</span>
                            <span className="text-[#0b1c30] dark:text-white font-semibold">D&amp;O Underwriting</span>
                        </div>
                        <div className="h-4 w-[1px] bg-[#dce9ff] dark:bg-slate-800"></div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eff4ff] dark:bg-slate-800 border border-[#dce9ff] dark:border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-[#0051d5] dark:bg-blue-400 animate-pulse"></span>
                            <span className="font-['JetBrains_Mono'] text-[10px] text-[#0051d5] dark:text-blue-400 uppercase font-bold tracking-wider">
                                IA Online (LangGraph)
                            </span>
                        </div>
                    </div>

                    {/* Search Bar & Actions */}
                    <div className="flex items-center gap-4">
                        <form onSubmit={handleSearch} className="relative flex items-center w-72">
                            <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-[#76777d] dark:text-slate-400 pointer-events-none">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar apólices, cláusulas..."
                                className="w-full pl-8 pr-12 py-1.5 bg-[#eff4ff] dark:bg-slate-800/80 rounded-lg text-xs text-[#0b1c30] dark:text-white placeholder:text-[#76777d] dark:placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-[#0051d5] transition-all"
                            />
                            <kbd className="absolute right-2 font-['JetBrains_Mono'] text-[10px] text-[#565e74] dark:text-slate-400 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-[#e5eeff] dark:border-slate-600">
                                ⌘K
                            </kbd>
                        </form>

                        <div className="flex items-center gap-1 border-l border-[#dce9ff] dark:border-slate-800 pl-3">
                            {/* Dark Mode Toggle Button */}
                            <button
                                onClick={toggleColorMode}
                                className="p-2 text-[#45464d] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title={mode === 'dark' ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {mode === 'dark' ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            <button
                                onClick={() => navigate('/logs')}
                                className="relative p-2 text-[#45464d] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Notificações &amp; Auditoria"
                            >
                                <span className="material-symbols-outlined text-[20px]">notifications</span>
                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0051d5] text-white font-['JetBrains_Mono'] text-[9px] flex items-center justify-center font-bold">
                                    3
                                </span>
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 text-[#45464d] dark:text-slate-300 hover:text-[#0b1c30] dark:hover:text-white hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Configurações do Sistema"
                            >
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Body View */}
                <main className="pt-16 p-6 flex-1 bg-[#f8f9ff] dark:bg-[#0b0f19] transition-colors duration-200">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
