#!/bin/bash

# Script to initialize a new project with a custom name
# Usage: ./scripts/init-project.sh [project-name]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Function to validate project name
validate_project_name() {
  local name=$1
  
  # Check if empty
  if [ -z "$name" ]; then
    echo -e "${RED}❌ Project name cannot be empty${NC}"
    return 1
  fi
  
  # Check if contains only alphanumeric characters, hyphens, and underscores
  if ! [[ "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo -e "${RED}❌ Project name can only contain letters, numbers, hyphens, and underscores${NC}"
    return 1
  fi
  
  # Check if starts with a letter or number
  if ! [[ "$name" =~ ^[a-zA-Z0-9] ]]; then
    echo -e "${RED}❌ Project name must start with a letter or number${NC}"
    return 1
  fi
  
  return 0
}

# Function to sanitize project name for database (lowercase, replace hyphens with underscores)
sanitize_db_name() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr '-' '_'
}

# Get project name
if [ -n "$1" ]; then
  PROJECT_NAME="$1"
else
  echo -e "${CYAN}📝 Enter the project name:${NC}"
  read -r PROJECT_NAME
fi

# Validate project name
if ! validate_project_name "$PROJECT_NAME"; then
  exit 1
fi

# Sanitize for database name
DB_NAME=$(sanitize_db_name "$PROJECT_NAME")

echo ""
echo -e "${GREEN}🚀 Initializing project: ${BOLD}$PROJECT_NAME${NC}${GREEN}${NC}"
echo -e "${CYAN}   Database name: ${BOLD}${DB_NAME}_db${NC}${CYAN}${NC}"
echo ""

# Confirm
echo -e "${YELLOW}⚠️  This will replace all references to 'app' with '${PROJECT_NAME}' in the following files:${NC}"
echo "   - docker/env.example"
echo "   - docker/env.postgres.example"
echo "   - Makefile"
echo "   - scripts/manage-hosts.sh"
echo "   - scripts/dev.sh"
echo "   - backend/src/main.ts"
echo "   - docker/docker-compose.yml"
echo ""
echo -e "${YELLOW}Continue? (y/N):${NC} "
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Aborted.${NC}"
  exit 0
fi

echo ""
echo -e "${CYAN}🔄 Making substitutions...${NC}"

# Function to replace in file
replace_in_file() {
  local file=$1
  local old=$2
  local new=$3
  
  if [ -f "$file" ]; then
    # Use a Python one-liner for reliable literal string replacement
    # Python handles all special characters correctly without complex escaping
    local temp_file=$(mktemp)
    # Use base64 encoding to safely pass strings with special characters to Python
    local old_encoded=$(printf '%s' "$old" | base64)
    local new_encoded=$(printf '%s' "$new" | base64)
    if python3 -c "
import sys
import base64
old = base64.b64decode('$old_encoded').decode('utf-8')
new = base64.b64decode('$new_encoded').decode('utf-8')
with open('$file', 'r') as f:
    content = f.read()
content = content.replace(old, new)
with open('$temp_file', 'w') as f:
    f.write(content)
" 2>/dev/null; then
      if [ -s "$temp_file" ]; then
        mv "$temp_file" "$file" 2>/dev/null
        echo -e "${GREEN}✅ Updated: $file${NC}"
        return 0
      else
        rm -f "$temp_file" 2>/dev/null
        echo -e "${RED}❌ Replacement resulted in empty file: $file${NC}"
        return 1
      fi
    else
      # Fallback to sed if python3 is not available
      local old_escaped=$(printf '%s\n' "$old" | sed 's/[[\.*^$()+?{|]/\\&/g' | sed "s/'/\\\'/g")
      local new_escaped=$(printf '%s\n' "$new" | sed -e 's/\\/\\\\/g' -e 's/&/\\&/g' | sed "s/'/\\\'/g")
      if sed -i.bak "s|$old_escaped|$new_escaped|g" "$file" 2>/dev/null; then
        rm -f "${file}.bak" 2>/dev/null
        echo -e "${GREEN}✅ Updated: $file${NC}"
        return 0
      else
        rm -f "$temp_file" 2>/dev/null
        echo -e "${RED}❌ Failed to update: $file${NC}"
        return 1
      fi
    fi
  else
    echo -e "${YELLOW}⚠️  File not found: $file${NC}"
    return 1
  fi
}

# Replace in docker/env.example
replace_in_file "$PROJECT_DIR/docker/env.example" "COMPOSE_PROJECT_NAME=app" "COMPOSE_PROJECT_NAME=$PROJECT_NAME"
replace_in_file "$PROJECT_DIR/docker/env.example" "POSTGRES_DB=app_db" "POSTGRES_DB=${DB_NAME}_db"
replace_in_file "$PROJECT_DIR/docker/env.example" "FRONTEND_ALIAS=app.frontend.local" "FRONTEND_ALIAS=$PROJECT_NAME.frontend.local"
replace_in_file "$PROJECT_DIR/docker/env.example" "BACKEND_ALIAS=app.backend.local" "BACKEND_ALIAS=$PROJECT_NAME.backend.local"

# Replace in docker/env.postgres.example
replace_in_file "$PROJECT_DIR/docker/env.postgres.example" "POSTGRES_DB=app_db" "POSTGRES_DB=${DB_NAME}_db"

# Replace in Makefile
replace_in_file "$PROJECT_DIR/Makefile" "FRONTEND_ALIAS ?= app.frontend.local" "FRONTEND_ALIAS ?= $PROJECT_NAME.frontend.local"
replace_in_file "$PROJECT_DIR/Makefile" "BACKEND_ALIAS ?= app.backend.local" "BACKEND_ALIAS ?= $PROJECT_NAME.backend.local"
replace_in_file "$PROJECT_DIR/Makefile" "docker rm -f app-postgres app-redis app-backend app-frontend" "docker rm -f ${PROJECT_NAME}-postgres ${PROJECT_NAME}-redis ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend"
replace_in_file "$PROJECT_DIR/Makefile" "app-backend" "${PROJECT_NAME}-backend"
replace_in_file "$PROJECT_DIR/Makefile" "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/app_db?schema=public\"" "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/${DB_NAME}_db?schema=public\""

# Replace in scripts/manage-hosts.sh
replace_in_file "$PROJECT_DIR/scripts/manage-hosts.sh" 'FRONTEND_ALIAS=\${2:-app.frontend.local}' "FRONTEND_ALIAS=\${2:-$PROJECT_NAME.frontend.local}"
replace_in_file "$PROJECT_DIR/scripts/manage-hosts.sh" 'BACKEND_ALIAS=\${3:-app.backend.local}' "BACKEND_ALIAS=\${3:-$PROJECT_NAME.backend.local}"

# Replace in scripts/dev.sh
replace_in_file "$PROJECT_DIR/scripts/dev.sh" "docker rm -f app-postgres app-redis app-backend app-frontend" "docker rm -f ${PROJECT_NAME}-postgres ${PROJECT_NAME}-redis ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend"
replace_in_file "$PROJECT_DIR/scripts/dev.sh" "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/app_db?schema=public\"" "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/${DB_NAME}_db?schema=public\""

# Replace in backend/src/main.ts
replace_in_file "$PROJECT_DIR/backend/src/main.ts" "const frontendAlias = process.env.FRONTEND_ALIAS || 'app.frontend.local';" "const frontendAlias = process.env.FRONTEND_ALIAS || '$PROJECT_NAME.frontend.local';"

# Replace in docker/docker-compose.yml (default values)
replace_in_file "$PROJECT_DIR/docker/docker-compose.yml" '\${COMPOSE_PROJECT_NAME:-app}' "\${COMPOSE_PROJECT_NAME:-$PROJECT_NAME}"
replace_in_file "$PROJECT_DIR/docker/docker-compose.yml" '\${POSTGRES_DB:-app_db}' "\${POSTGRES_DB:-${DB_NAME}_db}"
replace_in_file "$PROJECT_DIR/docker/docker-compose.yml" '\${FRONTEND_ALIAS:-app.frontend.local}' "\${FRONTEND_ALIAS:-$PROJECT_NAME.frontend.local}"
replace_in_file "$PROJECT_DIR/docker/docker-compose.yml" '\${BACKEND_ALIAS:-app.backend.local}' "\${BACKEND_ALIAS:-$PROJECT_NAME.backend.local}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Project initialized successfully!${NC}                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📋 Summary:${NC}"
echo -e "   Project name: ${BOLD}$PROJECT_NAME${NC}"
echo -e "   Database name: ${BOLD}${DB_NAME}_db${NC}"
echo -e "   Frontend alias: ${BOLD}$PROJECT_NAME.frontend.local${NC}"
echo -e "   Backend alias: ${BOLD}$PROJECT_NAME.backend.local${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Run ${BOLD}make setup-env${NC} to create .env files"
echo -e "   2. Run ${BOLD}make dev${NC} to start the development environment"
echo ""

