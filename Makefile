.PHONY: help build up down restart logs urls ps clean shell-backend shell-frontend migrate migrate-dev migrate-reset migrate-resolve db-push seed prisma-studio prisma-studio-stop install-backend install-frontend lint-backend lint-frontend format-backend format-frontend hosts-add hosts-remove dev dev-stop dev-status dev-logs dev-logs-backend dev-logs-frontend test-frontend test-frontend-watch test-frontend-ui test-frontend-coverage test-backend test-backend-watch test-backend-coverage test-backend-e2e release setup-env clean-old-containers init-project

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_DIR = docker
COMPOSE_FILE = $(DOCKER_DIR)/docker-compose.yml

# Environment variables for aliases (with default values)
FRONTEND_ALIAS ?= voto-inteligente.frontend.local
BACKEND_ALIAS ?= voto-inteligente.backend.local
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
	@echo "$(BOLD)$(YELLOW)🐳 Docker & Services:$(NC)"
	@grep -E '^build|^build-fast|^up|^down|^restart|^logs|^logs-backend|^logs-frontend|^urls|^ps|^clean|^clean-old-containers:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)💻 Development:$(NC)"
	@grep -E '^dev|^dev-stop|^dev-status|^dev-logs|^dev-logs-backend|^dev-logs-frontend|^dev-backend|^dev-frontend:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🗄️  Database:$(NC)"
	@grep -E '^migrate|^migrate-dev|^migrate-reset|^migrate-resolve|^db-push|^seed|^prisma-studio|^prisma-studio-stop:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🧪 Testing:$(NC)"
	@grep -E '^test-(frontend|backend).*:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🔍 Code Quality:$(NC)"
	@grep -E '^lint-backend|^lint-frontend|^format-backend|^format-frontend:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)📦 Installation & Setup:$(NC)"
	@grep -E '^install-backend|^install-frontend|^setup-env|^init-project:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BOLD)$(YELLOW)🛠️  Utilities:$(NC)"
	@grep -E '^hosts-add|^hosts-remove|^shell-backend|^shell-frontend|^release:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
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
	@if [ -f /tmp/prisma-studio.pid ]; then \
		PRISMA_PID=$$(cat /tmp/prisma-studio.pid 2>/dev/null); \
		if [ -n "$$PRISMA_PID" ] && kill -0 "$$PRISMA_PID" 2>/dev/null; then \
			kill "$$PRISMA_PID" 2>/dev/null || true; \
			rm -f /tmp/prisma-studio.pid; \
			echo "$(GREEN)✅ Prisma Studio stopped$(NC)"; \
		fi; \
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

clean-old-containers: ## Remove old containers with fixed names (app-*)
	@echo "$(YELLOW)🧹 Cleaning up old containers with fixed names...$(NC)"
	@docker rm -f voto-inteligente-postgres voto-inteligente-redis voto-inteligente-backend voto-inteligente-frontend 2>/dev/null || true
	@echo "$(GREEN)✅ Old containers cleaned up$(NC)"

clean: hosts-remove clean-old-containers ## Stop services, remove volumes and remove aliases from hosts
	@echo "$(YELLOW)🧹 Cleaning containers, volumes and aliases...$(NC)"
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) down -v

shell-backend: ## Enter backend container
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend sh

shell-frontend: ## Enter frontend container
	@cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec frontend sh

migrate: ## Run Prisma migrations
	@echo "$(GREEN)📊 Running Prisma migrations...$(NC)"
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npm run prisma:migrate:deploy; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" npx prisma migrate deploy; \
	fi

migrate-dev: ## Create and apply Prisma migrations (development)
	@echo "$(GREEN)📊 Creating Prisma migrations...$(NC)"
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma migrate dev; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" npx prisma migrate dev; \
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
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npx prisma db push; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" npx prisma db push; \
	fi

seed: migrate ## Run Prisma seed to add example data (runs migrations first)
	@echo "$(GREEN)🌱 Running Prisma seed...$(NC)"
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend npm run prisma:seed; \
	else \
		echo "$(CYAN)Using local environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" npm run prisma:seed; \
	fi

prisma-studio: ## Open Prisma Studio (works with both dev and docker modes)
	@echo "$(GREEN)🎨 Opening Prisma Studio...$(NC)"
	@echo "$(CYAN)📊 Prisma Studio will be available at: http://localhost:5555$(NC)"
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Using Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec -d backend npx prisma studio --hostname 0.0.0.0 --port 5555; \
	elif [ -f .dev.pids ]; then \
		echo "$(CYAN)Using local development environment...$(NC)"; \
		cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" \
		npx prisma studio --hostname 0.0.0.0 --port 5555 > /tmp/prisma-studio.log 2>&1 & \
		echo $$! > /tmp/prisma-studio.pid && \
		echo "$(GREEN)✅ Prisma Studio started in background (PID: $$!)$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  No running environment detected.$(NC)"; \
		echo "$(CYAN)💡 Start development environment with: make dev$(NC)"; \
		echo "$(CYAN)💡 Or start Docker services with: make build && make up$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ Prisma Studio started in background$(NC)"
	@echo "$(CYAN)💡 To stop Prisma Studio, run: make prisma-studio-stop$(NC)"

