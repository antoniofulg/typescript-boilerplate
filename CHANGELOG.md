# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-01-XX

### Added

- **Project Initialization Command**: New `make init-project` command to easily initialize a new project with a custom name
  - Automatically replaces all references to "app" with the provided project name
  - Updates environment variables, database names, aliases, and container names
  - Validates project name (alphanumeric, hyphens, and underscores only)
  - Supports interactive mode or direct parameter: `make init-project PROJECT_NAME=myproject`
- **Enhanced Development Output**: Improved `make dev` command output with:
  - Service URLs with both localhost and alias addresses
  - Healthcheck endpoint link for backend
  - First-time setup commands (migrate, seed, db-push) for new users
  - Better formatted and organized service information

### Changed

- **Environment Setup**: Enhanced `make setup-env` to:
  - Detect and display project name when creating `.env` files
  - Show confirmation message with project name after setup
  - Automatically use project-specific values from modified `.example` files
- **Development Script**: Updated `scripts/dev.sh` to:
  - Read and display frontend/backend aliases from `env.example`
  - Show both localhost and alias URLs for backend and frontend
  - Include helpful first-time setup commands in the output
  - Display healthcheck endpoint for backend

### Technical Details

- **Project Initialization Script**: New `scripts/init-project.sh` script that:
  - Uses Python with base64 encoding for reliable string replacement (handles special characters)
  - Falls back to sed if Python is not available
  - Updates files: `docker/env.example`, `docker/env.postgres.example`, `Makefile`, `scripts/manage-hosts.sh`, `scripts/dev.sh`, `backend/src/main.ts`, `docker/docker-compose.yml`
  - Sanitizes database names (lowercase, replaces hyphens with underscores)

## [1.0.1] - 2025-11-08

### Added

- **Environment Setup Automation**: New `make setup-env` command to automatically generate all `.env` files from examples
- **Multiple Clone Support**: Docker Compose configuration now supports multiple clones of the repository on the same machine via `COMPOSE_PROJECT_NAME`
- **Configurable Ports**: All service ports (PostgreSQL, Redis, Backend, Frontend, Prisma Studio) are now configurable via environment variables
- **CI/CD Pipeline**: GitHub Actions workflow for automated testing and builds on pull requests
- **Release Automation**: Automated release creation via GitHub Actions when tags are pushed
- **Container Cleanup**: Automatic cleanup of old containers with fixed names to prevent conflicts

### Changed

- **Docker Compose Configuration**: 
  - Container names now use `COMPOSE_PROJECT_NAME` for isolation
  - All ports are configurable via `docker/.env` file
  - Volumes are automatically prefixed by Docker Compose based on project name
- **Vitest Version**: Updated from 3.2.4 to 4.0.8 (along with `@vitest/coverage-v8` and `@vitest/ui`)
- **ESLint Configuration**: Pre-commit hooks now block commits with ESLint warnings (using `--max-warnings=0`)
- **Development Scripts**: `scripts/dev.sh` now automatically removes old containers before starting

### Fixed

- **Volume Configuration**: Fixed Docker Compose volume definition to use fixed names (Docker Compose automatically prefixes them)
- **Container Conflicts**: Resolved conflicts when multiple clones try to use the same container names
- **Environment Variables**: Fixed Docker Compose not loading `.env` file correctly by ensuring it's created before use
- **Healthchecks**: Updated healthcheck commands to use dynamic ports from environment variables

### Documentation

- Added comprehensive CI/CD documentation in README.md
- Added release creation guide (`.github/RELEASE.md`)
- Updated Docker documentation with multiple clone instructions
- Added troubleshooting section for port conflicts and container cleanup

## [1.0.0] - 2025-11-08

### Added

#### Core Features
- Full-stack boilerplate with Next.js 16, NestJS, PostgreSQL, and Redis
- Docker and Docker Compose setup for easy development and production
- Multi-language support (i18n) with English and Portuguese (pt-BR)
- Dark/light theme toggle with ShadCN UI
- Custom host aliases configuration for local development

#### Development Tools
- Hot-reload for both frontend and backend in development mode
- Pre-commit hooks with Husky and lint-staged
- ESLint and Prettier configuration for code quality
- Comprehensive Makefile with common development commands

#### Testing
- Frontend: Vitest, React Testing Library, and MSW setup
- Backend: Jest and NestJS Testing utilities
- Test utilities and mocks for both frontend and backend
- Coverage reports configuration
- Example test files for components and services

#### CI/CD
- GitHub Actions workflow for automated testing and builds
- Automated checks on pull requests
- Docker image build validation in CI

#### Documentation
- Comprehensive README with setup instructions
- Testing guides for both frontend and backend
- Docker-specific documentation
- Architecture and technical documentation

### Technical Stack

- **Frontend:**
  - Next.js 16 with App Router
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - ShadCN UI components
  - next-intl for internationalization
  - next-themes for theme management
  - Vitest 4.0.8 for testing

- **Backend:**
  - NestJS 11
  - TypeScript
  - Prisma ORM
  - PostgreSQL database
  - Redis cache
  - Jest 30 for testing

- **Infrastructure:**
  - Docker and Docker Compose
  - PostgreSQL 16
  - Redis
  - Multi-stage Docker builds

### Configuration

- Environment variables management with example files
- Prisma migrations and seeding
- CORS configuration for cross-origin requests
- Custom host aliases for local development
- Branch protection rules documentation

