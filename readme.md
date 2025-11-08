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

- **Frontend:** <http://localhost:3000>
- **Backend API:** <http://localhost:4000>
- **Healthcheck:** <http://localhost:4000/health>

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

- **Frontend:** <http://localhost:3000>
- **Backend API:** <http://localhost:4000>
- **Healthcheck:** <http://localhost:4000/health>
- **Prisma Studio:** <http://localhost:5555> (run `make prisma-studio` to start)
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

## 🔒 Branch Protection & CI/CD

This project uses **GitHub Actions** for Continuous Integration (CI). All pull requests are automatically validated before they can be merged.

### Automated Checks

When you create or update a Pull Request, the following checks run automatically:

- ✅ **Backend Tests** - Runs unit tests and generates coverage report
- ✅ **Backend Linter** - Validates code style and quality
- ✅ **Frontend Tests** - Runs unit tests
- ✅ **Frontend Linter** - Validates code style and quality
- ✅ **Frontend Build** - Ensures the application builds successfully
- ✅ **Docker Build** - Validates that Docker images can be built

### Branch Protection Rules

To ensure code quality, configure branch protection rules for `main` (or `master`) branch:

1. Go to **Repository Settings** → **Branches** → **Add rule**
2. Set branch name pattern: `main` (or `master`)
3. Enable the following protections:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require conversation resolution before merging** (optional but recommended)
4. Select the required status checks:
   - `Test Backend`
   - `Test Frontend`
   - `Build Docker Images`
5. Save the rule

### What This Means

- **Pull Requests** cannot be merged until all CI checks pass
- **Direct pushes** to `main`/`master` are blocked (if enabled)
- **Outdated branches** must be updated before merging
- **Failed checks** must be fixed before the PR can be merged

### Viewing CI Results

- Check the **"Checks"** tab in your Pull Request
- Green ✅ = All checks passed
- Red ❌ = One or more checks failed (click to see details)
- Yellow 🟡 = Checks are still running

### Local Testing

Before creating a PR, you can run the same checks locally:

```bash
# Backend
cd backend
npm run lint:check  # Linter
npm test            # Tests
npm run test:cov    # Tests with coverage

# Frontend
cd frontend
npm run lint        # Linter
npm run test:run    # Tests
npm run build       # Build

# Docker Build (same as CI)
cd docker
docker-compose build backend frontend
```

### Testing GitHub Actions Workflow Locally

You can test the GitHub Actions workflow locally using [**act**](https://github.com/nektos/act):

1. **Install act:**

   ```bash
   # macOS
   brew install act

   # Linux
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Windows (using Chocolatey)
   choco install act-cli
   ```

2. **Run the workflow:**

   ```bash
   # List all workflows
   act -l

   # Run a specific job
   act pull_request -j test-backend
   act pull_request -j test-frontend
   act pull_request -j build-docker

   # Run all jobs (simulates a PR)
   act pull_request
   ```

3. **Note:** `act` runs workflows in Docker containers. For services like PostgreSQL, you may need to adjust the workflow or use `act` with `--container-options` flag.

**Alternative: Manual Testing**

You can also manually test each step that the CI runs:

```bash
# 1. Test Backend (with PostgreSQL)
docker run -d --name test-postgres \
  -e POSTGRES_DB=app_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16

# Wait for PostgreSQL to be ready
sleep 5

cd backend
npm ci
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npx prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npx prisma migrate deploy
npm run lint:check
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npm test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app_db?schema=public" npm run test:cov

# Cleanup
docker stop test-postgres && docker rm test-postgres

# 2. Test Frontend
cd frontend
npm ci
npm run lint
npm run test:run
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000 npm run build

# 3. Test Docker Build
cd docker
docker-compose build backend frontend
```

---

## 🏷️ Releases

This project follows [Semantic Versioning](https://semver.org/). Releases are created automatically via GitHub Actions when a tag is pushed.

### Creating a Release

1. **Update CHANGELOG.md** with the new version and changes
2. **Commit and push** all changes:

   ```bash
   git add .
   git commit -m "chore: prepare release 1.0.0"
   git push origin main
   ```

3. **Create and push tag**:

   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

4. **GitHub Actions** will automatically create the release with notes from CHANGELOG.md

For detailed instructions, see [.github/RELEASE.md](.github/RELEASE.md).

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
