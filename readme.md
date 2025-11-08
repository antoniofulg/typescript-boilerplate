# 🚀 Full-Stack Boilerplate

Modern full-stack application boilerplate with Next.js, NestJS, PostgreSQL, and Redis.

**Stack:** Next.js 16 + NestJS + PostgreSQL + Redis + Docker

---

## 🚀 Getting Started

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+ installed
- **Node.js** 24+ (only if running locally without Docker)
- **Git** to clone the repository

---

## 📦 Development (Recommended)

### 1. Clone the repository

```bash
git clone <repository-url>
cd fullstack-boilerplate
```

### 2. Configure environment variables (optional)

The `.env` files in the `docker/` folder already have default values. To customize, edit:

- `docker/.env.postgres` - PostgreSQL credentials
- `docker/.env.backend` - Backend configuration (JWT secrets, etc.)
- `docker/.env.frontend` - Frontend configuration

### 3. Start the development environment

```bash
make dev
```

This command will:

- ✅ Start PostgreSQL and Redis in Docker
- ✅ Start backend locally with hot-reload (port 4000)
- ✅ Start frontend locally with hot-reload (port 3000)
- ✅ Configure environment variables automatically

### 4. Set up the database

```bash
# Create tables (choose one option):

# Option A - Quick (without creating migrations):
make db-push

# Option B - Recommended (creates migrations):
make migrate-dev

# Populate with example data:
make seed
```

### 5. Access the application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Healthcheck:** http://localhost:4000/health

### Useful commands (development)

```bash
make dev-stop    # Stop all services
make dev-status  # Check service status
make logs        # View logs (backend/frontend in /tmp/*-dev.log)

# Testing
make test-frontend          # Run frontend tests (single run, CI mode)
make test-frontend-watch    # Run frontend tests in watch mode (development)
make test-frontend-ui       # Run frontend tests with visual UI
make test-frontend-coverage # Run frontend tests with coverage report
make test-backend           # Run backend tests (single run, CI mode)
make test-backend-watch     # Run backend tests in watch mode (development)
make test-backend-coverage  # Run backend tests with coverage report
make test-backend-e2e       # Run backend e2e tests
```

---

## 🐳 Production (Docker)

### 1. Clone the repository

```bash
git clone <repository-url>
cd fullstack-boilerplate
```

### 2. Configure environment variables

Edit the `.env` files in the `docker/` folder:

- `docker/.env.postgres` - PostgreSQL credentials
- `docker/.env.backend` - Backend configuration (JWT secrets, etc.)
- `docker/.env.frontend` - Frontend configuration

### 3. Build and start services

```bash
# Build Docker images
make build

# Start all services
make up
```

This command will:

- ✅ Automatically install all dependencies
- ✅ Create and configure containers (PostgreSQL, Redis, Backend, Frontend)
- ✅ Automatically run Prisma migrations
- ✅ Start all services
- ✅ Display service access URLs

### 4. Set up the database (if needed)

```bash
# Apply existing migrations
make migrate

# Or create new migrations
make migrate-dev

# Populate with example data
make seed
```

### 5. Access the application

Run `make urls` to see all URLs:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Healthcheck:** http://localhost:4000/health
- **Prisma Studio:** http://localhost:5555 (run `make prisma-studio` to start)
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### 6. Running Tests

```bash
# Frontend tests
make test-frontend          # Run once (CI mode)
make test-frontend-watch    # Watch mode (development)
make test-frontend-ui       # Visual UI in browser
make test-frontend-coverage # With coverage report

# Backend tests
make test-backend           # Run once (CI mode)
make test-backend-watch     # Watch mode (development)
make test-backend-coverage  # With coverage report
make test-backend-e2e       # End-to-end tests
```

---

## 📋 Available Commands

### Make commands (recommended)

