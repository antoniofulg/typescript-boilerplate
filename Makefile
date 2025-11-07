.PHONY: help build up down restart logs urls ps clean shell-backend shell-frontend migrate migrate-dev migrate-reset migrate-resolve db-push seed prisma-studio prisma-studio-stop install-backend install-frontend lint-backend lint-frontend format-backend format-frontend hosts-add hosts-remove dev dev-stop dev-status

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_DIR = docker
COMPOSE_FILE = $(DOCKER_DIR)/docker-compose.yml

# Environment variables for aliases (with default values)
FRONTEND_ALIAS ?= app.frontend.local
BACKEND_ALIAS ?= app.backend.local
export FRONTEND_ALIAS
export BACKEND_ALIAS

# Colors for output
GREEN = \033[0;32m
BLUE = \033[0;34m
YELLOW = \033[1;33m
CYAN = \033[0;36m
BOLD = \033[1m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║     🚀 Full-Stack Boilerplate - Available Commands     ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

hosts-add: ## Add aliases to /etc/hosts file
	@echo "$(GREEN)📝 Adding aliases to /etc/hosts...$(NC)"
	@chmod +x scripts/manage-hosts.sh
	@./scripts/manage-hosts.sh add $(FRONTEND_ALIAS) $(BACKEND_ALIAS)
	@echo "$(CYAN)💡 Configured aliases:$(NC)"
	@echo "   Frontend: $(BOLD)http://$(FRONTEND_ALIAS):3000$(NC)"
	@echo "   Backend:  $(BOLD)http://$(BACKEND_ALIAS):4000$(NC)"

hosts-remove: ## Remove aliases from /etc/hosts file
	@echo "$(YELLOW)🗑️  Removing aliases from /etc/hosts...$(NC)"
	@chmod +x scripts/manage-hosts.sh
	@./scripts/manage-hosts.sh remove $(FRONTEND_ALIAS) $(BACKEND_ALIAS)

build: hosts-add ## Build Docker images (no cache) and add aliases to hosts
	@echo "$(GREEN)🔨 Building Docker images...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) build --no-cache

build-fast: hosts-add ## Build Docker images (with cache) and add aliases to hosts
	@echo "$(GREEN)🔨 Building Docker images (with cache)...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) build

up: ## Start all services
	@echo "$(GREEN)🚀 Starting services...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) up -d
	@sleep 3
	@$(MAKE) urls

down: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping services...$(NC)"
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "backend.*Up"; then \
		$(DOCKER_COMPOSE) exec backend pkill -f "prisma studio" 2>/dev/null && \
		echo "$(GREEN)✅ Prisma Studio stopped$(NC)" || true; \
	fi
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) down

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) restart
	@sleep 3
	@$(MAKE) urls

logs: ## View logs from all services
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f

logs-backend: ## View backend logs
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## View frontend logs
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) logs -f frontend

urls: ## Show service URLs
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║     $(BOLD)🚀 Full-Stack Boilerplate - Running Services$(NC)$(GREEN)    ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(CYAN)📋 Service Status:$(NC)"
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "frontend.*Up"; then \
		echo "   $(GREEN)✅ Frontend$(NC)"; \
		echo "      $(BLUE)🌐 URL (localhost):$(NC) $(BOLD)http://localhost:3000$(NC)"; \
		echo "      $(BLUE)🌐 URL (alias):$(NC) $(BOLD)http://$(FRONTEND_ALIAS):3000$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Frontend is still starting...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "backend.*Up"; then \
		echo "   $(GREEN)✅ Backend$(NC)"; \
		echo "      $(BLUE)🌐 API (localhost):$(NC) $(BOLD)http://localhost:4000$(NC)"; \
		echo "      $(BLUE)🌐 API (alias):$(NC) $(BOLD)http://$(BACKEND_ALIAS):4000$(NC)"; \
		echo "      $(BLUE)🏥 Healthcheck:$(NC) $(BOLD)http://localhost:4000/health$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Backend is still starting...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "postgres.*Up"; then \
		echo "   $(GREEN)✅ PostgreSQL$(NC)"; \
		echo "      $(BLUE)🗄️  Host:$(NC) $(BOLD)localhost:5432$(NC)"; \
		echo "      $(BLUE)📊 Database:$(NC) $(BOLD)app_db$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ PostgreSQL is still starting...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) ps 2>/dev/null | grep -q "redis.*Up"; then \
		echo "   $(GREEN)✅ Redis$(NC)"; \
		echo "      $(BLUE)💾 Host:$(NC) $(BOLD)localhost:6379$(NC)"; \
	else \
		echo "   $(YELLOW)⏳ Redis is still starting...$(NC)"; \
	fi
	@echo ""
	@cd $(DOCKER_DIR) && \
	if $(DOCKER_COMPOSE) exec backend pgrep -f "prisma studio" > /dev/null 2>&1; then \
		echo "   $(GREEN)✅ Prisma Studio$(NC)"; \
		echo "      $(BLUE)🎨 URL:$(NC) $(BOLD)http://localhost:5555$(NC)"; \
		echo "      $(CYAN)💡 To stop:$(NC) $(BOLD)make prisma-studio-stop$(NC)"; \
	else \
		echo "   $(YELLOW)⚪ Prisma Studio is not running$(NC)"; \
		echo "      $(CYAN)💡 To start:$(NC) $(BOLD)make prisma-studio$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                    $(BOLD)📝 Useful Commands$(NC)$(GREEN)                        ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "   $(CYAN)View logs:$(NC)        $(BOLD)make logs$(NC)"
	@echo "   $(CYAN)Stop services:$(NC)  $(BOLD)make down$(NC)"
	@echo "   $(CYAN)Status:$(NC)          $(BOLD)make ps$(NC)"
	@echo "   $(CYAN)Prisma Studio:$(NC)   $(BOLD)make prisma-studio$(NC)"
	@echo "   $(CYAN)View URLs again:$(NC) $(BOLD)make urls$(NC)"
	@echo ""

ps: ## View container status
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) ps

