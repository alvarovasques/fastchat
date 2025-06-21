#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arquivo de instâncias
INSTANCES_FILE="instances.json"

# Função para inicializar o arquivo de instâncias
init_instances_file() {
    if [[ ! -f "$INSTANCES_FILE" ]]; then
        echo '{"instances": {}}' > "$INSTANCES_FILE"
        echo -e "${GREEN}📄 Arquivo de instâncias criado: $INSTANCES_FILE${NC}"
    fi
}

# Função para salvar uma instância
save_instance() {
    local stack_name=$1
    local backend_port=$2
    local frontend_port=$3
    local backend_url=$4
    local frontend_url=$5
    local total_cpu=$6
    local total_memory=$7
    local enable_financial=$8
    local gerencianet_client_id=$9
    local gerencianet_client_secret=${10}
    local gerencianet_pix_key=${11}
    
    init_instances_file
    
    # Atualiza o arquivo JSON usando jq
    if command -v jq &> /dev/null; then
        jq --arg name "$stack_name" \
           --arg created_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
           --arg updated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
           --arg backend_port "$backend_port" \
           --arg frontend_port "$frontend_port" \
           --arg backend_url "$backend_url" \
           --arg frontend_url "$frontend_url" \
           --arg total_cpu "$total_cpu" \
           --arg total_memory "$total_memory" \
           --arg enable_financial "$enable_financial" \
           --arg gerencianet_client_id "$gerencianet_client_id" \
           --arg gerencianet_client_secret "$gerencianet_client_secret" \
           --arg gerencianet_pix_key "$gerencianet_pix_key" \
           '.instances[$name] = {
               "name": $name,
               "created_at": $created_at,
               "updated_at": $updated_at,
               "config": {
                   "backend_port": $backend_port,
                   "frontend_port": $frontend_port,
                   "backend_url": $backend_url,
                   "frontend_url": $frontend_url,
                   "total_cpu": $total_cpu,
                   "total_memory": $total_memory,
                   "enable_financial": $enable_financial,
                   "gerencianet_client_id": $gerencianet_client_id,
                   "gerencianet_client_secret": $gerencianet_client_secret,
                   "gerencianet_pix_key": $gerencianet_pix_key
               },
               "status": "running"
           }' "$INSTANCES_FILE" > "${INSTANCES_FILE}.tmp" && mv "${INSTANCES_FILE}.tmp" "$INSTANCES_FILE"
    else
        echo -e "${YELLOW}⚠️  Aviso: jq não encontrado. Instância não foi salva no arquivo JSON.${NC}"
    fi
}

# Função para carregar uma instância
load_instance() {
    local stack_name=$1
    
    if [[ ! -f "$INSTANCES_FILE" ]]; then
        return 1
    fi
    
    if command -v jq &> /dev/null; then
        local config=$(jq -r ".instances[\"$stack_name\"].config" "$INSTANCES_FILE" 2>/dev/null)
        if [[ "$config" != "null" ]]; then
            export STACK_NAME=$stack_name
            export BACKEND_PORT=$(echo "$config" | jq -r '.backend_port')
            export FRONTEND_PORT=$(echo "$config" | jq -r '.frontend_port')
            export BACKEND_URL=$(echo "$config" | jq -r '.backend_url')
            export FRONTEND_URL=$(echo "$config" | jq -r '.frontend_url')
            export TOTAL_CPU=$(echo "$config" | jq -r '.total_cpu')
            export TOTAL_MEMORY=$(echo "$config" | jq -r '.total_memory')
            export ENABLE_FINANCIAL=$(echo "$config" | jq -r '.enable_financial // "false"')
            export GERENCIANET_CLIENT_ID=$(echo "$config" | jq -r '.gerencianet_client_id // ""')
            export GERENCIANET_CLIENT_SECRET=$(echo "$config" | jq -r '.gerencianet_client_secret // ""')
            export GERENCIANET_PIX_KEY=$(echo "$config" | jq -r '.gerencianet_pix_key // ""')
            return 0
        fi
    fi
    
    return 1
}

# Função para atualizar uma instância
update_instance() {
    local stack_name=$1
    
    if command -v jq &> /dev/null; then
        jq --arg name "$stack_name" --arg updated_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '.instances[$name].updated_at = $updated_at' "$INSTANCES_FILE" > "${INSTANCES_FILE}.tmp" && mv "${INSTANCES_FILE}.tmp" "$INSTANCES_FILE"
    fi
}

# Função para listar todas as instâncias
list_instances() {
    if [[ ! -f "$INSTANCES_FILE" ]]; then
        echo -e "${YELLOW}📭 Nenhuma instância encontrada.${NC}"
        return
    fi
    
    if command -v jq &> /dev/null; then
        echo -e "${YELLOW}📋 Instâncias salvas:${NC}\n"
        jq -r '.instances | to_entries[] | "Nome: \(.key)\n  Criada: \(.value.created_at)\n  Atualizada: \(.value.updated_at)\n  Backend: \(.value.config.backend_url)\n  Frontend: \(.value.config.frontend_url)\n  CPU: \(.value.config.total_cpu) cores\n  Memória: \(.value.config.total_memory)MB\n  Módulo financeiro: \(.value.config.enable_financial // "false")\n  Status: \(.value.status)\n"' "$INSTANCES_FILE"
    else
        echo -e "${YELLOW}⚠️  jq não encontrado. Não é possível listar instâncias.${NC}"
    fi
}

# Função para remover uma instância
remove_instance() {
    local stack_name=$1
    
    if command -v jq &> /dev/null; then
        jq --arg name "$stack_name" 'del(.instances[$name])' "$INSTANCES_FILE" > "${INSTANCES_FILE}.tmp" && mv "${INSTANCES_FILE}.tmp" "$INSTANCES_FILE"
        echo -e "${GREEN}🗑️  Instância $stack_name removida do arquivo.${NC}"
    else
        echo -e "${YELLOW}⚠️  jq não encontrado. Instância não foi removida do arquivo.${NC}"
    fi
}