prisma-studio-stop: ## Stop Prisma Studio (works with both dev and docker modes)
	@echo "$(YELLOW)🛑 Stopping Prisma Studio...$(NC)"
	@if docker ps | grep -q "voto-inteligente-backend.*Up"; then \
		echo "$(CYAN)Stopping Prisma Studio in Docker container...$(NC)"; \
		cd $(DOCKER_DIR) && $(DOCKER_COMPOSE) exec backend pkill -f "prisma studio" || echo "$(YELLOW)Prisma Studio was not running in Docker$(NC)"; \
	elif [ -f /tmp/prisma-studio.pid ]; then \
		PRISMA_PID=$$(cat /tmp/prisma-studio.pid 2>/dev/null); \
		if [ -n "$$PRISMA_PID" ] && kill -0 "$$PRISMA_PID" 2>/dev/null; then \
			echo "$(CYAN)Stopping Prisma Studio (PID: $$PRISMA_PID)...$(NC)"; \
			kill "$$PRISMA_PID" 2>/dev/null || true; \
			sleep 1; \
			if kill -0 "$$PRISMA_PID" 2>/dev/null; then \
				kill -9 "$$PRISMA_PID" 2>/dev/null || true; \
			fi; \
			rm -f /tmp/prisma-studio.pid; \
			echo "$(GREEN)✅ Prisma Studio stopped$(NC)"; \
		else \
			echo "$(YELLOW)Prisma Studio was not running$(NC)"; \
			rm -f /tmp/prisma-studio.pid; \
		fi; \
	else \
		echo "$(YELLOW)Prisma Studio was not running$(NC)"; \
	fi

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

dev-logs: ## View logs from backend and frontend (development mode)
	@echo "$(GREEN)📋 Viewing development logs...$(NC)"
	@echo "$(CYAN)Press Ctrl+C to exit$(NC)"
	@echo ""
	@if [ -f /tmp/backend-dev.log ] || [ -f /tmp/frontend-dev.log ]; then \
		tail -f /tmp/backend-dev.log /tmp/frontend-dev.log 2>/dev/null || \
		(if [ -f /tmp/backend-dev.log ]; then tail -f /tmp/backend-dev.log; fi) || \
		(if [ -f /tmp/frontend-dev.log ]; then tail -f /tmp/frontend-dev.log; fi); \
	else \
		echo "$(YELLOW)⚠️  No log files found. Make sure development environment is running with: make dev$(NC)"; \
	fi

dev-logs-backend: ## View backend logs only (development mode)
	@echo "$(GREEN)📋 Viewing backend logs...$(NC)"
	@echo "$(CYAN)Press Ctrl+C to exit$(NC)"
	@echo ""
	@if [ -f /tmp/backend-dev.log ]; then \
		tail -f /tmp/backend-dev.log; \
	else \
		echo "$(YELLOW)⚠️  Backend log file not found. Make sure development environment is running with: make dev$(NC)"; \
		echo "$(CYAN)💡 If backend is running, logs should be at: /tmp/backend-dev.log$(NC)"; \
	fi

dev-logs-frontend: ## View frontend logs only (development mode)
	@echo "$(GREEN)📋 Viewing frontend logs...$(NC)"
	@echo "$(CYAN)Press Ctrl+C to exit$(NC)"
	@echo ""
	@if [ -f /tmp/frontend-dev.log ]; then \
		tail -f /tmp/frontend-dev.log; \
	else \
		echo "$(YELLOW)⚠️  Frontend log file not found. Make sure development environment is running with: make dev$(NC)"; \
		echo "$(CYAN)💡 If frontend is running, logs should be at: /tmp/frontend-dev.log$(NC)"; \
	fi

dev-backend: ## Run backend in development mode (local, standalone)
	@echo "$(GREEN)💻 Starting backend in development mode...$(NC)"
	@cd backend && npm run start:dev

dev-frontend: ## Run frontend in development mode (local, standalone)
	@echo "$(GREEN)💻 Starting frontend in development mode...$(NC)"
	@cd frontend && npm run dev

test-frontend: ## Run frontend tests (single run, CI mode)
	@echo "$(GREEN)🧪 Running frontend tests...$(NC)"
	@cd frontend && npm run test:run

test-frontend-watch: ## Run frontend tests in watch mode (development)
	@echo "$(GREEN)🧪 Running frontend tests in watch mode...$(NC)"
	@echo "$(CYAN)💡 Tests will re-run automatically on file changes$(NC)"
	@cd frontend && npm test

