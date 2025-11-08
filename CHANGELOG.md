# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