# Função para validar se a instância existe no banco
validate_instance() {
    local stack_name=$1
    local command_name=$2
    
    if [[ ! -f "$INSTANCES_FILE" ]]; then
        echo -e "${RED}❌ Erro: Arquivo de instâncias não encontrado.${NC}"
        echo -e "${YELLOW}💡 Use 'up' para criar uma nova instância primeiro.${NC}"
        exit 1
    fi
    
    if command -v jq &> /dev/null; then
        local exists=$(jq -r ".instances[\"$stack_name\"]" "$INSTANCES_FILE" 2>/dev/null)
        if [[ "$exists" == "null" ]]; then
            echo -e "${RED}❌ Erro: Instância '$stack_name' não encontrada no banco de dados.${NC}"
            echo -e "\n${YELLOW}📋 Instâncias disponíveis:${NC}"
            list_instances
            echo -e "\n${YELLOW}🔧 Comandos disponíveis:${NC}"
            echo -e "  🚀 ./manage-stacks.sh up -n $stack_name${NC}     # 🚀 Criar nova instância"
            echo -e "  📋 ./manage-stacks.sh instances${NC}              # 📋 Ver todas as instâncias"
            echo -e "  📊 ./manage-stacks.sh list${NC}                   # 📊 Ver stacks Docker"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Aviso: jq não encontrado. Validação de instância desabilitada.${NC}"
    fi
}

# Função para executar rollback em caso de erro
rollback_stack() {
    local stack_name=$1
    
    echo -e "${YELLOW}🔄 Executando rollback para stack $stack_name...${NC}"
    
    # Para todos os containers da stack
    echo -e "  📦 Parando containers..."
    docker-compose -p $stack_name down --remove-orphans 2>/dev/null
    
    # Remove containers órfãos que possam ter sido criados
    echo -e "  🧹 Removendo containers órfãos..."
    docker ps -a --filter "name=${stack_name}_" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null
    
    # Remove networks órfãs
    echo -e "  🌐 Removendo networks órfãs..."
    docker network ls --filter "name=${stack_name}_" --format "{{.ID}}" | xargs -r docker network rm 2>/dev/null
    
    # Remove volumes órfãos (cuidado: isso remove dados)
    echo -e "  💾 Removendo volumes órfãos..."
    docker volume ls --filter "name=${stack_name}_" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null
    
    # Remove a instância do arquivo JSON se existir
    if command -v jq &> /dev/null; then
        local exists=$(jq -r ".instances[\"$stack_name\"]" "$INSTANCES_FILE" 2>/dev/null)
        if [[ "$exists" != "null" ]]; then
            echo -e "  📝 Removendo instância do arquivo..."
            remove_instance "$stack_name"
        fi
    fi
    
    echo -e "${GREEN}✅ Rollback concluído. Todos os recursos da stack $stack_name foram removidos.${NC}"
    echo -e "${YELLOW}💡 Dica: Verifique os logs para identificar o problema antes de tentar novamente.${NC}"
}

# Função para verificar se uma porta está em uso
check_port_usage() {
    local port=$1
    local service_name=$2
    
    echo -e "${YELLOW}🔍 Verificando se a porta $port está disponível para $service_name...${NC}"
    
    # Verifica se a porta está em uso no sistema
    if command -v lsof &> /dev/null; then
        # Usa lsof para verificar se a porta está em uso
        local port_in_use=$(lsof -i :$port 2>/dev/null | grep LISTEN)
        if [[ -n "$port_in_use" ]]; then
            echo -e "${RED}❌ Erro: Porta $port já está em uso!${NC}"
            echo -e "${YELLOW}📋 Processos usando a porta $port:${NC}"
            lsof -i :$port 2>/dev/null | grep LISTEN | while read line; do
                echo -e "  ${RED}  $line${NC}"
            done
            echo -e "\n${YELLOW}💡 Soluções:${NC}"
            echo -e "  1. Pare o processo que está usando a porta $port"
            echo -e "  2. Use uma porta diferente: -b $((port+1)) para backend ou -f $((port+1)) para frontend"
            echo -e "  3. Verifique se há outra instância rodando: ./manage-stacks.sh list"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        # Fallback para netstat
        local port_in_use=$(netstat -tuln 2>/dev/null | grep ":$port ")
        if [[ -n "$port_in_use" ]]; then
            echo -e "${RED}❌ Erro: Porta $port já está em uso!${NC}"
            echo -e "${YELLOW}📋 Porta $port está ocupada no sistema${NC}"
            echo -e "\n${YELLOW}💡 Soluções:${NC}"
            echo -e "  1. Pare o processo que está usando a porta $port"
            echo -e "  2. Use uma porta diferente: -b $((port+1)) para backend ou -f $((port+1)) para frontend"
            echo -e "  3. Verifique se há outra instância rodando: ./manage-stacks.sh list"
            return 1
        fi
    elif command -v ss &> /dev/null; then
        # Fallback para ss (socket statistics)
        local port_in_use=$(ss -tuln 2>/dev/null | grep ":$port ")
        if [[ -n "$port_in_use" ]]; then
            echo -e "${RED}❌ Erro: Porta $port já está em uso!${NC}"
            echo -e "${YELLOW}📋 Porta $port está ocupada no sistema${NC}"
            echo -e "\n${YELLOW}💡 Soluções:${NC}"
            echo -e "  1. Pare o processo que está usando a porta $port"
            echo -e "  2. Use uma porta diferente: -b $((port+1)) para backend ou -f $((port+1)) para frontend"
            echo -e "  3. Verifique se há outra instância rodando: ./manage-stacks.sh list"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Aviso: Não foi possível verificar se a porta $port está em uso (lsof/netstat/ss não encontrados)${NC}"
        echo -e "${YELLOW}💡 Verifique manualmente se a porta $port está disponível${NC}"
    fi
    
    echo -e "${GREEN}✅ Porta $port está disponível para $service_name${NC}"
    return 0
}