test-frontend-ui: ## Run frontend tests with visual UI
	@echo "$(GREEN)🧪 Opening frontend test UI...$(NC)"
	@echo "$(CYAN)💡 Test UI will open in your browser$(NC)"
	@cd frontend && npm run test:ui

test-frontend-coverage: ## Run frontend tests with coverage report
	@echo "$(GREEN)🧪 Running frontend tests with coverage...$(NC)"
	@cd frontend && npm run test:coverage
	@echo "$(CYAN)💡 Coverage report generated in frontend/coverage/$(NC)"

test-backend: ## Run backend tests (single run, CI mode)
	@echo "$(GREEN)🧪 Running backend tests...$(NC)"
	@cd backend && npm test

test-backend-watch: ## Run backend tests in watch mode (development)
	@echo "$(GREEN)🧪 Running backend tests in watch mode...$(NC)"
	@echo "$(CYAN)💡 Tests will re-run automatically on file changes$(NC)"
	@cd backend && npm run test:watch

test-backend-coverage: ## Run backend tests with coverage report
	@echo "$(GREEN)🧪 Running backend tests with coverage...$(NC)"
	@cd backend && npm run test:cov
	@echo "$(CYAN)💡 Coverage report generated in backend/coverage/$(NC)"

test-backend-e2e: ## Run backend e2e tests
	@echo "$(GREEN)🧪 Running backend e2e tests...$(NC)"
	@cd backend && npm run test:e2e

setup-env: ## Generate .env files from examples (if they don't exist)
	@echo "$(GREEN)🔧 Setting up environment files...$(NC)"
	@if [ -f $(DOCKER_DIR)/env.example ]; then \
		PROJECT_NAME=$$(grep "^COMPOSE_PROJECT_NAME=" $(DOCKER_DIR)/env.example 2>/dev/null | cut -d'=' -f2 || echo "app"); \
		if [ "$$PROJECT_NAME" != "app" ]; then \
			echo "$(CYAN)📋 Using project name: $(BOLD)$$PROJECT_NAME$(NC)$(CYAN)${NC}"; \
		fi; \
	fi
	@if [ ! -f $(DOCKER_DIR)/.env ]; then \
		cp $(DOCKER_DIR)/env.example $(DOCKER_DIR)/.env && \
		echo "$(GREEN)✅ Created $(DOCKER_DIR)/.env$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  $(DOCKER_DIR)/.env already exists, skipping...$(NC)"; \
	fi
	@if [ ! -f $(DOCKER_DIR)/.env.postgres ]; then \
		cp $(DOCKER_DIR)/env.postgres.example $(DOCKER_DIR)/.env.postgres && \
		echo "$(GREEN)✅ Created $(DOCKER_DIR)/.env.postgres$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  $(DOCKER_DIR)/.env.postgres already exists, skipping...$(NC)"; \
	fi
	@if [ ! -f $(DOCKER_DIR)/.env.backend ]; then \
		cp $(DOCKER_DIR)/env.backend.example $(DOCKER_DIR)/.env.backend && \
		echo "$(GREEN)✅ Created $(DOCKER_DIR)/.env.backend$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  $(DOCKER_DIR)/.env.backend already exists, skipping...$(NC)"; \
	fi
	@if [ ! -f $(DOCKER_DIR)/.env.frontend ]; then \
		cp $(DOCKER_DIR)/env.frontend.example $(DOCKER_DIR)/.env.frontend && \
		echo "$(GREEN)✅ Created $(DOCKER_DIR)/.env.frontend$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  $(DOCKER_DIR)/.env.frontend already exists, skipping...$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✅ Environment files setup complete!$(NC)"
	@if [ -f $(DOCKER_DIR)/env.example ]; then \
		PROJECT_NAME=$$(grep "^COMPOSE_PROJECT_NAME=" $(DOCKER_DIR)/env.example 2>/dev/null | cut -d'=' -f2 || echo ""); \
		if [ -n "$$PROJECT_NAME" ] && [ "$$PROJECT_NAME" != "app" ]; then \
			echo "$(CYAN)💡 Files created with project name: $(BOLD)$$PROJECT_NAME$(NC)$(CYAN)${NC}"; \
		fi; \
	fi
	@echo "$(CYAN)💡 You can now customize the .env files in $(DOCKER_DIR)/ if needed$(NC)"

init-project: ## Initialize project with custom name (usage: make init-project PROJECT_NAME=myproject)
	@if [ -z "$(PROJECT_NAME)" ]; then \
		chmod +x scripts/init-project.sh && \
		./scripts/init-project.sh; \
	else \
		chmod +x scripts/init-project.sh && \
		./scripts/init-project.sh "$(PROJECT_NAME)"; \
	fi

release: ## Create a new release (usage: make release VERSION=1.0.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)❌ Error: VERSION is required$(NC)"; \
		echo "Usage: make release VERSION=1.0.0"; \
		exit 1; \
	fi
	@chmod +x scripts/create-release.sh
	@./scripts/create-release.sh $(VERSION)

