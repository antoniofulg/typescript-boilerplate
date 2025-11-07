# 🏛️ MVP – Sistema SaaS de Presença e Votação para Câmaras Municipais

**Versão:** 1.3  
**Data:** Novembro/2025  
**Autor:** Antonio Fulgêncio

---

## 📘 Visão Geral

O sistema é um **SaaS multi-tenant** para gerenciamento de **presença e votação de projetos** em Câmaras Municipais.  
Cada câmara possui um ambiente isolado dentro da mesma infraestrutura, com login, usuários, sessões e votações próprios.

A solução é composta por:

- **Frontend:** Next.js 16 (App Router, React Server Components, TailwindCSS)
- **Backend:** NestJS + Fastify (Node.js 24, TypeScript, Prisma ORM)
- **Banco de dados:** PostgreSQL
- **Cache & Pub/Sub:** Redis
- **Infraestrutura:** Docker + docker-compose
- **Autenticação:** JWT com RBAC (Role-Based Access Control)
- **Storage:** S3 (para relatórios, exportações e atas futuras)
- **Logs e Auditoria:** Interceptors e middlewares Fastify

---

## 🎯 Objetivo do MVP

Permitir que cada Câmara:

1. Cadastre usuários (vereadores, administradores, operadores)
2. Crie e gerencie sessões legislativas
3. Registre presença dos vereadores
4. Realize votações em tempo real
5. Gere relatórios de presença e votação

---

## 🧠 Papéis e Hierarquia de Acesso

| Nível                          | Nome          | Escopo                                                               | Permissões principais |
| ------------------------------ | ------------- | -------------------------------------------------------------------- | --------------------- |
| 🧠 **Superadmin**              | Global        | Gerencia todas as câmaras (tenants), cria e gerencia administradores |
| 🏛️ **Administrador da Câmara** | Tenant        | Cadastra vereadores, operadores, sessões e projetos                  |
| ⚙️ **Operador (Mesa)**         | Tenant        | Abre/encerra sessões e votações                                      |
| 👤 **Vereador**                | Tenant        | Marca presença e vota nos projetos                                   |
| 👁️ **Público (futuro)**        | Global/Tenant | Visualiza resultados e relatórios públicos                           |

---

## ⚙️ Requisitos Funcionais

### 1. Multi-Tenancy

- Cada Câmara é um tenant isolado identificado por `tenant_id` e `slug`.
- Acesso via subdomínio (`camara-{slug}.app.com`) ou header `x-tenant-id`.
- Middleware no Nest (Fastify hook `onRequest`) para resolver tenant.
- Superadmin gerencia tenants no domínio raiz (`app.com`).

### 2. Autenticação e Autorização

- Login via e-mail e senha.
- JWT (Access + Refresh Token).
- RBAC (roles: superadmin, admin, operador, vereador).
- Proteção de rotas por guards NestJS (`RolesGuard`).
- Validação e tipagem com `class-validator`.

### 3. Gestão de Sessões Legislativas

- Criar/editar/abrir/encerrar sessões.
- Associar projetos à pauta.
- Definir quorum mínimo.

### 4. Registro de Presença

- Vereador registra presença manualmente.
- Operador pode registrar presenças de outros vereadores.
- Registro inclui: `user_id`, `session_id`, `timestamp`, `ip`.
- Quorum atualizado em tempo real (via Redis pub/sub).

### 5. Votação de Projetos

- Tipos de voto: ✅ Sim | ❌ Não | ⚪ Abstenção.
- Apenas vereadores presentes podem votar.
- Operador controla abertura e encerramento da votação.
- Resultado visível em tempo real.
- Logs e auditoria automáticos.

### 6. Relatórios

- Relatório de presença por sessão.
- Relatório de votação por projeto.
- Exportação CSV e PDF.

### 7. Painel Administrativo

- Superadmin:
  - CRUD de câmaras (tenants)
  - Criação de administradores de câmara
  - Suspensão/reativação de tenants
- Admin da câmara:
  - CRUD de usuários locais
  - Gestão de sessões e projetos

---

## 🧩 Modelo de Dados (simplificado)

### `superadmins`

| Campo         | Tipo      | Descrição           |
| ------------- | --------- | ------------------- |
| id            | UUID      | Identificador       |
| name          | string    | Nome                |
| email         | string    | E-mail              |
| password_hash | string    | Senha criptografada |
| created_at    | timestamp | Criação             |

### `tenants`

| Campo      | Tipo                              | Descrição               |
| ---------- | --------------------------------- | ----------------------- |
| id         | UUID                              | Identificador do tenant |
| name       | string                            | Nome da Câmara          |
| slug       | string                            | Nome curto (subdomínio) |
| status     | enum(active, inactive, suspended) | Estado                  |
| created_at | timestamp                         | Criação                 |

### `users`

| Campo         | Tipo                            | Descrição        |
| ------------- | ------------------------------- | ---------------- |
| id            | UUID                            | Identificador    |
| tenant_id     | UUID                            | Câmara associada |
| name          | string                          | Nome             |
| email         | string                          | E-mail           |
| password_hash | string                          | Senha            |
| role          | enum(admin, operador, vereador) | Tipo             |
| created_at    | timestamp                       | Criação          |

### `sessions`

| Campo     | Tipo               | Descrição      |
| --------- | ------------------ | -------------- |
| id        | UUID               | Identificador  |
| tenant_id | UUID               | Câmara         |
| title     | string             | Nome da sessão |
| date      | date               | Data           |
| status    | enum(open, closed) | Estado atual   |

### `projects`