```bash
make help          # View all available commands

# Development
make dev           # Start development environment (hot-reload)
make dev-stop      # Stop development environment
make dev-status    # Check development environment status

# Production (Docker)
make build         # Build images (no cache)
make build-fast    # Build images (with cache)
make up            # Start all services
make down          # Stop all services
make restart       # Restart services
make clean         # Stop and remove volumes

# Logs and Status
make logs          # View logs from all services
make logs-backend  # View backend logs
make logs-frontend # View frontend logs
make urls          # View service URLs
make ps            # View container status

# Database
make migrate       # Apply existing migrations
make migrate-dev   # Create and apply migrations (development)
make migrate-reset  # Reset database and apply migrations (⚠️ deletes data)
make db-push       # Apply schema directly (without migrations)
make seed          # Populate database with example data

# Prisma Studio
make prisma-studio      # Open Prisma Studio (http://localhost:5555)
make prisma-studio-stop # Stop Prisma Studio

# Testing
make test-frontend          # Run frontend tests (single run, CI mode)
make test-frontend-watch    # Run frontend tests in watch mode (development)
make test-frontend-ui       # Run frontend tests with visual UI
make test-frontend-coverage # Run frontend tests with coverage report
make test-backend           # Run backend tests (single run, CI mode)
make test-backend-watch     # Run backend tests in watch mode (development)
make test-backend-coverage  # Run backend tests with coverage report
make test-backend-e2e       # Run backend e2e tests

# Utilities
make shell-backend  # Enter backend container
make shell-frontend # Enter frontend container
```

### Docker Compose commands (alternative)

```bash
cd docker

# Stop all services
docker-compose down

# Stop and remove volumes (clean data)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## 🔧 When to Rebuild?

You need to rebuild Docker images when:

- ✅ Changing project code (backend/frontend)
- ✅ Updating `package.json` or `package-lock.json`
- ✅ Modifying Dockerfiles
- ✅ Changing Prisma configuration (`schema.prisma`)

**Recommended command after changes:**

```bash
make build  # Build without cache
make up     # Start services
```

---

## 🗄️ Prisma Migrations

### Development

Migrations are automatically executed when you use `make migrate-dev` or `make db-push`.

```bash
# Create and apply migrations
make migrate-dev

# Or apply schema directly (without creating migrations)
make db-push
```

### Production

Migrations are automatically executed when the backend container starts for the first time.

To run manually:

```bash
# Apply existing migrations
make migrate
```

---

## 🐛 Troubleshooting

### Backend not connecting to database

Check if PostgreSQL is healthy:

```bash
make ps
# or
cd docker && docker-compose ps
```

Wait for PostgreSQL healthcheck to complete before backend starts.

### Permission error

Check logs:

```bash
make logs-backend
# or
cd docker && docker-compose logs backend
```

### Clean everything and start over

```bash
make clean
make build
make up
```

### Ports already in use

If ports 3000, 4000, 5432, or 6379 are in use, change them in `docker/docker-compose.yml`:

```yaml
ports:
  - "3001:3000" # Frontend
  - "4001:4000" # Backend
```

### Error running seed

Make sure tables were created first:

```bash
# If there are no migrations:
make db-push
make seed

# Or create migrations:
make migrate-dev
make seed
```

---

## 📚 Additional Documentation

- **[docker/README.md](./docker/README.md)** - Docker-specific documentation
- **[frontend/TESTING.md](./frontend/TESTING.md)** - Frontend testing guide with Vitest, React Testing Library, and MSW
- **[backend/TESTING.md](./backend/TESTING.md)** - Backend testing guide with Jest and NestJS Testing

---

## 🛠️ Local Development (without Docker)

If you prefer to run without Docker for development:

### Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Configure database (create .env file with DATABASE_URL)
# DATABASE_URL="postgresql://user:password@localhost:5432/app_db?schema=public"

# Run migrations
npm run prisma:migrate

# Start in development mode
npm run start:dev
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Database and Redis

You'll need PostgreSQL and Redis running locally or use Docker only for these services:

```bash
cd docker
docker-compose up -d postgres redis
```

---

## 📝 License

This project is private and confidential.