# Função para verificar se as portas estão em uso (backend e frontend)
validate_ports() {
    local backend_port=$1
    local frontend_port=$2
    
    echo -e "${YELLOW}🔍 Verificando disponibilidade das portas...${NC}"
    
    # Verifica se as portas são iguais
    if [[ "$backend_port" == "$frontend_port" ]]; then
        echo -e "${RED}❌ Erro: Backend e frontend não podem usar a mesma porta ($backend_port)!${NC}"
        echo -e "${YELLOW}💡 Use portas diferentes para backend e frontend${NC}"
        return 1
    fi
    
    # Verifica se as portas são válidas (entre 1 e 65535)
    if ! [[ "$backend_port" =~ ^[0-9]+$ ]] || [[ "$backend_port" -lt 1 ]] || [[ "$backend_port" -gt 65535 ]]; then
        echo -e "${RED}❌ Erro: Porta do backend ($backend_port) não é válida!${NC}"
        echo -e "${YELLOW}💡 Use uma porta entre 1 e 65535${NC}"
        return 1
    fi
    
    if ! [[ "$frontend_port" =~ ^[0-9]+$ ]] || [[ "$frontend_port" -lt 1 ]] || [[ "$frontend_port" -gt 65535 ]]; then
        echo -e "${RED}❌ Erro: Porta do frontend ($frontend_port) não é válida!${NC}"
        echo -e "${YELLOW}💡 Use uma porta entre 1 e 65535${NC}"
        return 1
    fi
    
    # Verifica se as portas estão em uso
    local backend_ok=false
    local frontend_ok=false
    
    if check_port_usage "$backend_port" "backend"; then
        backend_ok=true
    fi
    
    if check_port_usage "$frontend_port" "frontend"; then
        frontend_ok=true
    fi
    
    # Retorna sucesso apenas se ambas as portas estiverem disponíveis
    if [[ "$backend_ok" == "true" && "$frontend_ok" == "true" ]]; then
        echo -e "${GREEN}✅ Todas as portas estão disponíveis!${NC}"
        return 0
    else
        return 1
    fi
}

# Função para mostrar ajuda
show_help() {
    echo -e "${YELLOW}🐳 Gerenciador de Stacks Docker${NC}"
    echo -e "\n${GREEN}📖 Uso:${NC}"
    echo -e "  $0 up [OPÇÕES]"
    echo -e "  $0 down [OPÇÕES]"
    echo -e "  $0 update [OPÇÕES]"
    echo -e "  $0 list"
    echo -e "  $0 instances"
    echo -e "  $0 logs [OPÇÕES]"
    echo -e "  $0 status [OPÇÕES]"
    echo -e "  $0 restart [OPÇÕES]"
    echo -e "\n${GREEN}🔧 Comandos:${NC}"
    echo -e "  🚀 up        - Inicia uma nova stack (salva configuração)"
    echo -e "  🛑 down      - Para uma stack"
    echo -e "  🔄 update    - Atualiza e rebuilda imagens Docker (preserva configuração)"
    echo -e "  📊 list      - Lista todas as stacks Docker"
    echo -e "  📋 instances - Lista todas as instâncias salvas"
    echo -e "  📝 logs      - Mostra logs de uma stack"
    echo -e "  📈 status    - Mostra status de uma stack"
    echo -e "  🔄 restart   - Reinicia uma stack"
    echo -e "\n${GREEN}⚙️  Opções para 'up':${NC}"
    echo -e "  -n, --name STACK_NAME     Nome da stack (padrão: codatende)"
    echo -e "  -b, --backend-port PORT   Porta do backend (padrão: 3000)"
    echo -e "  -f, --frontend-port PORT  Porta do frontend (padrão: 3001)"
    echo -e "  -u, --backend-url URL     URL do backend (padrão: http://localhost:PORT)"
    echo -e "  -w, --frontend-url URL    URL do frontend (padrão: http://localhost:PORT)"
    echo -e "  -c, --cpu CORES           Total de cores CPU (padrão: 2)"
    echo -e "  -m, --memory MB           Total de memória em MB (padrão: 2048)"
    echo -e "\n${GREEN}💰 Opções do módulo financeiro:${NC}"
    echo -e "  -e, --enable-financial    Habilita o módulo financeiro (padrão: desabilitado)"
    echo -e "  -g, --gerencianet-client-id ID      Client ID do Gerencianet"
    echo -e "  -s, --gerencianet-client-secret SECRET  Client Secret do Gerencianet"
    echo -e "  -p, --gerencianet-pix-key KEY       Chave PIX do Gerencianet"
    echo -e "\n${GREEN}⚙️  Opções para outros comandos:${NC}"
    echo -e "  -n, --name STACK_NAME     Nome da stack (padrão: codatende)"
    echo -e "\n${GREEN}💡 Exemplos:${NC}"
    echo -e "  # 🚀 Criar nova instância (salva configuração automaticamente)"
    echo -e "  $0 up -n codatende1 -b 3000 -f 3001"
    echo -e "  $0 up --name codatende2 --backend-port 4000 --frontend-port 4001"
    echo -e "  $0 up -n codatende3 -b 5000 -f 5001 -c 2 -m 2048"
    echo -e "  $0 up -n codatende4 -u https://api.exemplo.com -w https://app.exemplo.com"
    echo -e "\n  # 💰 Criar instância com módulo financeiro habilitado"
    echo -e "  $0 up -n codatende-finance -e -g CLIENT_ID -s CLIENT_SECRET -p PIX_KEY"
    echo -e "  $0 up --name codatende-finance --enable-financial --gerencianet-client-id CLIENT_ID --gerencianet-client-secret CLIENT_SECRET --gerencianet-pix-key PIX_KEY"
    echo -e "\n  # 🔄 Atualizar instância (usa configuração salva)"
    echo -e "  $0 update -n codatende1"
    echo -e "  $0 update codatende1"
    echo -e "\n  # 🔄 Atualizar com novos parâmetros (atualiza configuração)"
    echo -e "  $0 update -n codatende1 -c 4 -m 4096"
    echo -e "\n  # 💰 Atualizar módulo financeiro"
    echo -e "  $0 update -n codatende1 -e -g NEW_CLIENT_ID -s NEW_CLIENT_SECRET -p NEW_PIX_KEY"
    echo -e "\n  # 🛠️  Gerenciar instâncias"
    echo -e "  $0 instances                    # 📋 Lista instâncias salvas"
    echo -e "  $0 down -n codatende1          # 🛑 Para e remove do arquivo"
    echo -e "  $0 logs -n codatende1"
    echo -e "  $0 status -n codatende1"
    echo -e "  $0 restart -n codatende1"
    echo -e "\n${YELLOW}🔄 Formato alternativo (compatibilidade):${NC}"
    echo -e "  $0 up codatende1 3000 3001"
    echo -e "  $0 down codatende1"
    echo -e "  $0 logs codatende1"
    echo -e "  $0 status codatende1"
    echo -e "  $0 restart codatende1"
    echo -e "\n${BLUE}📝 Nota:${NC} As configurações são salvas automaticamente em instances.json"
    echo -e "      O comando update preserva as configurações originais"
    echo -e "      Use parâmetros no update para alterar configurações"
    echo -e "\n${BLUE}🔍 Verificação de Portas:${NC}"
    echo -e "      Os comandos 'up' e 'update' verificam automaticamente se as portas estão disponíveis"
    echo -e "      Se uma porta estiver em uso, o script mostrará quais processos estão usando"
    echo -e "      Use 'lsof -i :PORTA' ou 'netstat -tuln | grep :PORTA' para verificar manualmente"
    echo -e "      Portas válidas: 1-65535 (evite portas privilegiadas < 1024)"
}

