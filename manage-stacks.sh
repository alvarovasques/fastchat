#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para calcular recursos compartilhados
calculate_resources() {
    local total_cpu=$1
    local total_memory=$2
    
    # CPU é distribuída de acordo com a necessidade real de cada serviço
    # Backend: 40% (mais processamento)
    # PostgreSQL: 30% (banco de dados)
    # Frontend: 20% (interface)
    # Redis: 10% (cache)
    export BACKEND_CPU_LIMIT=$(echo "scale=2; $total_cpu * 0.4" | bc)
    export POSTGRES_CPU_LIMIT=$(echo "scale=2; $total_cpu * 0.3" | bc)
    export FRONTEND_CPU_LIMIT=$(echo "scale=2; $total_cpu * 0.2" | bc)
    export REDIS_CPU_LIMIT=$(echo "scale=2; $total_cpu * 0.1" | bc)
    
    # Reservas de CPU são 50% dos limites
    export BACKEND_CPU_RESERVE=$(echo "scale=2; $BACKEND_CPU_LIMIT * 0.5" | bc)
    export POSTGRES_CPU_RESERVE=$(echo "scale=2; $POSTGRES_CPU_LIMIT * 0.5" | bc)
    export FRONTEND_CPU_RESERVE=$(echo "scale=2; $FRONTEND_CPU_LIMIT * 0.5" | bc)
    export REDIS_CPU_RESERVE=$(echo "scale=2; $REDIS_CPU_LIMIT * 0.5" | bc)
    
    # Memória é distribuída proporcionalmente
    export BACKEND_MEM_LIMIT=$(echo "scale=1; $total_memory * 0.4" | bc)
    export FRONTEND_MEM_LIMIT=$(echo "scale=1; $total_memory * 0.2" | bc)
    export POSTGRES_MEM_LIMIT=$(echo "scale=1; $total_memory * 0.3" | bc)
    export REDIS_MEM_LIMIT=$(echo "scale=1; $total_memory * 0.1" | bc)
    
    # Reservas de memória são 50% dos limites
    export BACKEND_MEM_RESERVE=$(echo "scale=1; $BACKEND_MEM_LIMIT * 0.5" | bc)
    export FRONTEND_MEM_RESERVE=$(echo "scale=1; $FRONTEND_MEM_LIMIT * 0.5" | bc)
    export POSTGRES_MEM_RESERVE=$(echo "scale=1; $POSTGRES_MEM_LIMIT * 0.5" | bc)
    export REDIS_MEM_RESERVE=$(echo "scale=1; $REDIS_MEM_LIMIT * 0.5" | bc)
}

