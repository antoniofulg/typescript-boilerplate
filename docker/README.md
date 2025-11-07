# Docker Environment - Voto Inteligente

Este diretório contém a configuração Docker completa para o ambiente de desenvolvimento e produção do sistema Voto Inteligente.

## Estrutura

```
docker/
├── backend/
│   └── Dockerfile          # Build do backend NestJS
├── frontend/
│   └── Dockerfile          # Build do frontend Next.js
├── docker-compose.yml      # Orquestração de todos os serviços
├── .env.backend           # Variáveis de ambiente do backend
├── .env.frontend          # Variáveis de ambiente do frontend
└── .env.postgres          # Configurações do PostgreSQL
```

## Serviços

- **postgres**: Banco de dados PostgreSQL (porta 5432)
- **redis**: Cache e Pub/Sub (porta 6379)
- **backend**: API NestJS (porta 4000)
- **frontend**: Aplicação Next.js (porta 3000)

## Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+

## Como usar

### 1. Configurar variáveis de ambiente

Os arquivos `.env.*` estão configurados com valores padrão. Para produção, altere as senhas e secrets:

- `.env.postgres`: Credenciais do PostgreSQL
- `.env.backend`: Configurações do backend (JWT secrets, etc.)
- `.env.frontend`: Configurações do frontend

### 2. Subir o ambiente

```bash
cd docker
docker-compose up -d
```

### 3. Verificar logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Parar o ambiente

```bash
docker-compose down
```

### 5. Parar e remover volumes (limpar dados)

```bash
docker-compose down -v
```

## Migrações do Prisma

As migrações do Prisma são executadas automaticamente quando o container do backend inicia pela primeira vez. Para executar manualmente:

```bash
# Entrar no container do backend
docker-compose exec backend sh

# Executar migrações
npm run prisma:migrate:deploy

# Ou criar nova migração
npm run prisma:migrate
```

## Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Healthcheck Backend**: http://localhost:4000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Rebuild das imagens

Se houver mudanças no código, é necessário fazer rebuild:

```bash
# Rebuild de todos os serviços
docker-compose build

# Rebuild de um serviço específico
docker-compose build backend
docker-compose build frontend

# Rebuild e subir
docker-compose up -d --build
```

## Troubleshooting

### Backend não conecta ao banco

Verifique se o PostgreSQL está saudável:
```bash
docker-compose ps
```

Aguarde o healthcheck do PostgreSQL completar antes do backend iniciar.

### Erro de permissão

Se houver erros de permissão, verifique os logs:
```bash
docker-compose logs backend
```

### Limpar tudo e recomeçar

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Desenvolvimento

Para desenvolvimento local sem Docker, use os comandos normais do projeto:

```bash
# Backend
cd ../backend
npm install
npm run prisma:generate
npm run start:dev

# Frontend
cd ../frontend
npm install
npm run dev
```

