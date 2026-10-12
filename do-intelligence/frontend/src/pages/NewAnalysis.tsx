import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument, processDocument, listDocuments } from '../api'

export default function NewAnalysis() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [policyType, setPolicyType] = useState('abc')
  const [extractionLevel, setExtractionLevel] = useState('full')
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [progressStep, setProgressStep] = useState<number>(0)
  const [stepLabel, setStepLabel] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fetchDocs = async () => {
    try {
      const res = await listDocuments()
      setDocuments(res.data || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Recente'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return 'Recente'
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recente'
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      const lowerName = file.name.toLowerCase()
      const hasValidExt =
        lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg')

      if (validTypes.includes(file.type) || hasValidExt) {
        setSelectedFile(file)
        setError(null)
      } else {
        setError('Formato não suportado. Por favor, envie arquivos PDF ou Imagens (PNG/JPG).')
      }
    }
  }

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione ou arraste uma apólice em formato PDF ou Imagem.')
      return
    }

    setLoading(true)
    setError(null)
    setProgressStep(1)
    setStepLabel('1/4: Recebendo documento e registrando hash de auditoria...')

    try {
      // Step 1: Upload
      const uploadRes = await uploadDocument(selectedFile)
      const docId = uploadRes.data.id

      // Refresh recent list immediately with newly uploaded document
      fetchDocs()

      setProgressStep(2)
      setStepLabel('2/4: Extraindo texto via PyMuPDF / OCR e identificando cláusulas D&O...')
      await new Promise((r) => setTimeout(r, 600))

      setProgressStep(3)
      setStepLabel('3/4: Indexando RAG vector chunks no ChromaDB e executando Pydantic Agent...')
      await new Promise((r) => setTimeout(r, 800))

      // Step 2: Process Document & Generate Policy
      const processRes = await processDocument(docId)
      const policyId = processRes.data?.policy_id
      const processStatus = processRes.data?.status

      // Refresh list with final status
      fetchDocs()

      if (processStatus === 'FAILED' || !policyId) {
        const errorMsg =
          processRes.data?.error ||
          processRes.data?.detail ||
          (processRes.data?.message !== 'Document processing completed' ? processRes.data?.message : null) ||
          'A análise do documento falhou. Verifique o arquivo e tente novamente.'
        setError(errorMsg)
        setLoading(false)
        return
      }

      setProgressStep(4)
      setStepLabel('4/4: Análise concluída com sucesso! Redirecionando para os detalhes da apólice...')

      setTimeout(() => {
        navigate(`/policies/${policyId}`)
      }, 800)
    } catch (err: any) {
      console.error('Upload/Process error:', err)
      let msg = 'Erro ao processar documento. Tente novamente.'
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'O processamento excedeu o tempo limite do servidor. O arquivo pode ser muito extenso ou o serviço de IA demorou para responder. Tente novamente.'
      } else if (err?.response?.data?.detail) {
        const detail = err.response.data.detail
        if (typeof detail === 'string') {
          msg = detail
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
        } else if (typeof detail === 'object') {
          msg = detail.message || JSON.stringify(detail)
        }
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message
      } else if (err?.message) {
        msg = `Falha de conexão com a API: ${err.message}`
      }
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-[#565e74] dark:text-slate-400 mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#0b1c30] dark:hover:text-white cursor-pointer">
              Dashboard
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span onClick={() => navigate('/policies')} className="hover:text-[#0b1c30] dark:hover:text-white cursor-pointer">
              Apólices
            </span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#0051d5] dark:text-blue-400 font-semibold">Nova Análise</span>
          </div>
          <h1 className="font-bold text-2xl text-[#0b1c30] dark:text-white tracking-tight">Nova Análise de Apólice</h1>
          <p className="text-xs text-[#565e74] dark:text-slate-400 mt-0.5">
            Carregue apólices em PDF ou Imagem para extração profunda de coberturas, exclusões e evidências D&amp;O.
          </p>
        </div>

        {/* Stepper Overview Header */}
        <div className="flex items-center gap-2 bg-[#eff4ff] dark:bg-slate-800 px-4 py-2 rounded-xl border border-[#dce9ff] dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#0051d5] text-white flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold">
              1
            </div>
            <span className="text-xs font-semibold text-[#0b1c30] dark:text-white">Upload</span>
          </div>
          <div className="w-6 h-[2px] bg-[#dbe1ff] dark:bg-slate-700"></div>
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-[#565e74] dark:text-slate-300 flex items-center justify-center font-['JetBrains_Mono'] text-xs">
              2
            </div>
            <span className="text-xs text-[#565e74] dark:text-slate-300">OCR &amp; Extração</span>
          </div>
          <div className="w-6 h-[2px] bg-[#dce9ff] dark:bg-slate-700"></div>
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-[#565e74] dark:text-slate-300 flex items-center justify-center font-['JetBrains_Mono'] text-xs">
              3
            </div>
            <span className="text-xs text-[#565e74] dark:text-slate-300">Score &amp; RAG</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid Workspace (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Dropzone & Selected Files */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Upload Surface Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl p-8 border-2 border-dashed transition-all text-center group ${isDragging
              ? 'border-[#0051d5] bg-[#eff4ff] dark:bg-blue-950/40 scale-[1.01]'
              : 'border-[#dce9ff] dark:border-slate-700 bg-white dark:bg-[#111827] hover:border-[#0051d5] shadow-sm hover:shadow-md'
              }`}
          >
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform ${isDragging
                  ? 'bg-[#0051d5] text-white scale-110'
                  : 'bg-[#eff4ff] dark:bg-blue-950/40 text-[#0051d5] dark:text-blue-400 group-hover:scale-105'
                  }`}
              >
                <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
              </div>
              <h3 className="font-bold text-lg text-[#0b1c30] dark:text-white">
                {isDragging ? 'Solte o documento aqui...' : 'Arraste os documentos para aqui'}
              </h3>
              <p className="text-xs text-[#565e74] dark:text-slate-400 mt-1">
                ou <span className="text-[#0051d5] dark:text-blue-400 font-semibold underline">selecione ficheiros do seu computador</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="px-2 py-0.5 rounded bg-[#f8f9ff] dark:bg-slate-800 font-['JetBrains_Mono'] text-[11px] text-[#565e74] dark:text-slate-300">
                  PDF
                </span>
                <span className="px-2 py-0.5 rounded bg-[#f8f9ff] dark:bg-slate-800 font-['JetBrains_Mono'] text-[11px] text-[#565e74] dark:text-slate-300">
                  PNG
                </span>
                <span className="px-2 py-0.5 rounded bg-[#f8f9ff] dark:bg-slate-800 font-['JetBrains_Mono'] text-[11px] text-[#565e74] dark:text-slate-300">
                  JPG / JPEG
                </span>
                <span className="text-[#565e74] text-xs">•</span>
                <span className="text-xs text-[#565e74] dark:text-slate-400">Máx. 50 MB</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 bg-[#f8f9ff] dark:bg-slate-800 px-3 py-1 rounded-full text-[11px] text-[#565e74] dark:text-slate-400">
                <span className="material-symbols-outlined text-[14px] text-[#0051d5] dark:text-blue-400">lock</span>
                <span>Criptografia AES-256 e conformidade com LGPD/GDPR</span>
              </div>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-12 bg-[#eff4ff] dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-[#0051d5] dark:text-blue-400">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#0b1c30] dark:text-white">{selectedFile.name}</span>
                  <span className="text-xs text-[#565e74] dark:text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • OCR Nativo Pronto
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-[#565e74] hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                title="Remover arquivo"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          )}

          {/* Recent Submissions List */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#0b1c30] dark:text-white uppercase tracking-wider">
                Documentos Submetidos Recentes
              </h3>
              <span className="text-[11px] text-[#565e74] dark:text-slate-400 font-medium">
                {documents.length} no total
              </span>
            </div>
            {documents.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {documents.slice(0, 6).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-[#f8f9ff] dark:bg-slate-800/60 rounded-xl text-xs hover:bg-[#eff4ff] dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400 text-[18px]">
                          {doc.mime_type?.includes('image') ? 'image' : 'description'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#0b1c30] dark:text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#565e74] dark:text-slate-400">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>{formatDateTime(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded font-bold shrink-0 border ${doc.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : doc.status === 'FAILED'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#565e74] dark:text-slate-400">Nenhum documento anterior cadastrado.</p>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Parameters */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400 text-[22px]">tune</span>
                <h3 className="font-bold text-base text-[#0b1c30] dark:text-white">Parâmetros de Análise por IA</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#eff4ff] dark:bg-blue-950/40 font-['JetBrains_Mono'] text-xs text-[#0051d5] dark:text-blue-400 font-semibold">
                LangGraph RAG
              </span>
            </div>

            {/* Policy Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#0b1c30] dark:text-white uppercase">Tipo de Apólice</label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="w-full bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-[#0b1c30] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0051d5]"
              >
                <option value="abc">D&amp;O Corporativo Completo (Side A, B e C)</option>
                <option value="side-a">D&amp;O Side A Dedicado (Excesso / DIC)</option>
                <option value="pos">D&amp;O Operações de Mercado de Capitais (POSI)</option>
                <option value="financial">D&amp;O para Instituições Financeiras (FI)</option>
              </select>
              <span className="text-[11px] text-[#565e74] dark:text-slate-400">
                Inclui proteção direta a administradores, reembolso corporativo e entidades listadas.
              </span>
            </div>

            {/* Extraction Depth Radio */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-xs font-bold text-[#0b1c30] dark:text-white uppercase">Nível de Extração &amp; Auditoria</label>
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f9ff] dark:bg-slate-800 border border-[#e5eeff] dark:border-slate-700 cursor-pointer hover:bg-[#eff4ff] dark:hover:bg-slate-700/60 transition-colors">
                <input
                  type="radio"
                  name="extractionLevel"
                  value="full"
                  checked={extractionLevel === 'full'}
                  onChange={() => setExtractionLevel('full')}
                  className="mt-0.5 accent-[#0051d5]"
                />
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-[#0b1c30] dark:text-white">Análise Completa D&amp;O (Recomendado)</span>
                  <span className="text-[#565e74] dark:text-slate-400 text-[11px] mt-0.5">
                    Extrai limites, franquias, exclusões de conduta (Severability), poluição e grounding de páginas.
                  </span>
                </div>
              </label>
            </div>

            {/* System Info Box */}
            <div className="p-3 bg-[#eff4ff] dark:bg-blue-950/30 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0051d5] dark:text-blue-400 text-[22px]">psychology</span>
              <div className="flex flex-col text-xs">
                <span className="font-bold text-[#0b1c30] dark:text-white">Modelo Especializado</span>
                <span className="text-[#565e74] dark:text-slate-400 text-[11px]">
                  Treinado em apólices comerciais latino-americanas e internacionais D&amp;O.
                </span>
              </div>
            </div>
          </div>

          {/* Underwriter Card */}
          <div className="p-4 bg-[#f8f9ff] dark:bg-slate-800/60 rounded-2xl border border-[#e5eeff] dark:border-slate-700 text-xs text-[#565e74] dark:text-slate-300 flex flex-col gap-1">
            <span className="font-bold text-[#0b1c30] dark:text-white flex items-center gap-1 uppercase">
              <span className="material-symbols-outlined text-[16px] text-[#0051d5] dark:text-blue-400">info</span>
              Próxima Etapa
            </span>
            <p>
              Ao acionar, a IA executará OCR, chunking vetorial e classificação de cláusulas. Ao finalizar, abrirá automaticamente os detalhes da apólice.
            </p>
          </div>
        </div>
      </div>

      {/* Persistent Execution Bar */}
      <div className="mt-8 p-5 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-[#e5eeff] dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${loading ? 'bg-[#0051d5] text-white animate-pulse' : 'bg-[#eff4ff] dark:bg-blue-950/40 text-[#0051d5] dark:text-blue-400'}`}>
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'auto_awesome'}
            </span>
          </div>
          <div className="flex flex-col text-xs">
            <span className="font-bold text-[#0b1c30] dark:text-white">
              {selectedFile ? `Fila Pronta: ${selectedFile.name}` : 'Aguardando seleção ou arrasto de arquivo'}
            </span>
            <span className="text-[#565e74] dark:text-slate-400">
              {loading ? stepLabel : 'Pronto para iniciar inferência e abertura dos detalhes da apólice'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => navigate('/')}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#f8f9ff] dark:bg-slate-800 hover:bg-[#eff4ff] dark:hover:bg-slate-700 text-[#0b1c30] dark:text-white text-xs font-semibold transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleStartAnalysis}
            disabled={!selectedFile || loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-xs transition-all shadow-md ${!selectedFile || loading
              ? 'bg-gray-400 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-[#0051d5] hover:bg-[#316bf3] shadow-[#0051d5]/20'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>{loading ? 'Processando Pipeline...' : 'Iniciar Análise com IA'}</span>
          </button>
        </div>
      </div>

      {/* AI Processing Overlay Modal */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-[#e5eeff] dark:border-slate-700 p-8 w-full max-w-md mx-4 flex flex-col items-center gap-6">
            {/* Spinner */}
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#eff4ff] dark:border-slate-700 border-t-[#0051d5] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-[#0051d5] dark:text-blue-400 animate-pulse">auto_awesome</span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#0b1c30] dark:text-white">Análise por IA em Andamento</h3>
              <p className="text-xs text-[#565e74] dark:text-slate-400 mt-1">Pipeline LangGraph · PyMuPDF OCR · ChromaDB RAG</p>
            </div>

            {/* Progress Steps */}
            <div className="w-full flex flex-col gap-2">
              {[
                { step: 1, label: 'Upload e Registo de Auditoria' },
                { step: 2, label: 'OCR e Extracção de Texto' },
                { step: 3, label: 'Indexação RAG e Agente Pydantic' },
                { step: 4, label: 'Persistência e Navegação' },
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all ${progressStep > step
                    ? 'bg-emerald-500 text-white'
                    : progressStep === step
                      ? 'bg-[#0051d5] text-white animate-pulse'
                      : 'bg-[#eff4ff] dark:bg-slate-700 text-[#565e74] dark:text-slate-400'
                    }`}>
                    {progressStep > step
                      ? <span className="material-symbols-outlined text-[14px]">check</span>
                      : step}
                  </div>
                  <span className={`text-xs font-semibold ${progressStep >= step ? 'text-[#0b1c30] dark:text-white' : 'text-[#565e74] dark:text-slate-400'
                    }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full">
              <div className="w-full h-1.5 bg-[#eff4ff] dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0051d5] to-[#316bf3] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((progressStep / 4) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-[#565e74] dark:text-slate-400 mt-2 text-center">{stepLabel}</p>
            </div>

            {/* AI Metadata */}
            <div className="w-full grid grid-cols-3 gap-2 text-[10px] text-center">
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">Motor</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">Pydantic Agent</span>
              </div>
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">Vector Store</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">ChromaDB</span>
              </div>
              <div className="bg-[#f8f9ff] dark:bg-slate-800 rounded-lg p-2 flex flex-col">
                <span className="text-[#0051d5] dark:text-blue-400 font-bold uppercase">OCR</span>
                <span className="text-[#0b1c30] dark:text-white font-semibold">PyMuPDF</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}