# Função para subir uma stack
up_stack() {
    local stack_name=$1
    local backend_port=$2
    local frontend_port=$3
    local backend_url=$4
    local frontend_url=$5
    local total_cpu=${6:-1}
    local total_memory=${7:-1024}

    # Calcula recursos compartilhados
    calculate_resources $total_cpu $total_memory

    # Define as variáveis de ambiente
    export STACK_NAME=$stack_name
    export BACKEND_PORT=$backend_port
    export FRONTEND_PORT=$frontend_port
    export BACKEND_URL=${backend_url:-http://localhost:$backend_port}
    export FRONTEND_URL=${frontend_url:-http://localhost:$frontend_port}

    echo -e "${BLUE}Iniciando stack $stack_name...${NC}"
    echo -e "${YELLOW}Recursos totais:${NC}"
    echo -e "CPU: ${GREEN}$total_cpu${NC} cores (compartilhados entre todos os serviços)"
    echo -e "Memória: ${GREEN}$total_memory${NC}MB"
    echo -e "\n${YELLOW}Distribuição de recursos:${NC}"
    echo -e "Backend:    CPU ${GREEN}$BACKEND_CPU_LIMIT${NC} cores (reserva: $BACKEND_CPU_RESERVE), Memória ${GREEN}$BACKEND_MEM_LIMIT${NC}MB (reserva: $BACKEND_MEM_RESERVE)"
    echo -e "Frontend:   CPU ${GREEN}$FRONTEND_CPU_LIMIT${NC} cores (reserva: $FRONTEND_CPU_RESERVE), Memória ${GREEN}$FRONTEND_MEM_LIMIT${NC}MB (reserva: $FRONTEND_MEM_RESERVE)"
    echo -e "PostgreSQL: CPU ${GREEN}$POSTGRES_CPU_LIMIT${NC} cores (reserva: $POSTGRES_CPU_RESERVE), Memória ${GREEN}$POSTGRES_MEM_LIMIT${NC}MB (reserva: $POSTGRES_MEM_RESERVE)"
    echo -e "Redis:      CPU ${GREEN}$REDIS_CPU_LIMIT${NC} cores (reserva: $REDIS_CPU_RESERVE), Memória ${GREEN}$REDIS_MEM_LIMIT${NC}MB (reserva: $REDIS_MEM_RESERVE)"
    
    # Sube a stack
    docker-compose -p $stack_name up -d --build

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}Stack $stack_name iniciada com sucesso!${NC}"
        echo -e "\n${YELLOW}URLs de acesso:${NC}"
        echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
        echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
        echo -e "\n${YELLOW}Comandos úteis:${NC}"
        echo -e "Logs:     ${GREEN}./manage-stacks.sh logs $stack_name${NC}"
        echo -e "Parar:    ${GREEN}./manage-stacks.sh down $stack_name${NC}"
    else
        echo -e "\n${RED}Erro ao iniciar stack $stack_name${NC}"
    fi
}

# Função para parar uma stack
down_stack() {
    local stack_name=$1
    echo -e "${BLUE}Parando stack $stack_name...${NC}"
    docker-compose -p $stack_name down
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Stack $stack_name parada com sucesso!${NC}"
    else
        echo -e "${RED}Erro ao parar stack $stack_name${NC}"
    fi
}

# Função para listar todas as stacks
list_stacks() {
    echo -e "${YELLOW}Listando todas as stacks:${NC}\n"
    docker-compose ps --all
}

# Função para mostrar logs de uma stack
logs_stack() {
    local stack_name=$1
    echo -e "${YELLOW}Mostrando logs da stack $stack_name:${NC}\n"
    docker-compose -p $stack_name logs -f
}

# Função para mostrar status de uma stack
status_stack() {
    local stack_name=$1
    echo -e "${YELLOW}Status da stack $stack_name:${NC}\n"
    docker-compose -p $stack_name ps
}

# Função para reiniciar uma stack
restart_stack() {
    local stack_name=$1
    echo -e "${BLUE}Reiniciando stack $stack_name...${NC}"
    docker-compose -p $stack_name restart
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Stack $stack_name reiniciada com sucesso!${NC}"
    else
        echo -e "${RED}Erro ao reiniciar stack $stack_name${NC}"
    fi
}

# Menu principal
case "$1" in
    "up")
        up_stack ${2:-codatende} ${3:-3000} ${4:-3001} ${5:-http://localhost:3000} ${6:-http://localhost:3001} ${7:-1} ${8:-1024}
        ;;
    "down")
        down_stack ${2:-codatende}
        ;;
    "list")
        list_stacks
        ;;
    "logs")
        logs_stack ${2:-codatende}
        ;;
    "status")
        status_stack ${2:-codatende}
        ;;
    "restart")
        restart_stack ${2:-codatende}
        ;;
    *)
        echo -e "${YELLOW}Uso: $0 {up|down|list|logs|status|restart} [stack_name] [backend_port] [frontend_port] [backend_url] [frontend_url] [total_cpu] [total_memory]${NC}"
        echo -e "\n${GREEN}Exemplos:${NC}"
        echo -e "  $0 up codatende1 3000 3001"
        echo -e "  $0 up codatende2 4000 4001 https://api.exemplo.com https://app.exemplo.com"
        echo -e "  $0 up codatende3 5000 5001 http://localhost:5000 http://localhost:5001 1 2048"
        echo -e "  $0 down codatende1"
        echo -e "  $0 logs codatende1"
        echo -e "  $0 status codatende1"
        echo -e "  $0 restart codatende1"
        exit 1
        ;;
esac 