#!/bin/bash

# Genfity Server Management Script for Linux/macOS
# Simple modular deployment management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${GREEN}=== Genfity Deployment Manager ===${NC}"
    echo
    echo "Usage: $0 [COMMAND] [SERVICE]"
    echo
    echo "Commands:"
    echo -e "  ${BLUE}dev [service]     ${NC}Start development environment"
    echo -e "  ${BLUE}prod [service]    ${NC}Start production environment (with SSL/proxy)"
    echo -e "  ${BLUE}stop [service]    ${NC}Stop services"
    echo -e "  ${BLUE}restart [service] ${NC}Restart services"
    echo -e "  ${BLUE}logs [service]    ${NC}Show logs"
    echo -e "  ${BLUE}status            ${NC}Show status of all services"
    echo -e "  ${BLUE}clean             ${NC}Remove all containers, networks, and volumes"
    echo -e "  ${BLUE}config            ${NC}Generate nginx configuration from .env"
    echo
    echo "Services:"
    echo -e "  ${BLUE}all               ${NC}All services (default)"
    echo -e "  ${BLUE}infrastructure    ${NC}PostgreSQL + Nginx + SSL only"
    echo -e "  ${BLUE}wa                ${NC}WA service (+ infrastructure if needed)"
    echo -e "  ${BLUE}chat-ai           ${NC}Chat AI service (+ infrastructure if needed)"
    echo -e "  ${BLUE}backend           ${NC}Backend API service (+ infrastructure if needed)"
    echo -e "  ${BLUE}frontend          ${NC}Frontend service (+ infrastructure if needed)"
    echo
    echo "Examples:"
    echo "  $0 dev                    # Start all services in development"
    echo "  $0 dev wa                # Start only WA + database"
    echo "  $0 dev backend           # Start only Backend + database"
    echo "  $0 prod                  # Start production with SSL/proxy"
    echo "  $0 config                # Generate nginx config from .env"
    echo "  $0 logs backend          # Show Backend logs"
}

test_env_file() {
    local path=$1
    local service_name=$2
    
    if [ ! -f "$path" ]; then
        echo -e "${YELLOW}Creating .env from template for $service_name...${NC}"
        local example_path="$path.example"
        if [ -f "$example_path" ]; then
            cp "$example_path" "$path"
            echo -e "${RED}Please edit $path and configure the settings before continuing!${NC}"
            return 1
        else
            echo -e "${RED}Error: $example_path not found!${NC}"
            return 1
        fi
    fi
    return 0
}

create_network() {
    if ! docker network ls --format "{{.Name}}" | grep -q "^genfity-network$"; then
        echo -e "${YELLOW}Creating genfity-network...${NC}"
        docker network create genfity-network
    fi
}

generate_nginx_config() {
    echo -e "${GREEN}Generating nginx configuration...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}Error: .env file not found in root directory!${NC}"
        return 1
    fi
    
    # Make sure the script is executable and run it
    docker run --rm --env-file .env -v "$(pwd)/nginx/sites-available:/etc/nginx/sites-available" -v "$(pwd)/scripts:/scripts" alpine:latest /scripts/generate-nginx-config.sh
    
    echo -e "${GREEN}Nginx configuration generated successfully!${NC}"
    return 0
}

start_infrastructure() {
    local profile=$1
    
    echo -e "${YELLOW}Starting infrastructure...${NC}"
    
    if ! test_env_file ".env" "root infrastructure"; then
        return 1
    fi
    
    create_network
    
    if [ "$profile" = "prod" ]; then
        if ! generate_nginx_config; then
            return 1
        fi
        docker compose --profile prod up -d postgres nginx certbot
    else
        docker compose --profile dev up -d postgres
    fi
    return 0
}

start_service() {
    local service_name=$1
    local profile=$2
    
    echo -e "${YELLOW}Starting $service_name service...${NC}"
    
    case $service_name in
        "wa")
            pushd "genfity-wa" > /dev/null
            if ! test_env_file ".env" "WA"; then
                popd > /dev/null
                return 1
            fi
            docker compose up -d
            popd > /dev/null
            ;;
        "chat-ai")
            pushd "genfity-chat-ai" > /dev/null
            if ! test_env_file ".env" "Chat AI"; then
                popd > /dev/null
                return 1
            fi
            docker compose up -d
            popd > /dev/null
            ;;
        "backend")
            pushd "genfity-backend" > /dev/null
            if ! test_env_file ".env" "Backend API"; then
                popd > /dev/null
                return 1
            fi
            if [ "$profile" = "prod" ]; then
                docker compose --profile prod up -d
            else
                docker compose --profile dev up -d
            fi
            popd > /dev/null
            ;;
        "frontend")
            pushd "genfity-frontend" > /dev/null
            if ! test_env_file ".env" "Frontend"; then
                popd > /dev/null
                return 1
            fi
            if [ "$profile" = "prod" ]; then
                docker compose --profile prod up -d
            else
                docker compose --profile dev up -d
            fi
            popd > /dev/null
            ;;
        *)
            echo -e "${RED}Unknown service: $service_name${NC}"
            return 1
            ;;
    esac
    return 0
}

