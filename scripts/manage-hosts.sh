#!/bin/bash

# Script to manage entries in /etc/hosts file
# Usage: ./manage-hosts.sh [add|remove] [frontend_alias] [backend_alias]

ACTION=${1:-add}
FRONTEND_ALIAS=${2:-voto-inteligente.frontend.local}
BACKEND_ALIAS=${3:-voto-inteligente.backend.local}

HOSTS_FILE="/etc/hosts"
TEMP_FILE="/tmp/hosts.tmp"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$ACTION" = "add" ]; then
    echo -e "${GREEN}➕ Adding aliases to /etc/hosts...${NC}"
    
    # Check if already exists
    if grep -q "$FRONTEND_ALIAS" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Alias $FRONTEND_ALIAS already exists in /etc/hosts${NC}"
    else
        # Add frontend entry
        echo "127.0.0.1    $FRONTEND_ALIAS" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo -e "${GREEN}✅ Added: $FRONTEND_ALIAS${NC}"
    fi
    
    if grep -q "$BACKEND_ALIAS" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Alias $BACKEND_ALIAS already exists in /etc/hosts${NC}"
    else
        # Add backend entry
        echo "127.0.0.1    $BACKEND_ALIAS" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo -e "${GREEN}✅ Added: $BACKEND_ALIAS${NC}"
    fi
    
elif [ "$ACTION" = "remove" ]; then
    echo -e "${YELLOW}🗑️  Removing aliases from /etc/hosts...${NC}"
    
    # Remove entries using sudo
    sudo sed -i.bak "/$FRONTEND_ALIAS/d" "$HOSTS_FILE" 2>/dev/null && \
        echo -e "${GREEN}✅ Removed: $FRONTEND_ALIAS${NC}" || \
        echo -e "${YELLOW}⚠️  $FRONTEND_ALIAS not found${NC}"
    
    sudo sed -i.bak "/$BACKEND_ALIAS/d" "$HOSTS_FILE" 2>/dev/null && \
        echo -e "${GREEN}✅ Removed: $BACKEND_ALIAS${NC}" || \
        echo -e "${YELLOW}⚠️  $BACKEND_ALIAS not found${NC}"
    
    # Remove backup if created
    [ -f "$HOSTS_FILE.bak" ] && sudo rm "$HOSTS_FILE.bak"
else
    echo -e "${RED}❌ Invalid action. Use 'add' or 'remove'${NC}"
    exit 1
fi

