#!/bin/bash

# Genfity Deployment Script
# Manages different deployment profiles for the Genfity platform

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
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo -e "  ${BLUE}dev${NC}          Start development environment (DB + Apps only)"
    echo -e "  ${BLUE}prod${NC}         Start production environment (DB + Apps + Nginx + SSL)"
    echo -e "  ${BLUE}stop${NC}         Stop all services"
    echo -e "  ${BLUE}restart${NC}      Restart all services"
    echo -e "  ${BLUE}logs${NC}         Show logs for all services"
    echo -e "  ${BLUE}status${NC}       Show status of all services"
    echo -e "  ${BLUE}clean${NC}        Stop and remove all containers, networks, and volumes"
    echo -e "  ${BLUE}setup-ssl${NC}    Setup SSL certificates (production only)"
    echo
    echo "Options:"
    echo -e "  ${BLUE}--service${NC}    Specify service (wuzapi|eventapi|all) - default: all"
    echo -e "  ${BLUE}--help${NC}       Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev                    # Start development environment"
    echo "  $0 prod                   # Start production environment"
    echo "  $0 dev --service wuzapi   # Start only wuzapi in dev mode"
    echo "  $0 stop                   # Stop all services"
    echo "  $0 logs --service eventapi # Show logs for event-api only"
}

create_network() {
    if ! docker network ls | grep -q "genfity-network"; then
        echo -e "${YELLOW}Creating genfity-network...${NC}"
        docker network create genfity-network
    fi
}

start_dev() {
    local service=$1
    echo -e "${GREEN}Starting development environment...${NC}"
    
    create_network
    
    # Start infrastructure
    echo -e "${YELLOW}Starting PostgreSQL database...${NC}"
    docker compose --profile dev up -d postgres
    
    case $service in
        "wuzapi")
            echo -e "${YELLOW}Starting WuzAPI service...${NC}"
            cd genfity-wuzapi && docker compose --profile dev up -d
            ;;
        "eventapi")
            echo -e "${YELLOW}Starting Event API service...${NC}"
            cd genfity-event-api && docker compose --profile dev up -d
            ;;
        "all"|*)
            echo -e "${YELLOW}Starting all application services...${NC}"
            cd genfity-wuzapi && docker compose --profile dev up -d && cd ..
            cd genfity-event-api && docker compose --profile dev up -d && cd ..
            ;;
    esac
    
    echo -e "${GREEN}Development environment started successfully!${NC}"
    echo -e "${YELLOW}Services available at:${NC}"
    [ "$service" = "all" ] || [ "$service" = "wuzapi" ] && echo -e "  - WuzAPI: http://localhost:8080"
    [ "$service" = "all" ] || [ "$service" = "eventapi" ] && echo -e "  - Event API: http://localhost:8081"
    echo -e "  - PostgreSQL: localhost:5432"
}

start_prod() {
    local service=$1
    echo -e "${GREEN}Starting production environment...${NC}"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}Error: .env file not found. Please copy .env.example to .env and configure it.${NC}"
        exit 1
    fi
    
    create_network
    
    # Start infrastructure
    echo -e "${YELLOW}Starting infrastructure (PostgreSQL + Nginx + SSL)...${NC}"
    docker compose --profile prod up -d
    
    case $service in
        "wuzapi")
            echo -e "${YELLOW}Starting WuzAPI service...${NC}"
            cd genfity-wuzapi && docker compose --profile prod up -d
            ;;
        "eventapi")
            echo -e "${YELLOW}Starting Event API service...${NC}"
            cd genfity-event-api && docker compose --profile prod up -d
            ;;
        "all"|*)
            echo -e "${YELLOW}Starting all application services...${NC}"
            cd genfity-wuzapi && docker compose --profile prod up -d && cd ..
            cd genfity-event-api && docker compose --profile prod up -d && cd ..
            ;;
    esac
    
    echo -e "${GREEN}Production environment started successfully!${NC}"
    echo -e "${YELLOW}Services available at:${NC}"
    source .env
    [ "$service" = "all" ] || [ "$service" = "wuzapi" ] && echo -e "  - WuzAPI: https://${WUZAPI_DOMAIN:-wuzapi.yourdomain.com}"
    [ "$service" = "all" ] || [ "$service" = "eventapi" ] && echo -e "  - Event API: https://${EVENTAPI_DOMAIN:-eventapi.yourdomain.com}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    # Stop applications
    cd genfity-wuzapi && docker compose down && cd ..
    cd genfity-event-api && docker compose down && cd ..
    
    # Stop infrastructure
    docker compose down
    
    echo -e "${GREEN}All services stopped.${NC}"
}

restart_services() {
    local service=$1
    local mode=$2
    echo -e "${YELLOW}Restarting services...${NC}"
    stop_services
    sleep 2
    if [ "$mode" = "prod" ]; then
        start_prod "$service"
    else
        start_dev "$service"
    fi
}

show_logs() {
    local service=$1
    case $service in
        "wuzapi")
            cd genfity-wuzapi && docker compose logs -f
            ;;
        "eventapi")
            cd genfity-event-api && docker compose logs -f
            ;;
        "all"|*)
            echo -e "${YELLOW}Showing logs for all services (Ctrl+C to exit)...${NC}"
            docker compose logs -f &
            cd genfity-wuzapi && docker compose logs -f &
            cd .. && cd genfity-event-api && docker compose logs -f &
            wait
            ;;
    esac
}

show_status() {
    echo -e "${GREEN}=== Service Status ===${NC}"
    echo
    echo -e "${BLUE}Infrastructure:${NC}"
    docker compose ps
    echo
    echo -e "${BLUE}WuzAPI:${NC}"
    cd genfity-wuzapi && docker compose ps && cd ..
    echo
    echo -e "${BLUE}Event API:${NC}"
    cd genfity-event-api && docker compose ps && cd ..
}

clean_all() {
    echo -e "${RED}Warning: This will remove all containers, networks, and volumes!${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up all resources...${NC}"
        
        # Stop and remove everything
        cd genfity-wuzapi && docker compose down -v --remove-orphans && cd ..
        cd genfity-event-api && docker compose down -v --remove-orphans && cd ..
        docker compose down -v --remove-orphans
        
        # Remove network
        docker network rm genfity-network 2>/dev/null || true
        
        echo -e "${GREEN}Cleanup completed.${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled.${NC}"
    fi
}

# Parse arguments
COMMAND=""
SERVICE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod|stop|restart|logs|status|clean|setup-ssl)
            COMMAND="$1"
            shift
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Validate service option
if [ "$SERVICE" != "all" ] && [ "$SERVICE" != "wuzapi" ] && [ "$SERVICE" != "eventapi" ]; then
    echo -e "${RED}Error: Invalid service '$SERVICE'. Must be 'all', 'wuzapi', or 'eventapi'.${NC}"
    exit 1
fi

# Execute command
case $COMMAND in
    "dev")
        start_dev "$SERVICE"
        ;;
    "prod")
        start_prod "$SERVICE"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services "$SERVICE" "dev"
        ;;
    "logs")
        show_logs "$SERVICE"
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "setup-ssl")
        bash scripts/setup-ssl.sh
        ;;
    "")
        echo -e "${RED}Error: No command specified.${NC}"
        show_usage
        exit 1
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'.${NC}"
        show_usage
        exit 1
        ;;
esac