| Campo       | Tipo                          | Descrição     |
| ----------- | ----------------------------- | ------------- |
| id          | UUID                          | Identificador |
| tenant_id   | UUID                          | Câmara        |
| session_id  | UUID                          | Sessão        |
| title       | string                        | Título        |
| description | text                          | Descrição     |
| status      | enum(pending, voting, closed) | Situação      |

### `attendances`

| Campo      | Tipo      | Descrição     |
| ---------- | --------- | ------------- |
| id         | UUID      | Identificador |
| tenant_id  | UUID      | Câmara        |
| session_id | UUID      | Sessão        |
| user_id    | UUID      | Vereador      |
| present    | boolean   | Presença      |
| timestamp  | timestamp | Data/hora     |

### `votes`

| Campo      | Tipo                   | Descrição     |
| ---------- | ---------------------- | ------------- |
| id         | UUID                   | Identificador |
| tenant_id  | UUID                   | Câmara        |
| project_id | UUID                   | Projeto       |
| user_id    | UUID                   | Vereador      |
| vote       | enum(yes, no, abstain) | Voto          |
| timestamp   | timestamp              | Data/hora     |

---

## 🏗️ Arquitetura Técnica

### 🔹 Backend

- **Framework:** NestJS + Fastify
- **Linguagem:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Cache e Pub/Sub:** Redis
- **Storage:** S3 (MinIO em dev)
- **Auth:** JWT + Guards + Decorators
- **Auditoria:** Interceptors NestJS
- **Documentação:** Swagger

### 🔹 Frontend

- **Framework:** Next.js 16 (App Router)
- **UI:** TailwindCSS + shadcn/ui
- **Estado global:** Zustand / Context API
- **Autenticação:** JWT (cookie HttpOnly)
- **Realtime:** WebSocket / SSE (para votações e quorum)
- **Empacotamento:** Docker multi-stage

---

## 🐳 Docker e Infraestrutura

### Estrutura dos Containers

| Serviço    | Descrição        | Porta |
| ---------- | ---------------- | ----- |
| `frontend` | Next.js 16       | 3000  |
| `backend`  | NestJS + Fastify | 4000  |
| `postgres` | Banco de dados   | 5432  |
| `redis`    | Cache e Pub/Sub  | 6379  |

### docker-compose.yml (resumo)

- Sobe containers de backend, frontend, postgres e redis.
- Healthchecks automáticos.
- Variáveis de ambiente via `.env.backend` e `.env.frontend`.

### Dockerfile (NestJS)

- Multi-stage build (`builder` + `runner`).
- Usuário não-root.
- Healthcheck via endpoint `/health`.
- CMD: `node dist/src/main.js`.

### Dockerfile (Next.js)

- Multi-stage build.
- Cache de dependências otimizado.
- CMD: `npm run start`.

---

## 🔒 Segurança

- TLS obrigatório (via NGINX ou proxy reverso).
- JWT com expiração curta (15m) + refresh tokens (7d).
- RBAC aplicado a todas as rotas.
- Isolamento de dados via `tenant_id`.
- Proteção contra rate-limit e brute-force (Fastify plugin).
- Logs auditáveis com IP, timestamp e ação.

---

## 🧰 CI/CD (recomendado)

- **GitHub Actions pipeline:**
  1. Lint + TypeCheck (ESLint, tsc)
  2. Testes unitários
  3. Build Docker images (backend, frontend)
  4. Push para registry
  5. Deploy automático (Kubernetes / ECS / Render)
  6. Executar migrations (`prisma migrate deploy`)

---

## 📈 Requisitos Não Funcionais

| Categoria               | Requisito                          |
| ----------------------- | ---------------------------------- |
| **Disponibilidade**     | 99% em horário de sessão           |
| **Performance**         | <300ms por requisição crítica      |
| **Escalabilidade**      | Horizontal (multi-tenant)          |
| **Backup**              | Diário por tenant                  |
| **Auditoria**           | Logs e interceptors                |
| **Acessibilidade**      | WCAG básica (contraste, teclado)   |
| **Internacionalização** | PT-BR padrão                       |
| **Segurança**           | TLS, JWT, RBAC, logs de auditoria  |
| **Infraestrutura**      | Containers + Compose + Cloud-ready |

---

## 🧾 Critérios de Aceitação do MVP

1. Superadmin pode cadastrar câmaras e administradores.
2. Admin de câmara pode criar usuários, sessões e projetos.
3. Vereador pode marcar presença e votar.
4. Operador controla votações e visualiza resultados.
5. Dados são isolados por tenant.
6. Frontend e backend funcionam em containers Docker.
7. Stack completa sobe via `docker-compose up`.
8. API Fastify responde com healthcheck OK.
9. Relatórios básicos exportáveis (CSV/PDF).
10. RBAC e autenticação JWT operacionais.

---

## 🧩 Futuras Extensões

- Votação secreta e votação por blocos.
- Assinatura digital (Gov.br ou ICP-Brasil).
- Geração automática de atas.
- Portal público de transparência.
- Módulo de billing e planos (SaaS completo).
- Integração com streaming (YouTube / RTMP).

---

## ✅ Conclusão

Este documento define a base técnica e funcional do **MVP SaaS multi-tenant** para controle de presença e votação legislativa,  
com foco em **escalabilidade, segurança e manutenção simplificada**.

A arquitetura **NestJS + Fastify + Next.js 16 + Docker** garante:

- Alto desempenho
- Tipagem e modularidade
- Facilidade de deploy
- Extensibilidade futura

---

**Repositório sugerido:**
/frontend → Next.js 16 (App Router)
/backend → NestJS + Fastify + Prisma
/docker → Dockerfiles e Compose
/docs → Documentação e ERD