start_environment() {
    local mode=$1
    local service_name=$2
    
    echo -e "${GREEN}Starting $mode environment...${NC}"
    
    case $service_name in
        "infrastructure")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            ;;
        "wa")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            if ! start_service "wa" "$mode"; then
                return 1
            fi
            ;;
        "chat-ai")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            if ! start_service "chat-ai" "$mode"; then
                return 1
            fi
            ;;
        "backend")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            if ! start_service "backend" "$mode"; then
                return 1
            fi
            ;;
        "frontend")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            if ! start_service "frontend" "$mode"; then
                return 1
            fi
            ;;
        "all")
            if ! start_infrastructure "$mode"; then
                return 1
            fi
            if ! start_service "wa" "$mode"; then
                return 1
            fi
            if ! start_service "chat-ai" "$mode"; then
                return 1
            fi
            if ! start_service "backend" "$mode"; then
                return 1
            fi
            if ! start_service "frontend" "$mode"; then
                return 1
            fi
            ;;
        *)
            echo -e "${RED}Unknown service: $service_name${NC}"
            return 1
            ;;
    esac
    
    echo -e "${GREEN}$mode environment started successfully!${NC}"
    show_access_info "$mode" "$service_name"
}

show_access_info() {
    local mode=$1
    local service_name=$2
    
    echo -e "${YELLOW}Services available at:${NC}"
    
    if [ "$mode" = "dev" ]; then
        if [ "$service_name" = "all" ] || [ "$service_name" = "wa" ]; then
            echo "  - WA: http://localhost:8080"
        fi
        if [ "$service_name" = "all" ] || [ "$service_name" = "chat-ai" ]; then
            echo "  - Chat AI: http://localhost:8081"
        fi
        if [ "$service_name" = "all" ] || [ "$service_name" = "backend" ]; then
            echo "  - Backend API: http://localhost:8090"
        fi
        if [ "$service_name" = "all" ] || [ "$service_name" = "frontend" ]; then
            echo "  - Frontend: http://localhost:8050"
        fi
        echo "  - PostgreSQL: localhost:5432"
    else
        if [ -f ".env" ]; then
            # Source .env file to get domain variables
            set -a
            source .env
            set +a
            
            if [ "$service_name" = "all" ] || [ "$service_name" = "wa" ]; then
                if [ -n "$WA_DOMAIN" ]; then
                    echo "  - WA: https://$WA_DOMAIN"
                fi
            fi
            if [ "$service_name" = "all" ] || [ "$service_name" = "chat-ai" ]; then
                if [ -n "$CHAT_AI_DOMAIN" ]; then
                    echo "  - Chat AI: https://$CHAT_AI_DOMAIN"
                fi
            fi
            if [ "$service_name" = "all" ] || [ "$service_name" = "backend" ]; then
                if [ -n "$BACKEND_DOMAIN" ]; then
                    echo "  - Backend API: https://$BACKEND_DOMAIN"
                fi
            fi
            if [ "$service_name" = "all" ] || [ "$service_name" = "frontend" ]; then
                if [ -n "$FRONTEND_DOMAIN" ]; then
                    echo "  - Frontend: https://$FRONTEND_DOMAIN"
                fi
            fi
        fi
    fi
}

stop_services() {
    local service_name=$1
    
    echo -e "${YELLOW}Stopping services...${NC}"
    
    case $service_name in
        "infrastructure")
            docker compose down
            ;;
        "wa")
            pushd "genfity-wa" > /dev/null
            docker compose down
            popd > /dev/null
            ;;
        "chat-ai")
            pushd "genfity-chat-ai" > /dev/null
            docker compose down
            popd > /dev/null
            ;;
        "backend")
            pushd "genfity-backend" > /dev/null
            docker compose --profile dev down
            docker compose --profile prod down
            popd > /dev/null
            ;;
        "frontend")
            pushd "genfity-frontend" > /dev/null
            docker compose --profile dev down
            docker compose --profile prod down
            popd > /dev/null
            ;;
        "all")
            pushd "genfity-wa" > /dev/null
            docker compose down
            popd > /dev/null
            pushd "genfity-chat-ai" > /dev/null
            docker compose down
            popd > /dev/null
            pushd "genfity-backend" > /dev/null
            docker compose --profile dev down
            docker compose --profile prod down
            popd > /dev/null
            pushd "genfity-frontend" > /dev/null
            docker compose --profile dev down
            docker compose --profile prod down
            popd > /dev/null
            docker compose down
            ;;
    esac
    
    echo -e "${GREEN}Services stopped.${NC}"
}

