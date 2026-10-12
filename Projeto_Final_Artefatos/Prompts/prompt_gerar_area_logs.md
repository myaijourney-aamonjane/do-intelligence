# Prompt — Gerar a Área de Logs do Sistema

> **Objetivo:** prompt pronto a colar num assistente de IA para criar/regenerar a área de
> **Logs do Sistema** da plataforma **CSV Insight AI** (`frontend/src/pages/Logs.tsx`).
> Manter a identidade visual, os padrões e as convenções já existentes no projeto.

---

## Contexto da aplicação

- **Projeto:** CSV Insight AI — plataforma de consulta inteligente de ficheiros CSV com agentes de IA.
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + TanStack Query + Recharts + Axios + React Router.
- **Backend:** FastAPI (Uvicorn, porta 8000), rota base `/api`, autenticação JWT (Bearer token em `localStorage`).
- **Cliente HTTP:** `frontend/src/services/api.ts` (Axios com interceptor que injeta o token em `Authorization: Bearer`).
- **Tema:** claro/escuro com classes Material tokens (`bg-surface`, `bg-surface-variant`, `text-on-surface`,
  `text-primary`, `text-on-surface-variant`, `border-outline-variant`, `bg-surface-container-low`, etc.).
- **Componentes reutilizáveis disponíveis:** `useToast` (`../components/Toast`), `ConfirmDialog`,
  `Skeleton`, classes utilitárias `card`, `btn-primary`, `btn-secondary`, `btn-ghost`, `input`, `badge`,
  `page-title`, `page-subtitle`, `page-header`, `stat-card`.
- **Ícones:** Material Symbols (`material-symbols-outlined`).
- **Idioma da interface:** Português (pt-PT).

## Tipos e funções da API (já existentes em `../services/api.ts`)

- `SystemLogEntry` — `id`, `level`, `source`, `message`, `details`, `traceback`, `http_method`,
  `http_path`, `status_code`, `user_id`, `created_at`.
- `LogSummary` — `total`, `by_level` (`SUCCESS`/`INFO`/`WARNING`/`ERROR`/`CRITICAL`),
  `last_24h` (`total_events`, `errors`, `warnings`, `success`, `error_rate`), `daily_trend`.
- `LogInsight` — `source`, `level`, `count`, `last_message`, `last_at`, `recommendation`.
- `fetchLogs(params)` — GET `/api/logs` com filtros `level`, `q`, `from`, `to`, `page`, `page_size`
  → `LogListResponse` (`items`, `total`, `page`, `page_size`, `total_pages`).
- `fetchLogSummary()` — GET `/api/logs/summary`.
- `fetchLogInsights()` — GET `/api/logs/insights` → `{ top_insights: LogInsight[] }`.
- `clearLogs(params)` — DELETE `/api/logs` com filtros opcionais → `{ status, removed }`.

## Requisitos funcionais — Página de Logs

Criar a página de **Logs do Sistema** com:

### Cabeçalho

- Título "Logs do Sistema" com ícone `terminal` e subtítulo descritivo.
- Botões: "Exportar" (CSV), "Atualizar" (recarrega tudo) e "Limpar" (abre `ConfirmDialog`).

### Resumo (KPIs)

- 5 cartões de estatística (`StatCard`):
  - Total de Eventos (`summary.total`)
  - Sucessos (`by_level.SUCCESS`) com sub "+\{last24.success} últimas 24h"
  - Info (`by_level.INFO`)
  - Avisos (`by_level.WARNING`) com sub "+\{last24.warnings} últimas 24h"
  - Erros (`by_level.ERROR + by_level.CRITICAL`) com sub "+\{last24.errors} últimas 24h"
- Mostrar skeletons enquanto os dados carregam.

### Insights de Diagnóstico & Recomendações

- Secção colapsável "Insights de Diagnóstico & Recomendações" alimentada por `fetchLogInsights()`.
- Cada insight mostra: origem (fonte), badge de nível colorido, última mensagem, contagem
  (`\{count}x · data`), e uma caixa "Recomendação:" com o texto da recomendação.
- Se não houver insights, mostrar mensagem amigável ("Sem erros críticos registados...").

### Filtros

- Campo de pesquisa por texto (com debounce ~400ms) que filtra mensagem/traceback (`q`).
- Filtro por intervalo de datas (`from`/`to`) com inputs `type="date"`.
- Filtro por nível com chips coloridos: Todos, SUCCESS (verde), INFO (azul), WARNING (laranja),
  ERROR (vermelho), CRITICAL (vermelho escuro) — o chip ativo fica preenchido, os restantes como badge.
- Botão "Limpar filtros" quando existir algum filtro ativo.
- Alterar um filtro repõe a página para 1.

### Tabela de Logs

- Colunas: Nível (badge colorido), Origem (`font-mono`), Mensagem (truncada), HTTP
  (método + caminho), Data/Hora (localizada pt-PT), e coluna de expansão.
- Linha expansível que revela: Mensagem Completa, Detalhes (JSON formatado) e Traceback
  (com cor vermelha e scroll) e Status HTTP (colorido consoante 4xx/5xx) + User ID.
- Paginação (25 registos por página) com contador ("X–Y de Z registos") e botões Anterior/Seguinte.
- Estados vazios: "Nenhum log registado" (sem filtros) ou "Sem resultados" (com filtros).

### Exportação CSV

- Exportar todos os registos que correspondem aos filtros atuais (percorrendo todas as páginas),
  separador `;`, com BOM UTF-8 para Excel, ficheiro `logs_YYYY-MM-DD.csv`.
- Notificações de progresso/sucesso/erro via `toast`.

### Limpeza

- `ConfirmDialog` de confirmação (com mensagem consoante os filtros ativos) antes de chamar
  `clearLogs()` com os filtros aplicados; mostrar o número de registos removidos.

## Regras

- Implementar em `frontend/src/pages/Logs.tsx`, exportando o componente `Logs` por defeito.
- Usar apenas as funções e tipos exportados de `../services/api.ts`.
- Seguir o layout, estilos e padrões visuais da aplicação.
- Não adicionar comentários ao código, salvo se pedido.
- Não alterar backend — os endpoints já existem e funcionam.