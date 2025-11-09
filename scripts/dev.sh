#!/bin/bash

# Script to run development environment with hot-reload
# Usage: ./scripts/dev.sh [start|stop|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_DIR/.dev.pids"

DOCKER_DIR="$PROJECT_DIR/docker"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

start() {
  echo -e "${GREEN}🚀 Starting development environment...${NC}"
  echo ""

  # Stop and remove old containers with fixed names (from before COMPOSE_PROJECT_NAME)
  echo -e "${CYAN}🛑 Cleaning up old containers...${NC}"
  docker rm -f voto-inteligente-postgres voto-inteligente-redis voto-inteligente-backend voto-inteligente-frontend 2>/dev/null || true
  
  # Stop backend and frontend containers if running (to avoid port conflicts)
  cd "$DOCKER_DIR" && docker-compose stop backend frontend 2>/dev/null || true
  cd "$DOCKER_DIR" && docker-compose rm -f backend frontend 2>/dev/null || true

  # Check if dependencies are installed
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd "$BACKEND_DIR" && npm install
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd "$FRONTEND_DIR" && npm install
  fi

  # Start PostgreSQL and Redis
  echo -e "${CYAN}📦 Starting PostgreSQL and Redis...${NC}"
  cd "$DOCKER_DIR" && docker-compose up -d postgres redis
  sleep 2

  # Wait for PostgreSQL to be ready
  echo -e "${CYAN}⏳ Waiting for PostgreSQL to be ready...${NC}"
  until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
  done
  echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

  # Generate Prisma Client if needed
  if [ ! -d "$BACKEND_DIR/node_modules/.prisma" ]; then
    echo -e "${CYAN}📊 Generating Prisma Client...${NC}"
    cd "$BACKEND_DIR" && npm run prisma:generate
  fi

  # Check if port 4000 is available
  if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ Port 4000 is already in use. Please stop the service using it first.${NC}"
    echo -e "${YELLOW}   Try: make dev-stop or docker-compose stop backend${NC}"
    exit 1
  fi

  # Start backend in background with DATABASE_URL
  echo -e "${CYAN}💻 Starting backend (port 4000)...${NC}"
  cd "$BACKEND_DIR"
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voto_inteligente_db?schema=public" \
  PORT=4000 \
  npm run start:dev > /tmp/backend-dev.log 2>&1 &
  BACKEND_PID=$!
  echo "$BACKEND_PID" > "$PID_FILE"
  echo -e "${GREEN}   Backend PID: $BACKEND_PID${NC}"
  
  # Wait a moment and check if backend started successfully
  sleep 2
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs: tail -f /tmp/backend-dev.log${NC}"
    exit 1
  fi

  # Check if port 3000 is available
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}❌ Port 3000 is already in use. Please stop the service using it first.${NC}"
    echo -e "${YELLOW}   Try: make dev-stop or docker-compose stop frontend${NC}"
    exit 1
  fi

  # Start frontend in background
  echo -e "${CYAN}💻 Starting frontend (port 3000)...${NC}"
  cd "$FRONTEND_DIR"
  NEXT_PUBLIC_BACKEND_URL="http://localhost:4000" \
  npm run dev > /tmp/frontend-dev.log 2>&1 &
  FRONTEND_PID=$!
  echo "$FRONTEND_PID" >> "$PID_FILE"
  echo -e "${GREEN}   Frontend PID: $FRONTEND_PID${NC}"
  
  # Wait a moment and check if frontend started successfully
  sleep 2
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start. Check logs: tail -f /tmp/frontend-dev.log${NC}"
    exit 1
  fi

  # Wait a bit for services to start
  sleep 3

  # Get aliases from env.example or use defaults
  FRONTEND_ALIAS="app.frontend.local"
  BACKEND_ALIAS="app.backend.local"
  if [ -f "$DOCKER_DIR/env.example" ]; then
    FRONTEND_ALIAS=$(grep "^FRONTEND_ALIAS=" "$DOCKER_DIR/env.example" 2>/dev/null | cut -d'=' -f2 || echo "$FRONTEND_ALIAS")
    BACKEND_ALIAS=$(grep "^BACKEND_ALIAS=" "$DOCKER_DIR/env.example" 2>/dev/null | cut -d'=' -f2 || echo "$BACKEND_ALIAS")
  fi

  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     🚀 Development Environment Started${NC}                    ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}📋 Service URLs:${NC}"
  echo ""
  echo -e "${GREEN}✅ Backend:${NC}"
  echo -e "   ${CYAN}🌐 http://localhost:4000${NC}"
  echo -e "   ${CYAN}🌐 http://${BACKEND_ALIAS}:4000${NC}"
  echo -e "   ${CYAN}🏥 Health: http://localhost:4000/health${NC}"
  echo ""
  echo -e "${GREEN}✅ Frontend:${NC}"
  echo -e "   ${CYAN}🌐 http://localhost:3000${NC}"
  echo -e "   ${CYAN}🌐 http://${FRONTEND_ALIAS}:3000${NC}"
  echo ""
  echo -e "${GREEN}✅ PostgreSQL:${NC} ${CYAN}localhost:5432${NC}"
  echo -e "${GREEN}✅ Redis:${NC}     ${CYAN}localhost:6379${NC}"
  echo ""
  echo -e "${YELLOW}💡 Logs:${NC}"
  echo -e "   Backend:  ${CYAN}tail -f /tmp/backend-dev.log${NC}"
  echo -e "   Frontend: ${CYAN}tail -f /tmp/frontend-dev.log${NC}"
  echo ""
  echo -e "${YELLOW}💡 First time setup (if needed):${NC}"
  echo -e "   ${CYAN}make migrate-dev${NC}  - Create and apply database migrations"
  echo -e "   ${CYAN}make seed${NC}          - Populate database with example data"
  echo -e "   ${CYAN}make db-push${NC}       - Quick: apply schema without migrations"
  echo ""
  echo -e "${YELLOW}💡 Prisma Studio:${NC}"
  echo -e "   ${CYAN}make prisma-studio${NC}     - Open Prisma Studio (http://localhost:5555)"
  echo -e "   ${CYAN}make prisma-studio-stop${NC} - Stop Prisma Studio"
  echo ""
  echo -e "${YELLOW}💡 To stop:${NC} ${CYAN}make dev-stop${NC} or ${CYAN}./scripts/dev.sh stop${NC}"
  echo ""
}

