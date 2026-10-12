# Prompt Reutilizável — Funcionalidades Base (sem Negócio)

> **Objetivo:** prompt pronto a colar para criar a camada de infraestrutura de uma aplicação
> (autenticação, acessos, planos, logs, checkpoints, etc.) **sem qualquer lógica de negócio**.
> Reutilizar em novos projetos preenchendo os `{PLACEHOLDERS}` e colando num assistente de IA.

---

## Como usar

1. Copia o bloco `## PROMPT` abaixo.
2. Substitui os `{PLACEHOLDERS}` pelos dados reais do projeto.
3. Cola no assistente de IA e pede para implementar.

---

## PROMPT

```
Cria a camada de funcionalidades BASE de uma aplicação — SEM lógica de negócio.
Aplica-se a qualquer projeto futuro; a lógica de negócio será adicionada depois.

## Contexto da aplicação
- Nome: {InsurMinds}
- Descrição curta: {Comunicação proativa com segurados}
- Stack backend: {FastAPI}
- Stack frontend: {React+Vite}
- Base de dados: {SQLite}
- ORM/Migrations: {SQLAlchemy+Alembic}
- Linguagem: {Python}
- Autenticação atual: {JWT}
- Diretório de trabalho: {./}

## Requisitos funcionais — Módulo a Módulo

### 1. Utilizadores e Autenticação
- Modelo `User` (sem campos de negócio): id, email, password hash, nome, ativo,
  data_criacao, data_atualizacao, ultimo_login.
- Registro, login, logout, refresh token e recuperação de password.
- Perfis de sistema (admin, utilizador) + tabela `roles` e `user_roles`.

### 2. Acessos e Permissões (RBAC)
- Tabelas `permissions` e `role_permissions` (permissão = ação + recurso).
- Middleware/decorator para proteger endpoints: exige autenticação e permissão.
- API de gestão de roles/permissões apenas para admin.
- Defaults: role `admin` com todas as permissões; role `user` sem privilégios.

### 3. Planos (Subscrições)
- Tabela `plan`: nome, codigo, descricao, limites genéricos (JSON), preco_mensal, ativo.
- Tabela `user_plan`: utilizador, plano, data_inicio, data_fim, estado.
- Endpoints CRUD de planos (admin) e endpoint "meu plano" (utilizador).
- Verificação centralizada de limite de um plano (helper genérico, sem negócio).

### 4. Logs / Auditoria
- Logs estruturados da aplicação (ficheiro + base de dados, níveis: DEBUG..CRITICAL).
- Tabela `audit_log`: utilizador, acao, entidade, entidade_id, dados_antes, dados_depois, ip, user_agent, data.
- Interceptor/decorator de auditoria para operações de escrita (create/update/delete).
- Endpoint de consulta/filtro de logs (admin) com paginação.

### 5. Checkpoints
- Tabela `checkpoint`: chave_ctx (id da tarefa/fluxo), tipo, estado (JSON), passo, criado_em, atualizado_em.
- API: criar/atualizar/resumir/eliminar checkpoints (resume de tarefas interrompidas).
- Semântica genérica — não ligar a nenhum fluxo de negócio.

### 6. Configurações do Sistema
- Tabela `setting` (chave, valor, tipo, descricao, atualizado_em) + cache.
- CRUD admin e leitura pública por chave.

### 7. Notificações (base)
- Tabela `notification`: utilizador, tipo, titulo, corpo, lida, criada_em.
- Endpoints: listar (com paginação), marcar lida, marcar todas lidas, contar não lidas.

### 8. Health & Status
- Endpoint `/health` e `/health/db` (liveness/readiness) para monitorização.

## Requisitos não funcionais
- Migrações para criar/alterar esquema da BD.
- Seed de dados iniciais: admin padrão, roles/permissões base, planos exemplo.
- Tratamento global de erros com respostas JSON consistentes.
- Validação de input em todos os endpoints.
- Paginação consistente em todas as listagens.
- Documentação da API (OpenAPI/Swagger).
- Testes de base: autenticação, RBAC, CRUD planos, logs e checkpoints.
- Segurança: passwords com hash (bcrypt/argon2), nunca devolver password, rate-limit no login.

## Entregáveis
1. Esquema BD + migrações + seed.
2. Código backend completo dos módulos acima.
3. Endpoints frontend (se aplicável) para: login, gestão de planos, logs e permissões.
4. Testes automatizados.
5. README curto com: como correr, credenciais do seed e endpoints principais.

## Regras
- NÃO implementar nenhuma funcionalidade de negócio específica (relatórios, CSV, IA, etc.).
- Manter os módulos desacoplados e reutilizáveis.
- Seguir as convenções de código já existentes no repositório.
- Não adicionar comentários ao código, salvo se pedido.
```

---

## Notas

- **Modular e desacoplado:** cada módulo deve poder ser usado ou descartado isoladamente.
- **Expandível:** o prompt cobre o mínimo comum; acrescenta módulos (ex.: quotas de
  armazenamento, empresas/tenants, webhooks, templates de email) conforme o projeto.
- **Prompt inicial:** começar por apenas **1, 2, 4 e 5** (autenticação, RBAC, logs e
  checkpoints) e depois adicionar os restantes em iterações — resultados mais estáveis.