clean: hosts-remove ## Stop services, remove volumes and remove aliases from hosts
	@echo "$(YELLOW)🧹 Cleaning containers, volumes and aliases...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) down -v

shell-backend: ## Enter backend container
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend sh

shell-frontend: ## Enter frontend container
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec frontend sh

migrate: ## Run Prisma migrations
	@echo "$(GREEN)📊 Running Prisma migrations...$(NC)"
	@if docker ps | grep -q "app-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npm run prisma:migrate:deploy; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npx prisma migrate deploy; \
	fi

migrate-dev: ## Create and apply Prisma migrations (development)
	@echo "$(GREEN)📊 Creating Prisma migrations...$(NC)"
	@if docker ps | grep -q "app-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma migrate dev; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npx prisma migrate dev; \
	fi

migrate-reset: ## Reset database and apply all migrations (WARNING: deletes all data)
	@echo "$(YELLOW)⚠️  WARNING: This will delete all data in the database!$(NC)"
	@echo "$(CYAN)Resetting database and applying migrations...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma migrate reset --force

migrate-resolve: ## Create baseline migration from current database state
	@echo "$(GREEN)📊 Creating baseline migration from current database...$(NC)"
	@echo "$(CYAN)This creates an initial migration matching your current database state$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma migrate dev --name init --create-only
	@echo "$(GREEN)✅ Baseline migration created. Now marking it as applied...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma migrate resolve --applied init || \
		(cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend bash -c "MIGRATION_NAME=\$$(ls -1 prisma/migrations | head -1) && npx prisma migrate resolve --applied \$$MIGRATION_NAME")

db-push: ## Push Prisma schema to database without migrations (development)
	@echo "$(GREEN)📊 Pushing Prisma schema to database...$(NC)"
	@if docker ps | grep -q "app-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma db push; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npx prisma db push; \
	fi

seed: migrate ## Run Prisma seed to add example data (runs migrations first)
	@echo "$(GREEN)🌱 Running Prisma seed...$(NC)"
	@if docker ps | grep -q "app-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npm run prisma:seed; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npm run prisma:seed; \
	fi

prisma-studio: ## Open Prisma Studio
	@echo "$(GREEN)🎨 Opening Prisma Studio...$(NC)"
	@echo "$(CYAN)📊 Prisma Studio will be available at: http://localhost:5555$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec -d backend npx prisma studio --hostname 0.0.0.0 --port 5555
	@echo "$(GREEN)✅ Prisma Studio started in background$(NC)"
	@echo "$(CYAN)💡 To stop Prisma Studio, run: make prisma-studio-stop$(NC)"

prisma-studio-stop: ## Stop Prisma Studio
	@echo "$(YELLOW)🛑 Stopping Prisma Studio...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend pkill -f "prisma studio" || echo "$(YELLOW)Prisma Studio was not running$(NC)"

install-backend: ## Install backend dependencies
	@echo "$(GREEN)📦 Installing backend dependencies...$(NC)"
	@cd backend && npm install

install-frontend: ## Install frontend dependencies
	@echo "$(GREEN)📦 Installing frontend dependencies...$(NC)"
	@cd frontend && npm install

lint-backend: ## Run lint on backend
	@echo "$(GREEN)🔍 Running lint on backend...$(NC)"
	@cd backend && npm run lint

lint-frontend: ## Run lint on frontend
	@echo "$(GREEN)🔍 Running lint on frontend...$(NC)"
	@cd frontend && npm run lint

format-backend: ## Format backend code
	@echo "$(GREEN)✨ Formatting backend code...$(NC)"
	@cd backend && npm run format

format-frontend: ## Format frontend code
	@echo "$(GREEN)✨ Formatting frontend code...$(NC)"
	@cd frontend && npm run format

dev: hosts-add ## Start development environment with hot-reload (PostgreSQL/Redis in Docker, backend/frontend locally)
	@chmod +x scripts/dev.sh
	@./scripts/dev.sh start

dev-stop: ## Stop development environment
	@chmod +x scripts/dev.sh
	@./scripts/dev.sh stop

dev-status: ## Show development environment status
	@chmod +x scripts/dev.sh
	@./scripts/dev.sh status

dev-backend: ## Run backend in development mode (local, standalone)
	@echo "$(GREEN)💻 Starting backend in development mode...$(NC)"
	@cd backend && npm run start:dev

dev-frontend: ## Run frontend in development mode (local, standalone)
	@echo "$(GREEN)💻 Starting frontend in development mode...$(NC)"
	@cd frontend && npm run dev

