# Prompt — Gerar a Área de Configurações (Definições & Observabilidade)

> **Objetivo:** prompt pronto a colar num assistente de IA para criar/regenerar a área de
> **Configurações** da plataforma **CSV Insight AI** (`frontend/src/pages/Settings.tsx`).
> Manter a identidade visual, os padrões e as convenções já existentes no projeto.

---

## Contexto da aplicação

- **Projeto:** CSV Insight AI — plataforma de consulta inteligente de ficheiros CSV com agentes de IA.
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + TanStack Query + Recharts + Axios + React Router.
- **Backend:** FastAPI (Uvicorn, porta 8000), rota base `/api`, autenticação JWT (Bearer token em `localStorage`).
- **Cliente HTTP:** `frontend/src/services/api.ts` (Axios com interceptor que injeta o token em `Authorization: Bearer`).
- **Tema:** claro/escuro com classes Material tokens (`bg-surface`, `bg-surface-variant`, `text-on-surface`, `text-primary`, `text-on-surface-variant`, `border-outline-variant`, etc.).
- **Componentes reutilizáveis disponíveis:** `useToast` (`../components/Toast`), `ConfirmDialog`, `Skeleton`, classes utilitárias `card`, `btn-primary`, `btn-secondary`, `btn-ghost`, `input`, `badge`, `page-title`, `page-subtitle`, `page-header`, `stat-card`.
- **Ícones:** Material Symbols (`material-symbols-outlined`).
- **Idioma da interface:** Português (pt-PT).

## Requisitos funcionais — Página de Configurações

Criar a página de **Definições & Observabilidade** com **três separadores (tabs)**:

### Tab 1 — Modelos de IA por Agente

- Carregar a lista de agentes e o catálogo de modelos gratuitos disponíveis através de
  `fetchAgentSettings()` (GET `/api/settings/agents`) e guardar em estado.
- Mostrar:
  - Uma secção "Catálogo de LLMs Gratuitos Recomendados" com os modelos (`available_models`:
    `id`, `name`, `provider`, `description`, `is_free`) em cartões com badge "Grátis".
  - Uma secção "Configuração dos Agentes" com um cartão por agente (`agents`: `id`, `name`,
    `description`, `model_name`, `temperature`, `max_tokens`).
- Cada cartão de agente permite escolher o modelo atribuído num `<select>` (atualização local de estado;
  se o modelo atual não estiver no catálogo, mostrar opção "Personalizado (<modelo>)").
- Botão "Salvar Alterações" que envia o mapeamento para `updateAgentSettings(payload)`
  (POST `/api/settings/agents`) com a lista de `{ agent_name, model_name, temperature, max_tokens }`.
- Mostrar estados de carregamento (spinner/pulse) e feedback com `toast` em caso de sucesso ou erro.

### Tab 2 — Métricas & Observabilidade

- Carregar métricas via `fetchAgentMetrics()` (GET `/api/settings/metrics`) → `AgentMetricsResponse`
  (`summary`, `agent_stats`, `recent_logs`).
- Mostrar 4 cartões KPI:
  - Latência Média (`summary.avg_latency_ms` ms)
  - Execuções Totais (`summary.total_executions`)
  - Cache Hit Rate (`summary.cache_hit_rate` %)
  - Tokens & Custo Estimado (`summary.total_tokens` e `summary.total_cost_usd`)
- Mostrar "Desempenho por Agente" com barras de progresso de latência média e tokens consumidos
  (`agent_stats`).
- Mostrar tabela "Últimas Execuções Registadas" com colunas: Agente/Origem, Latência, Tokens
  (prompt/output), Estado Cache (badge "Cache Hit" verde / "LLM Process" azul), Data/Hora (`recent_logs`).
- Botões: "Atualizar" (recarrega métricas) e "Limpar Registos" (pede confirmação e chama
  `clearAgentMetrics()` — DELETE `/api/settings/metrics`).
- Estados vazios com mensagens amigáveis em português.

### Tab 3 — Estado dos Agentes

- Carregar estado via `fetchAgentStatus()` (GET `/api/agents/status`) → `AgentStatusResponse`
  (`api_key_configured`, `agents`).
- Mostrar um aviso "Sem chave de API OpenRouter" quando `api_key_configured === false`.
- Tabela com colunas: Agente (nome + ponto de estado colorido e pulsante), Descrição, Estado
  (badge com ícone), Modelo, Atividade (24h: execuções + latência média), Motivo.
- Estados possíveis e respetivos estilos: `online` (verde), `available` (azul), `error` (vermelho),
  `offline` (cinzento), com badge, ícone e cor coerentes.
- Botão "Atualizar" para recarregar o estado.

## Regras

- Implementar em `frontend/src/pages/Settings.tsx`, exportando o componente `Settings` por defeito.
- Usar apenas os tipos exportados de `../services/api.ts` (`AgentSetting`, `FreeModel`,
  `AgentMetricsResponse`, `AgentStatusResponse`, `AgentStatusEntry`) e as funções já existentes.
- Seguir o layout, estilos e padrões visuais da aplicação (tabs com sublinhado primário, cartões,
  botões, ícones Material Symbols).
- Não adicionar comentários ao código, salvo se pedido.
- Não alterar backend — os endpoints já existem e funcionam.