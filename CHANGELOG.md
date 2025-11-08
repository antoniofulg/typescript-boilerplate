# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