show_logs() {
    local service_name=$1
    
    case $service_name in
        "infrastructure")
            docker compose logs -f
            ;;
        "wa")
            pushd "genfity-wa" > /dev/null
            docker compose logs -f
            popd > /dev/null
            ;;
        "chat-ai")
            pushd "genfity-chat-ai" > /dev/null
            docker compose logs -f
            popd > /dev/null
            ;;
        "backend")
            pushd "genfity-backend" > /dev/null
            # Try to get logs from both dev and prod containers
            docker compose logs -f 2>/dev/null || echo "No backend containers running"
            popd > /dev/null
            ;;
        "frontend")
            pushd "genfity-frontend" > /dev/null
            # Try to get logs from both dev and prod containers
            docker compose logs -f 2>/dev/null || echo "No frontend containers running"
            popd > /dev/null
            ;;
        "all")
            echo -e "${YELLOW}Showing logs for all services (Ctrl+C to exit)...${NC}"
            docker compose logs -f
            ;;
    esac
}

show_status() {
    echo -e "${GREEN}=== Service Status ===${NC}"
    echo
    echo -e "${BLUE}Infrastructure:${NC}"
    docker compose ps
    echo
    echo -e "${BLUE}WA:${NC}"
    pushd "genfity-wa" > /dev/null
    docker compose ps
    popd > /dev/null
    echo
    echo -e "${BLUE}Chat AI:${NC}"
    pushd "genfity-chat-ai" > /dev/null
    docker compose ps
    popd > /dev/null
    echo
    echo -e "${BLUE}Backend API:${NC}"
    pushd "genfity-backend" > /dev/null
    docker compose ps
    popd > /dev/null
    echo
    echo -e "${BLUE}Frontend:${NC}"
    pushd "genfity-frontend" > /dev/null
    docker compose ps
    popd > /dev/null
}

remove_all() {
    echo -e "${RED}Warning: This will remove all containers, networks, and volumes!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up all resources...${NC}"
        
        pushd "genfity-wa" > /dev/null
        docker compose down -v --remove-orphans
        popd > /dev/null
        pushd "genfity-chat-ai" > /dev/null
        docker compose down -v --remove-orphans
        popd > /dev/null
        pushd "genfity-backend" > /dev/null
        docker compose --profile dev down -v --remove-orphans
        docker compose --profile prod down -v --remove-orphans
        popd > /dev/null
        pushd "genfity-frontend" > /dev/null
        docker compose --profile dev down -v --remove-orphans
        docker compose --profile prod down -v --remove-orphans
        popd > /dev/null
        docker compose down -v --remove-orphans
        
        # Remove network (ignore error if it doesn't exist)
        docker network rm genfity-network 2>/dev/null || true
        
        echo -e "${GREEN}Cleanup completed.${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled.${NC}"
    fi
}

# Parse arguments
COMMAND=${1:-"help"}
SERVICE=${2:-"all"}

# Validate service option
if [ "$SERVICE" != "all" ] && [ "$SERVICE" != "infrastructure" ] && [ "$SERVICE" != "wa" ] && [ "$SERVICE" != "chat-ai" ] && [ "$SERVICE" != "backend" ] && [ "$SERVICE" != "frontend" ]; then
    echo -e "${RED}Error: Invalid service '$SERVICE'. Must be 'all', 'infrastructure', 'wa', 'chat-ai', 'backend', or 'frontend'.${NC}"
    exit 1
fi

# Execute command
case $COMMAND in
    "dev")
        start_environment "dev" "$SERVICE"
        ;;
    "prod")
        start_environment "prod" "$SERVICE"
        ;;
    "stop")
        stop_services "$SERVICE"
        ;;
    "restart")
        stop_services "$SERVICE"
        sleep 2
        start_environment "dev" "$SERVICE"
        ;;
    "logs")
        show_logs "$SERVICE"
        ;;
    "status")
        show_status
        ;;
    "clean")
        remove_all
        ;;
    "config")
        generate_nginx_config
        ;;
    "help")
        show_usage
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'.${NC}"
        show_usage
        exit 1
        ;;
esac