stop() {
  echo -e "${YELLOW}🛑 Stopping development environment...${NC}"

  # Stop processes from PID file
  if [ -f "$PID_FILE" ]; then
    while read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        echo -e "${CYAN}Stopping process $pid...${NC}"
        kill "$pid" 2>/dev/null || true
        # Wait a bit and force kill if still running
        sleep 1
        if kill -0 "$pid" 2>/dev/null; then
          echo -e "${CYAN}Force killing process $pid...${NC}"
          kill -9 "$pid" 2>/dev/null || true
        fi
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  # Also stop any processes using ports 4000 and 3000 (in case PID file is missing)
  if lsof -ti :4000 >/dev/null 2>&1; then
    echo -e "${CYAN}Stopping process on port 4000...${NC}"
    lsof -ti :4000 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi

  if lsof -ti :3000 >/dev/null 2>&1; then
    echo -e "${CYAN}Stopping process on port 3000...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi

  # Stop Prisma Studio if running
  if [ -f /tmp/prisma-studio.pid ]; then
    PRISMA_PID=$(cat /tmp/prisma-studio.pid 2>/dev/null)
    if [ -n "$PRISMA_PID" ] && kill -0 "$PRISMA_PID" 2>/dev/null; then
      echo -e "${CYAN}Stopping Prisma Studio (PID: $PRISMA_PID)...${NC}"
      kill "$PRISMA_PID" 2>/dev/null || true
      sleep 1
      if kill -0 "$PRISMA_PID" 2>/dev/null; then
        kill -9 "$PRISMA_PID" 2>/dev/null || true
      fi
      rm -f /tmp/prisma-studio.pid
    fi
  fi

  # Stop Docker services (only postgres and redis, keep backend/frontend stopped)
  cd "$DOCKER_DIR" && docker-compose stop postgres redis 2>/dev/null || true

  echo -e "${GREEN}✅ Development environment stopped${NC}"
}

status() {
  echo -e "${CYAN}📋 Development Environment Status:${NC}"
  echo ""

  # Check Docker services
  cd "$DOCKER_DIR"
  if docker-compose ps postgres redis 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL & Redis: Running${NC}"
  else
    echo -e "${YELLOW}⚪ PostgreSQL & Redis: Stopped${NC}"
  fi

  # Check backend
  if [ -f "$PID_FILE" ]; then
    BACKEND_PID=$(head -n 1 "$PID_FILE")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo -e "${GREEN}✅ Backend: Running (PID: $BACKEND_PID)${NC}"
    else
      echo -e "${YELLOW}⚪ Backend: Stopped${NC}"
    fi
  else
    echo -e "${YELLOW}⚪ Backend: Not started${NC}"
  fi

  # Check frontend
  if [ -f "$PID_FILE" ] && [ $(wc -l < "$PID_FILE") -ge 2 ]; then
    FRONTEND_PID=$(tail -n 1 "$PID_FILE")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo -e "${GREEN}✅ Frontend: Running (PID: $FRONTEND_PID)${NC}"
    else
      echo -e "${YELLOW}⚪ Frontend: Stopped${NC}"
    fi
  else
    echo -e "${YELLOW}⚪ Frontend: Not started${NC}"
  fi
}

case "${1:-start}" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 [start|stop|status]"
    exit 1
    ;;
esac

