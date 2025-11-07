.PHONY: help build up down restart logs urls ps clean shell-backend shell-frontend migrate prisma-studio prisma-studio-stop install-backend install-frontend lint-backend lint-frontend format-backend format-frontend hosts-add hosts-remove

# Variáveis
DOCKER_COMPOSE = docker-compose
DOCKER_DIR = docker
COMPOSE_FILE = $(DOCKER_DIR)/docker-compose.yml

# Variáveis de ambiente para aliases (com valores padrão)
FRONTEND_ALIAS ?= voto-inteligente.front.local
BACKEND_ALIAS ?= voto-inteligente.backend.local
export FRONTEND_ALIAS
export BACKEND_ALIAS

# Cores para output
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[1;33m
CYAN = \033[0;36m
BOLD = \033[1m
NC = \033[0m # No Color

help: ## Mostra esta mensagem de ajuda
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║     🚀 Voto Inteligente - Comandos Disponíveis           ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos Docker:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

hosts-add: ## Adiciona aliases ao arquivo /etc/hosts
	@echo "$(GREEN)📝 Adicionando aliases ao /etc/hosts...$(NC)"
	@chmod +x scripts/manage-hosts.sh
	@./scripts/manage-hosts.sh add $(FRONTEND_ALIAS) $(BACKEND_ALIAS)
	@echo "$(CYAN)💡 Aliases configurados:$(NC)"
	@echo "   Frontend: $(BOLD)http://$(FRONTEND_ALIAS):3000$(NC)"
	@echo "   Backend:  $(BOLD)http://$(BACKEND_ALIAS):4000$(NC)"

hosts-remove: ## Remove aliases do arquivo /etc/hosts
	@echo "$(YELLOW)🗑️  Removendo aliases do /etc/hosts...$(NC)"
	@chmod +x scripts/manage-hosts.sh
	@./scripts/manage-hosts.sh remove $(FRONTEND_ALIAS) $(BACKEND_ALIAS)

build: hosts-add ## Build das imagens Docker (sem cache) e adiciona aliases ao hosts
	@echo "$(GREEN)🔨 Construindo imagens Docker...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) build --no-cache

build-fast: hosts-add ## Build das imagens Docker (com cache) e adiciona aliases ao hosts
	@echo "$(GREEN)🔨 Construindo imagens Docker (com cache)...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) build

up: ## Subir todos os serviços
	@echo "$(GREEN)🚀 Iniciando serviços...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) up -d
	@sleep 3
	@$(MAKE) urls

down: ## Parar todos os serviços
	@echo "$(YELLOW)🛑 Parando serviços...$(NC)"
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "backend.*Up"; then \
		$(DOCKER_COMPOSE) exec backend pkill -f "prisma studio" 2>/dev/null && \
		echo "$(GREEN)✅ Prisma Studio parado$(NC)" || true; \
	fi
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) down

restart: ## Reiniciar todos os serviços
	@echo "$(YELLOW)🔄 Reiniciando serviços...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) restart
	@sleep 3
	@$(MAKE) urls

logs: ## Ver logs de todos os serviços
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f

logs-backend: ## Ver logs do backend
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## Ver logs do frontend
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f frontend

urls: ## Mostrar URLs dos serviços
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║     $(BOLD)🚀 Voto Inteligente - Serviços em Execução$(NC)$(GREEN)          ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Status dos Serviços:$(NC)"
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "frontend.*Up"; then \
		echo "   $(GREEN)✅ Frontend$(NC)"; \
		echo "      $(BLUE)🌐 URL (localhost):$(NC) $(BOLD)http://localhost:3000$(NC)"; \
		echo "      $(BLUE)🌐 URL (alias):$(NC) $(BOLD)http://$(FRONTEND_ALIAS):3000$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Frontend ainda está iniciando...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "backend.*Up"; then \
		echo "   $(GREEN)✅ Backend$(NC)"; \
		echo "      $(BLUE)🌐 API (localhost):$(NC) $(BOLD)http://localhost:4000$(NC)"; \
		echo "      $(BLUE)🌐 API (alias):$(NC) $(BOLD)http://$(BACKEND_ALIAS):4000$(NC)"; \
		echo "      $(BLUE)🏥 Healthcheck:$(NC) $(BOLD)http://localhost:4000/health$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Backend ainda está iniciando...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "postgres.*Up"; then \
		echo "   $(GREEN)✅ PostgreSQL$(NC)"; \
		echo "      $(BLUE)🗄️  Host:$(NC) $(BOLD)localhost:5432$(NC)"; \
		echo "      $(BLUE)📊 Database:$(NC) $(BOLD)voto_inteligente$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ PostgreSQL ainda está iniciando...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "redis.*Up"; then \
		echo "   $(GREEN)✅ Redis$(NC)"; \
		echo "      $(BLUE)💾 Host:$(NC) $(BOLD)localhost:6379$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Redis ainda está iniciando...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) exec backend pgrep -f "prisma studio" > /dev/null 2>&1; then \
		echo "   $(GREEN)✅ Prisma Studio$(NC)"; \
		echo "      $(BLUE)🎨 URL:$(NC) $(BOLD)http://localhost:5555$(NC)"; \
		echo "      $(CYAN)💡 Para parar:$(NC) $(BOLD)make prisma-studio-stop$(NC)"; \
	else \
		echo "   $(YELLOW)⚪ Prisma Studio não está rodando$(NC)"; \
		echo "      $(CYAN)💡 Para iniciar:$(NC) $(BOLD)make prisma-studio$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    $(BOLD)📝 Comandos Úteis$(NC)$(GREEN)                        ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "   $(CYAN)Ver logs:$(NC)        $(BOLD)make logs$(NC)"
	@echo "   $(CYAN)Parar serviços:$(NC)  $(BOLD)make down$(NC)"
	@echo "   $(CYAN)Status:$(NC)          $(BOLD)make ps$(NC)"
	@echo "   $(CYAN)Prisma Studio:$(NC)   $(BOLD)make prisma-studio$(NC)"
	@echo "   $(CYAN)Ver URLs novamente:$(NC) $(BOLD)make urls$(NC)"
	@echo ""

ps: ## Ver status dos containers
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) ps

clean: hosts-remove ## Parar serviços, remover volumes e remover aliases do hosts
	@echo "$(YELLOW)🧹 Limpando containers, volumes e aliases...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) down -v

shell-backend: ## Entrar no container do backend
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend sh

shell-frontend: ## Entrar no container do frontend
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec frontend sh

migrate: ## Executar migrações do Prisma
	@echo "$(GREEN)📊 Executando migrações do Prisma...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npm run prisma:migrate:deploy

prisma-studio: ## Abrir Prisma Studio
	@echo "$(GREEN)🎨 Abrindo Prisma Studio...$(NC)"
	@echo "$(CYAN)📊 Prisma Studio estará disponível em: http://localhost:5555$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec -d backend npx prisma studio --hostname 0.0.0.0 --port 5555
	@echo "$(GREEN)✅ Prisma Studio iniciado em background$(NC)"
	@echo "$(CYAN)💡 Para parar o Prisma Studio, execute: make prisma-studio-stop$(NC)"

prisma-studio-stop: ## Parar Prisma Studio
	@echo "$(YELLOW)🛑 Parando Prisma Studio...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend pkill -f "prisma studio" || echo "$(YELLOW)Prisma Studio não estava rodando$(NC)"

install-backend: ## Instalar dependências do backend
	@echo "$(GREEN)📦 Instalando dependências do backend...$(NC)"
	@cd backend && npm install

install-frontend: ## Instalar dependências do frontend
	@echo "$(GREEN)📦 Instalando dependências do frontend...$(NC)"
	@cd frontend && npm install

lint-backend: ## Executar lint no backend
	@echo "$(GREEN)🔍 Executando lint no backend...$(NC)"
	@cd backend && npm run lint

lint-frontend: ## Executar lint no frontend
	@echo "$(GREEN)🔍 Executando lint no frontend...$(NC)"
	@cd frontend && npm run lint

format-backend: ## Formatar código do backend
	@echo "$(GREEN)✨ Formatando código do backend...$(NC)"
	@cd backend && npm run format

format-frontend: ## Formatar código do frontend
	@echo "$(GREEN)✨ Formatando código do frontend...$(NC)"
	@cd frontend && npm run format

dev-backend: ## Rodar backend em modo desenvolvimento (local)
	@echo "$(GREEN)💻 Iniciando backend em modo desenvolvimento...$(NC)"
	@cd backend && npm run start:dev

dev-frontend: ## Rodar frontend em modo desenvolvimento (local)
	@echo "$(GREEN)💻 Iniciando frontend em modo desenvolvimento...$(NC)"
	@cd frontend && npm run dev