# Função para processar argumentos
parse_args() {
    local args=("$@")
    local i=0
    
    # Valores padrão
    STACK_NAME="codatende"
    BACKEND_PORT="3000"
    FRONTEND_PORT="3001"
    BACKEND_URL=""
    FRONTEND_URL=""
    TOTAL_CPU="2"
    TOTAL_MEMORY="2048"
    
    # Variáveis do módulo financeiro
    ENABLE_FINANCIAL="false"
    GERENCIANET_SANDBOX="false"
    GERENCIANET_PIX_CERT="production-cert"
    GERENCIANET_CLIENT_ID=""
    GERENCIANET_CLIENT_SECRET=""
    GERENCIANET_PIX_KEY=""
    
    # Verifica se o primeiro argumento não é uma flag (compatibilidade com formato antigo)
    if [[ ${#args[@]} -gt 0 && ! "${args[0]}" =~ ^- ]]; then
        STACK_NAME="${args[0]}"
        if [[ ${#args[@]} -gt 1 ]]; then
            BACKEND_PORT="${args[1]}"
        fi
        if [[ ${#args[@]} -gt 2 ]]; then
            FRONTEND_PORT="${args[2]}"
        fi
        if [[ ${#args[@]} -gt 3 ]]; then
            BACKEND_URL="${args[3]}"
        fi
        if [[ ${#args[@]} -gt 4 ]]; then
            FRONTEND_URL="${args[4]}"
        fi
        if [[ ${#args[@]} -gt 5 ]]; then
            TOTAL_CPU="${args[5]}"
        fi
        if [[ ${#args[@]} -gt 6 ]]; then
            TOTAL_MEMORY="${args[6]}"
        fi
        return
    fi
    
    # Processa parâmetros nomeados
    while [[ $i -lt ${#args[@]} ]]; do
        case "${args[$i]}" in
            -n|--name)
                STACK_NAME="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -b|--backend-port)
                BACKEND_PORT="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -f|--frontend-port)
                FRONTEND_PORT="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -u|--backend-url)
                BACKEND_URL="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -w|--frontend-url)
                FRONTEND_URL="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -c|--cpu)
                TOTAL_CPU="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -m|--memory)
                TOTAL_MEMORY="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -e|--enable-financial)
                ENABLE_FINANCIAL="true"
                i=$((i+1))
                ;;
            -g|--gerencianet-client-id)
                GERENCIANET_CLIENT_ID="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -s|--gerencianet-client-secret)
                GERENCIANET_CLIENT_SECRET="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -p|--gerencianet-pix-key)
                GERENCIANET_PIX_KEY="${args[$((i+1))]}"
                i=$((i+2))
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                i=$((i+1))
                ;;
        esac
    done
    
    # Define URLs padrão se não fornecidas
    if [[ -z "$BACKEND_URL" ]]; then
        BACKEND_URL="http://localhost:$BACKEND_PORT"
    fi
    if [[ -z "$FRONTEND_URL" ]]; then
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
    fi
}

# Função para definir variáveis de ambiente padrão
set_default_env_vars() {
    export STACK_NAME=${STACK_NAME:-codatende}
    export BACKEND_PORT=${BACKEND_PORT:-3000}
    export FRONTEND_PORT=${FRONTEND_PORT:-3001}
    export BACKEND_URL=${BACKEND_URL:-http://localhost:$BACKEND_PORT}
    export FRONTEND_URL=${FRONTEND_URL:-http://localhost:$FRONTEND_PORT}
    
    # Variáveis do módulo financeiro
    export ENABLE_FINANCIAL=${ENABLE_FINANCIAL:-false}
    export GERENCIANET_SANDBOX=${GERENCIANET_SANDBOX:-false}
    export GERENCIANET_PIX_CERT=${GERENCIANET_PIX_CERT:-production-cert}
    export GERENCIANET_CLIENT_ID=${GERENCIANET_CLIENT_ID:-}
    export GERENCIANET_CLIENT_SECRET=${GERENCIANET_CLIENT_SECRET:-}
    export GERENCIANET_PIX_KEY=${GERENCIANET_PIX_KEY:-}
    
    # Define recursos padrão se não calculados
    export BACKEND_CPU_LIMIT=${BACKEND_CPU_LIMIT:-0.4}
    export POSTGRES_CPU_LIMIT=${POSTGRES_CPU_LIMIT:-0.3}
    export FRONTEND_CPU_LIMIT=${FRONTEND_CPU_LIMIT:-0.2}
    export REDIS_CPU_LIMIT=${REDIS_CPU_LIMIT:-0.1}
    export BACKEND_CPU_RESERVE=${BACKEND_CPU_RESERVE:-0.2}
    export POSTGRES_CPU_RESERVE=${POSTGRES_CPU_RESERVE:-0.15}
    export FRONTEND_CPU_RESERVE=${FRONTEND_CPU_RESERVE:-0.1}
    export REDIS_CPU_RESERVE=$(echo "scale=2; $REDIS_CPU_LIMIT * 0.5" | bc)
    export BACKEND_MEM_LIMIT=${BACKEND_MEM_LIMIT:-409.6}
    export FRONTEND_MEM_LIMIT=${FRONTEND_MEM_LIMIT:-204.8}
    export POSTGRES_MEM_LIMIT=${POSTGRES_MEM_LIMIT:-307.2}
    export REDIS_MEM_LIMIT=${REDIS_MEM_LIMIT:-102.4}
    export BACKEND_MEM_RESERVE=${BACKEND_MEM_RESERVE:-204.8}
    export FRONTEND_MEM_RESERVE=${FRONTEND_MEM_RESERVE:-102.4}
    export POSTGRES_MEM_RESERVE=${POSTGRES_MEM_RESERVE:-153.6}
    export REDIS_MEM_RESERVE=${REDIS_MEM_RESERVE:-51.2}
}

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
    # Calcula recursos compartilhados
    calculate_resources $TOTAL_CPU $TOTAL_MEMORY

    # Define as variáveis de ambiente
    export STACK_NAME=$STACK_NAME
    export BACKEND_PORT=$BACKEND_PORT
    export FRONTEND_PORT=$FRONTEND_PORT
    export BACKEND_URL=$BACKEND_URL
    export FRONTEND_URL=$FRONTEND_URL
    
    # Variáveis do módulo financeiro
    export ENABLE_FINANCIAL=$ENABLE_FINANCIAL
    export GERENCIANET_SANDBOX="false"
    export GERENCIANET_PIX_CERT="production-cert"
    export GERENCIANET_CLIENT_ID=$GERENCIANET_CLIENT_ID
    export GERENCIANET_CLIENT_SECRET=$GERENCIANET_CLIENT_SECRET
    export GERENCIANET_PIX_KEY=$GERENCIANET_PIX_KEY

    # Verifica se as portas estão disponíveis antes de prosseguir
    if ! validate_ports "$BACKEND_PORT" "$FRONTEND_PORT"; then
        echo -e "${RED}❌ Erro: Verificação de portas falhou. Abortando criação da stack.${NC}"
        exit 1
    fi

    echo -e "${BLUE}🚀 Iniciando stack $STACK_NAME...${NC}"
    echo -e "\n${YELLOW}⚙️  Configuração:${NC}"
    echo -e "Nome da stack:     ${GREEN}$STACK_NAME${NC}"
    echo -e "Backend:           ${GREEN}$BACKEND_URL${NC} (porta: $BACKEND_PORT)"
    echo -e "Frontend:          ${GREEN}$FRONTEND_URL${NC} (porta: $FRONTEND_PORT)"
    echo -e "Módulo financeiro: ${GREEN}$ENABLE_FINANCIAL${NC}"
    if [[ "$ENABLE_FINANCIAL" == "true" ]]; then
        echo -e "  Client ID:       ${GREEN}$GERENCIANET_CLIENT_ID${NC}"
        echo -e "  PIX Key:         ${GREEN}$GERENCIANET_PIX_KEY${NC}"
        echo -e "  Client Secret:   ${GREEN}[OCULTO]${NC}"
    fi
    echo -e "\n${YELLOW}💻 Recursos totais:${NC}"
    echo -e "CPU: ${GREEN}$TOTAL_CPU${NC} cores (compartilhados entre todos os serviços)"
    echo -e "Memória: ${GREEN}$TOTAL_MEMORY${NC}MB"
    echo -e "\n${YELLOW}📊 Distribuição de recursos:${NC}"
    echo -e "Backend:    CPU ${GREEN}$BACKEND_CPU_LIMIT${NC} cores (reserva: $BACKEND_CPU_RESERVE), Memória ${GREEN}$BACKEND_MEM_LIMIT${NC}MB (reserva: $BACKEND_MEM_RESERVE)"
    echo -e "Frontend:   CPU ${GREEN}$FRONTEND_CPU_LIMIT${NC} cores (reserva: $FRONTEND_CPU_RESERVE), Memória ${GREEN}$FRONTEND_MEM_LIMIT${NC}MB (reserva: $FRONTEND_MEM_RESERVE)"
    echo -e "PostgreSQL: CPU ${GREEN}$POSTGRES_CPU_LIMIT${NC} cores (reserva: $POSTGRES_CPU_RESERVE), Memória ${GREEN}$POSTGRES_MEM_LIMIT${NC}MB (reserva: $POSTGRES_MEM_RESERVE)"
    echo -e "Redis:      CPU ${GREEN}$REDIS_CPU_LIMIT${NC} cores (reserva: $REDIS_CPU_RESERVE), Memória ${GREEN}$REDIS_MEM_LIMIT${NC}MB (reserva: $REDIS_MEM_RESERVE)"
    
    # Sube a stack
    echo -e "\n${YELLOW}📦 Criando containers...${NC}"
    docker-compose -p $STACK_NAME up -d --build

    if [ $? -eq 0 ]; then
        # Verifica se todos os serviços estão rodando
        echo -e "\n${YELLOW}🔍 Verificando status dos serviços...${NC}"
        sleep 5  # Aguarda um pouco para os serviços inicializarem
        
        local all_running=true
        local failed_services=""
        
        # Verifica cada serviço
        for service in backend frontend postgres redis; do
            local status=$(docker-compose -p $STACK_NAME ps $service 2>/dev/null | grep -E "(Up|Exit)")
            if [[ -z "$status" ]] || [[ "$status" == *"Exit"* ]]; then
                all_running=false
                failed_services="$failed_services $service"
                echo -e "${RED}❌ Serviço $service falhou${NC}"
                
                # Mostra logs do serviço que falhou
                echo -e "${YELLOW}📋 Últimos logs do serviço $service:${NC}"
                docker-compose -p $STACK_NAME logs --tail=10 $service 2>/dev/null | head -20
                echo ""
            else
                echo -e "${GREEN}✅ Serviço $service está rodando${NC}"
            fi
        done
        
        if [[ "$all_running" == "true" ]]; then
            # Verificação adicional: testa se os serviços estão respondendo
            echo -e "\n${YELLOW}🌐 Testando conectividade dos serviços...${NC}"
            
            local connectivity_ok=true
            
            # Testa backend (se estiver na porta padrão)
            if [[ "$BACKEND_PORT" == "3000" ]] || [[ "$BACKEND_PORT" == "4000" ]] || [[ "$BACKEND_PORT" == "5000" ]]; then
                if ! curl -s --max-time 5 "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
                    echo -e "${YELLOW}⚠️  Backend pode não estar respondendo corretamente (porta $BACKEND_PORT)${NC}"
                    # Não falha aqui, apenas avisa
                else
                    echo -e "${GREEN}✅ Backend respondendo na porta $BACKEND_PORT${NC}"
                fi
            fi
            
            # Testa frontend (se estiver na porta padrão)
            if [[ "$FRONTEND_PORT" == "3001" ]] || [[ "$FRONTEND_PORT" == "4001" ]] || [[ "$FRONTEND_PORT" == "5001" ]]; then
                if ! curl -s --max-time 5 "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
                    echo -e "${YELLOW}⚠️  Frontend pode não estar respondendo corretamente (porta $FRONTEND_PORT)${NC}"
                    # Não falha aqui, apenas avisa
                else
                    echo -e "${GREEN}✅ Frontend respondendo na porta $FRONTEND_PORT${NC}"
                fi
            fi
            
            echo -e "\n${GREEN}🎉 Stack $STACK_NAME iniciada com sucesso!${NC}"
            
            # Salva a instância no arquivo JSON
            save_instance "$STACK_NAME" "$BACKEND_PORT" "$FRONTEND_PORT" "$BACKEND_URL" "$FRONTEND_URL" "$TOTAL_CPU" "$TOTAL_MEMORY" "$ENABLE_FINANCIAL" "$GERENCIANET_CLIENT_ID" "$GERENCIANET_CLIENT_SECRET" "$GERENCIANET_PIX_KEY"
            
            echo -e "\n${YELLOW}🔗 URLs de acesso:${NC}"
            echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
            echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
            echo -e "\n${YELLOW}🛠️  Comandos úteis:${NC}"
            echo -e "Logs:     ${GREEN}./manage-stacks.sh logs -n $STACK_NAME${NC}"
            echo -e "Status:   ${GREEN}./manage-stacks.sh status -n $STACK_NAME${NC}"
            echo -e "Update:   ${GREEN}./manage-stacks.sh update -n $STACK_NAME${NC}"
            echo -e "Parar:    ${GREEN}./manage-stacks.sh down -n $STACK_NAME${NC}"
            echo -e "Reiniciar: ${GREEN}./manage-stacks.sh restart -n $STACK_NAME${NC}"
        else
            echo -e "\n${RED}❌ Erro: Alguns serviços falharam:$failed_services${NC}"
            echo -e "${YELLOW}🔄 Executando rollback...${NC}"
            
            # Executa rollback - derruba todos os containers
            rollback_stack "$STACK_NAME"
            
            exit 1
        fi
    else
        echo -e "\n${RED}❌ Erro ao criar containers da stack $STACK_NAME${NC}"
        echo -e "${YELLOW}🔄 Executando rollback...${NC}"
        
        # Executa rollback - derruba todos os containers
        rollback_stack "$STACK_NAME"
        
        exit 1
    fi
}

# Função para parar uma stack
down_stack() {
    set_default_env_vars
    
    # Valida se a instância existe no banco
    validate_instance "$STACK_NAME" "down"
    
    echo -e "${BLUE}🛑 Parando stack $STACK_NAME...${NC}"
    docker-compose -p $STACK_NAME down
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack $STACK_NAME parada com sucesso!${NC}"
        
        # Remove a instância do arquivo JSON
        remove_instance "$STACK_NAME"
    else
        echo -e "${RED}❌ Erro ao parar stack $STACK_NAME${NC}"
    fi
}

# Função para listar todas as stacks
list_stacks() {
    echo -e "${YELLOW}📊 Listando todas as stacks:${NC}\n"
    
    # Usa docker ps para listar todos os containers, filtrando por projeto
    echo -e "${BLUE}🐳 Containers ativos:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(codatende|backend|frontend|postgres|redis)"
    
    echo -e "\n${BLUE}⏸️  Containers parados:${NC}"
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(codatende|backend|frontend|postgres|redis)" | grep -v "Up"
    
    echo -e "\n${BLUE}🏷️  Stacks identificadas:${NC}"
    docker ps -a --format "{{.Names}}" | grep -E "(codatende|backend|frontend|postgres|redis)" | cut -d'-' -f1 | sort | uniq
}

# Função para mostrar logs de uma stack
logs_stack() {
    set_default_env_vars
    
    # Valida se a instância existe no banco
    validate_instance "$STACK_NAME" "logs"
    
    echo -e "${YELLOW}📝 Mostrando logs da stack $STACK_NAME:${NC}\n"
    docker-compose -p $STACK_NAME logs -f
}

# Função para mostrar status de uma stack
status_stack() {
    set_default_env_vars
    
    # Valida se a instância existe no banco
    validate_instance "$STACK_NAME" "status"
    
    echo -e "${YELLOW}📈 Status da stack $STACK_NAME:${NC}\n"
    docker-compose -p $STACK_NAME ps
}

# Função para reiniciar uma stack
restart_stack() {
    set_default_env_vars
    
    # Valida se a instância existe no banco
    validate_instance "$STACK_NAME" "restart"
    
    echo -e "${BLUE}🔄 Reiniciando stack $STACK_NAME...${NC}"
    docker-compose -p $STACK_NAME restart
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stack $STACK_NAME reiniciada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao reiniciar stack $STACK_NAME${NC}"
    fi
}

# Função para atualizar uma stack (imagens Docker)
update_stack() {
    set_default_env_vars
    
    # Valida se a instância existe no banco
    validate_instance "$STACK_NAME" "update"
    
    # Detecta quais parâmetros foram realmente fornecidos pelo usuário
    local args=("$@")
    local provided_params=()
    
    # Analisa os argumentos para detectar parâmetros fornecidos
    local i=0
    while [[ $i -lt ${#args[@]} ]]; do
        case "${args[$i]}" in
            -c|--cpu)
                provided_params+=("cpu")
                i=$((i+2))
                ;;
            -m|--memory)
                provided_params+=("memory")
                i=$((i+2))
                ;;
            -b|--backend-port)
                provided_params+=("backend_port")
                i=$((i+2))
                ;;
            -f|--frontend-port)
                provided_params+=("frontend_port")
                i=$((i+2))
                ;;
            -u|--backend-url)
                provided_params+=("backend_url")
                i=$((i+2))
                ;;
            -w|--frontend-url)
                provided_params+=("frontend_url")
                i=$((i+2))
                ;;
            -p|--gerencianet-pix-key)
                provided_params+=("gerencianet_pix_key")
                i=$((i+2))
                ;;
            -e|--enable-financial)
                provided_params+=("enable_financial")
                i=$((i+1))
                ;;
            -g|--gerencianet-client-id)
                provided_params+=("gerencianet_client_id")
                i=$((i+2))
                ;;
            -s|--gerencianet-client-secret)
                provided_params+=("gerencianet_client_secret")
                i=$((i+2))
                ;;
            *)
                i=$((i+1))
                ;;
        esac
    done
    
    # Salva os parâmetros fornecidos antes de carregar a configuração
    local provided_cpu="$TOTAL_CPU"
    local provided_memory="$TOTAL_MEMORY"
    local provided_backend_port="$BACKEND_PORT"
    local provided_frontend_port="$FRONTEND_PORT"
    local provided_backend_url="$BACKEND_URL"
    local provided_frontend_url="$FRONTEND_URL"
    local provided_enable_financial="$ENABLE_FINANCIAL"
    local provided_gerencianet_client_id="$GERENCIANET_CLIENT_ID"
    local provided_gerencianet_client_secret="$GERENCIANET_CLIENT_SECRET"
    local provided_gerencianet_pix_key="$GERENCIANET_PIX_KEY"
    
    # Carrega a instância do arquivo JSON primeiro
    if load_instance "$STACK_NAME"; then
        echo -e "${YELLOW}📋 Carregando configuração salva para $STACK_NAME...${NC}"
        echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
        echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
        echo -e "CPU:      ${GREEN}$TOTAL_CPU${NC} cores"
        echo -e "Memória:  ${GREEN}$TOTAL_MEMORY${NC}MB"
        
        # Recalcula os recursos com os valores carregados
        calculate_resources $TOTAL_CPU $TOTAL_MEMORY
    else
        echo -e "${RED}❌ Erro: Não foi possível carregar a configuração da instância $STACK_NAME${NC}"
        exit 1
    fi
    
    # Agora aplica as alterações dos parâmetros fornecidos
    local config_changed=false
    
    # Verifica se foram fornecidos novos valores e aplica as mudanças
    if [[ " ${provided_params[@]} " =~ " cpu " && -n "$provided_cpu" && "$provided_cpu" != "$TOTAL_CPU" ]]; then
        echo -e "${YELLOW}🔄 Alterando CPU de $TOTAL_CPU para $provided_cpu cores${NC}"
        TOTAL_CPU="$provided_cpu"
        config_changed=true
    fi
    
    if [[ " ${provided_params[@]} " =~ " memory " && -n "$provided_memory" && "$provided_memory" != "$TOTAL_MEMORY" ]]; then
        echo -e "${YELLOW}🔄 Alterando memória de $TOTAL_MEMORY para $provided_memory MB${NC}"
        TOTAL_MEMORY="$provided_memory"
        config_changed=true
    fi
    
    # Só altera portas se foram explicitamente fornecidas
    if [[ " ${provided_params[@]} " =~ " backend_port " && -n "$provided_backend_port" && "$provided_backend_port" != "$BACKEND_PORT" ]]; then
        echo -e "${YELLOW}🔄 Alterando porta do backend de $BACKEND_PORT para $provided_backend_port${NC}"
        BACKEND_PORT="$provided_backend_port"
        BACKEND_URL="http://localhost:$BACKEND_PORT"
        config_changed=true
    fi
    
    if [[ " ${provided_params[@]} " =~ " frontend_port " && -n "$provided_frontend_port" && "$provided_frontend_port" != "$FRONTEND_PORT" ]]; then
        echo -e "${YELLOW}🔄 Alterando porta do frontend de $FRONTEND_PORT para $provided_frontend_port${NC}"
        FRONTEND_PORT="$provided_frontend_port"
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
        config_changed=true
    fi
    
    # Só altera URLs se foram explicitamente fornecidas
    if [[ " ${provided_params[@]} " =~ " backend_url " && -n "$provided_backend_url" && "$provided_backend_url" != "$BACKEND_URL" ]]; then
        echo -e "${YELLOW}🔄 Alterando URL do backend para $provided_backend_url${NC}"
        BACKEND_URL="$provided_backend_url"
        config_changed=true
    fi
    
    if [[ " ${provided_params[@]} " =~ " frontend_url " && -n "$provided_frontend_url" && "$provided_frontend_url" != "$FRONTEND_URL" ]]; then
        echo -e "${YELLOW}🔄 Alterando URL do frontend para $provided_frontend_url${NC}"
        FRONTEND_URL="$provided_frontend_url"
        config_changed=true
    fi
    
    # Alterações do módulo financeiro
    if [[ " ${provided_params[@]} " =~ " enable_financial " ]]; then
        if [[ "$provided_enable_financial" != "$ENABLE_FINANCIAL" ]]; then
            echo -e "${YELLOW}💰 Alterando módulo financeiro para: $provided_enable_financial${NC}"
            ENABLE_FINANCIAL="$provided_enable_financial"
            config_changed=true
        fi
    fi
    
    if [[ " ${provided_params[@]} " =~ " gerencianet_client_id " && -n "$provided_gerencianet_client_id" && "$provided_gerencianet_client_id" != "$GERENCIANET_CLIENT_ID" ]]; then
        echo -e "${YELLOW}💰 Alterando Gerencianet Client ID${NC}"
        GERENCIANET_CLIENT_ID="$provided_gerencianet_client_id"
        config_changed=true
    fi
    
    if [[ " ${provided_params[@]} " =~ " gerencianet_client_secret " && -n "$provided_gerencianet_client_secret" && "$provided_gerencianet_client_secret" != "$GERENCIANET_CLIENT_SECRET" ]]; then
        echo -e "${YELLOW}💰 Alterando Gerencianet Client Secret${NC}"
        GERENCIANET_CLIENT_SECRET="$provided_gerencianet_client_secret"
        config_changed=true
    fi
    
    if [[ " ${provided_params[@]} " =~ " gerencianet_pix_key " && -n "$provided_gerencianet_pix_key" && "$provided_gerencianet_pix_key" != "$GERENCIANET_PIX_KEY" ]]; then
        echo -e "${YELLOW}💰 Alterando Gerencianet PIX Key${NC}"
        GERENCIANET_PIX_KEY="$provided_gerencianet_pix_key"
        config_changed=true
    fi
    
    if [[ "$config_changed" == "true" ]]; then
        echo -e "${YELLOW}🔄 Recalculando recursos com novas configurações...${NC}"
        calculate_resources $TOTAL_CPU $TOTAL_MEMORY
    fi
    
    # Verifica se as portas estão disponíveis antes de prosseguir (apenas se houve mudança de portas)
    if [[ " ${provided_params[@]} " =~ " backend_port " || " ${provided_params[@]} " =~ " frontend_port " ]]; then
        echo -e "${YELLOW}🔍 Verificando disponibilidade das novas portas...${NC}"
        if ! validate_ports "$BACKEND_PORT" "$FRONTEND_PORT"; then
            echo -e "${RED}❌ Erro: Verificação de portas falhou. Abortando atualização da stack.${NC}"
            exit 1
        fi
    fi
    
    echo -e "${BLUE}🔄 Atualizando stack $STACK_NAME...${NC}"
    echo -e "${YELLOW}⬇️  Baixando imagens mais recentes...${NC}"
    
    # Faz pull das imagens mais recentes
    docker-compose -p $STACK_NAME pull
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Imagens baixadas com sucesso!${NC}"
        echo -e "${YELLOW}🔨 Rebuildando imagens locais...${NC}"
        
        # Rebuilda as imagens locais
        docker-compose -p $STACK_NAME build --no-cache
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Imagens rebuildadas com sucesso!${NC}"
            echo -e "${YELLOW}🚀 Reiniciando serviços com as novas imagens...${NC}"
            
            # Reinicia os serviços para usar as novas imagens
            # Usa --no-deps para não reiniciar dependências desnecessariamente
            docker-compose -p $STACK_NAME up -d --no-deps
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}🎉 Stack $STACK_NAME atualizada com sucesso!${NC}"
                
                # Atualiza a instância no arquivo JSON com as novas configurações
                save_instance "$STACK_NAME" "$BACKEND_PORT" "$FRONTEND_PORT" "$BACKEND_URL" "$FRONTEND_URL" "$TOTAL_CPU" "$TOTAL_MEMORY" "$ENABLE_FINANCIAL" "$GERENCIANET_CLIENT_ID" "$GERENCIANET_CLIENT_SECRET" "$GERENCIANET_PIX_KEY"
                
                echo -e "${YELLOW}⚙️  Configuração final:${NC}"
                echo -e "Backend:  ${GREEN}$BACKEND_URL${NC}"
                echo -e "Frontend: ${GREEN}$FRONTEND_URL${NC}"
                echo -e "Recursos: ${GREEN}$TOTAL_CPU${NC} cores, ${GREEN}$TOTAL_MEMORY${NC}MB"
                echo -e "${YELLOW}💾 Nota:${NC} Os bancos de dados não foram afetados pela atualização."
                echo -e "${YELLOW}🛠️  Comandos úteis:${NC}"
                echo -e "Status:   ${GREEN}./manage-stacks.sh status -n $STACK_NAME${NC}"
                echo -e "Logs:     ${GREEN}./manage-stacks.sh logs -n $STACK_NAME${NC}"
            else
                echo -e "${RED}❌ Erro ao reiniciar serviços da stack $STACK_NAME${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Erro ao rebuildar imagens${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Erro ao baixar imagens atualizadas${NC}"
        exit 1
    fi
}

# Verifica se foi fornecido um comando
if [[ $# -eq 0 ]]; then
    show_help
    exit 1
fi

# Menu principal
case "$1" in
    "up")
        shift  # Remove o comando "up" dos argumentos
        parse_args "$@"
        up_stack
        ;;
    "down")
        shift  # Remove o comando "down" dos argumentos
        parse_args "$@"
        down_stack
        ;;
    "update")
        shift  # Remove o comando "update" dos argumentos
        parse_args "$@"
        update_stack "$@"
        ;;
    "list")
        list_stacks
        ;;
    "instances")
        list_instances
        ;;
    "logs")
        shift  # Remove o comando "logs" dos argumentos
        parse_args "$@"
        logs_stack
        ;;
    "status")
        shift  # Remove o comando "status" dos argumentos
        parse_args "$@"
        status_stack
        ;;
    "restart")
        shift  # Remove o comando "restart" dos argumentos
        parse_args "$@"
        restart_stack
        ;;
    -h|--help)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando inválido: $1${NC}"
        echo -e "Use ${GREEN}$0 --help${NC} para ver as opções disponíveis"
        exit 1
        ;;
esac 