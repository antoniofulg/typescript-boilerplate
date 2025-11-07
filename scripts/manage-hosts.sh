#!/bin/bash

# Script para gerenciar entradas no arquivo /etc/hosts
# Uso: ./manage-hosts.sh [add|remove] [frontend_alias] [backend_alias]

ACTION=${1:-add}
FRONTEND_ALIAS=${2:-voto-inteligente.front.local}
BACKEND_ALIAS=${3:-voto-inteligente.backend.local}

HOSTS_FILE="/etc/hosts"
TEMP_FILE="/tmp/hosts.tmp"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$ACTION" = "add" ]; then
    echo -e "${GREEN}➕ Adicionando aliases ao /etc/hosts...${NC}"
    
    # Verifica se já existe
    if grep -q "$FRONTEND_ALIAS" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  O alias $FRONTEND_ALIAS já existe no /etc/hosts${NC}"
    else
        # Adiciona entrada do frontend
        echo "127.0.0.1    $FRONTEND_ALIAS" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo -e "${GREEN}✅ Adicionado: $FRONTEND_ALIAS${NC}"
    fi
    
    if grep -q "$BACKEND_ALIAS" "$HOSTS_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  O alias $BACKEND_ALIAS já existe no /etc/hosts${NC}"
    else
        # Adiciona entrada do backend
        echo "127.0.0.1    $BACKEND_ALIAS" | sudo tee -a "$HOSTS_FILE" > /dev/null
        echo -e "${GREEN}✅ Adicionado: $BACKEND_ALIAS${NC}"
    fi
    
elif [ "$ACTION" = "remove" ]; then
    echo -e "${YELLOW}🗑️  Removendo aliases do /etc/hosts...${NC}"
    
    # Remove entradas usando sudo
    sudo sed -i.bak "/$FRONTEND_ALIAS/d" "$HOSTS_FILE" 2>/dev/null && \
        echo -e "${GREEN}✅ Removido: $FRONTEND_ALIAS${NC}" || \
        echo -e "${YELLOW}⚠️  $FRONTEND_ALIAS não encontrado${NC}"
    
    sudo sed -i.bak "/$BACKEND_ALIAS/d" "$HOSTS_FILE" 2>/dev/null && \
        echo -e "${GREEN}✅ Removido: $BACKEND_ALIAS${NC}" || \
        echo -e "${YELLOW}⚠️  $BACKEND_ALIAS não encontrado${NC}"
    
    # Remove backup se criado
    [ -f "$HOSTS_FILE.bak" ] && sudo rm "$HOSTS_FILE.bak"
else
    echo -e "${RED}❌ Ação inválida. Use 'add' ou 'remove'${NC}"
    exit 1
fi

