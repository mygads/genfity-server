# Genfity Server Management Script for Windows
# Simple modular deployment management

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod", "stop", "restart", "logs", "status", "clean", "config", "help")]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [ValidateSet("all", "infrastructure", "wa", "chat-ai", "backend", "frontend")]
    [string]$Service = "all"
)

function Write-Green { Write-Host $args -ForegroundColor Green }
function Write-Yellow { Write-Host $args -ForegroundColor Yellow }
function Write-Red { Write-Host $args -ForegroundColor Red }
function Write-Blue { Write-Host $args -ForegroundColor Blue }

function Show-Usage {
    Write-Green "=== Genfity Deployment Manager ==="
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [SERVICE]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Blue "  dev [service]     "; Write-Host "Start development environment"
    Write-Blue "  prod [service]    "; Write-Host "Start production environment (with SSL/proxy)"
    Write-Blue "  stop [service]    "; Write-Host "Stop services"
    Write-Blue "  restart [service] "; Write-Host "Restart services"
    Write-Blue "  logs [service]    "; Write-Host "Show logs"
    Write-Blue "  status            "; Write-Host "Show status of all services"
    Write-Blue "  clean             "; Write-Host "Remove all containers, networks, and volumes"
    Write-Blue "  config            "; Write-Host "Generate nginx configuration from .env"
    Write-Host ""
    Write-Host "Services:"
    Write-Blue "  all               "; Write-Host "All services (default)"
    Write-Blue "  infrastructure    "; Write-Host "PostgreSQL + Nginx + SSL only"
    Write-Blue "  wa            "; Write-Host "WA service (+ infrastructure if needed)"
    Write-Blue "  chat-ai           "; Write-Host "Chat AI service (+ infrastructure if needed)"
    Write-Blue "  backend           "; Write-Host "Backend API service (+ infrastructure if needed)"
    Write-Blue "  frontend          "; Write-Host "Frontend service (+ infrastructure if needed)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 dev                    # Start all services in development"
    Write-Host "  .\deploy.ps1 dev wa            # Start only WA + database"
    Write-Host "  .\deploy.ps1 dev backend           # Start only Backend + database"
    Write-Host "  .\deploy.ps1 prod                  # Start production with SSL/proxy"
    Write-Host "  .\deploy.ps1 config                # Generate nginx config from .env"
    Write-Host "  .\deploy.ps1 logs backend          # Show Backend logs"
}

function Test-EnvFile {
    param($Path, $ServiceName)
    
    if (-not (Test-Path $Path)) {
        Write-Yellow "Creating .env from template for $ServiceName..."
        $examplePath = "$Path.example"
        if (Test-Path $examplePath) {
            Copy-Item $examplePath $Path
            Write-Red "Please edit $Path and configure the settings before continuing!"
            return $false
        } else {
            Write-Red "Error: $examplePath not found!"
            return $false
        }
    }
    return $true
}

function New-Network {
    $networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^genfity-network$"
    if (-not $networkExists) {
        Write-Yellow "Creating genfity-network..."
        docker network create genfity-network
    }
}

function Invoke-GenerateNginxConfig {
    Write-Green "Generating nginx configuration..."
    
    if (-not (Test-Path ".env")) {
        Write-Red "Error: .env file not found in root directory!"
        return $false
    }
    
    # Make sure the script is executable and run it
    docker run --rm --env-file .env -v "${PWD}/nginx/sites-available:/etc/nginx/sites-available" -v "${PWD}/scripts:/scripts" alpine:latest /scripts/generate-nginx-config.sh
    
    Write-Green "Nginx configuration generated successfully!"
    return $true
}

function Start-Infrastructure {
    param($Profile)
    
    Write-Yellow "Starting infrastructure..."
    
    if (-not (Test-EnvFile ".env" "root infrastructure")) {
        return $false
    }
    
    New-Network
    
    if ($Profile -eq "prod") {
        if (-not (Invoke-GenerateNginxConfig)) {
            return $false
        }
        docker compose --profile prod up -d postgres nginx certbot
    } else {
        docker compose --profile dev up -d postgres
    }
    return $true
}

function Start-Service {
    param($ServiceName, $Profile)
    
    Write-Yellow "Starting $ServiceName service..."
    
    switch ($ServiceName) {
        "wa" {
            Push-Location "genfity-wa"
            try {
                if (-not (Test-EnvFile ".env" "WA")) {
                    return $false
                }
                docker compose up -d
            } finally {
                Pop-Location
            }
        }
        "chat-ai" {
            Push-Location "genfity-chat-ai"
            try {
                if (-not (Test-EnvFile ".env" "Chat AI")) {
                    return $false
                }
                docker compose up -d
            } finally {
                Pop-Location
            }
        }
        "backend" {
            Push-Location "genfity-backend"
            try {
                if (-not (Test-EnvFile ".env" "Backend API")) {
                    return $false
                }
                if ($Profile -eq "prod") {
                    docker compose --profile prod up -d
                } else {
                    docker compose --profile dev up -d
                }
            } finally {
                Pop-Location
            }
        }
        "frontend" {
            Push-Location "genfity-frontend"
            try {
                if (-not (Test-EnvFile ".env" "Frontend")) {
                    return $false
                }
                if ($Profile -eq "prod") {
                    docker compose --profile prod up -d
                } else {
                    docker compose --profile dev up -d
                }
            } finally {
                Pop-Location
            }
        }
        default {
            Write-Red "Unknown service: $ServiceName"
            return $false
        }
    }
    return $true
}

function Start-Environment {
    param($Mode, $ServiceName)
    
    Write-Green "Starting $Mode environment..."
    
    switch ($ServiceName) {
        "infrastructure" {
            if (-not (Start-Infrastructure $Mode)) { return }
        }
        "wa" {
            if (-not (Start-Infrastructure $Mode)) { return }
            if (-not (Start-Service "wa" $Mode)) { return }
        }
        "chat-ai" {
            if (-not (Start-Infrastructure $Mode)) { return }
            if (-not (Start-Service "chat-ai" $Mode)) { return }
        }
        "backend" {
            if (-not (Start-Infrastructure $Mode)) { return }
            if (-not (Start-Service "backend" $Mode)) { return }
        }
        "frontend" {
            if (-not (Start-Infrastructure $Mode)) { return }
            if (-not (Start-Service "frontend" $Mode)) { return }
        }
        "all" {
            if (-not (Start-Infrastructure $Mode)) { return }
            if (-not (Start-Service "wa" $Mode)) { return }
            if (-not (Start-Service "chat-ai" $Mode)) { return }
            if (-not (Start-Service "backend" $Mode)) { return }
            if (-not (Start-Service "frontend" $Mode)) { return }
        }
        default {
            Write-Red "Unknown service: $ServiceName"
            return
        }
    }
    
    Write-Green "$Mode environment started successfully!"
    Show-AccessInfo $Mode $ServiceName
}

function Show-AccessInfo {
    param($Mode, $ServiceName)
    
    Write-Yellow "Services available at:"
    
    if ($Mode -eq "dev") {
        if ($ServiceName -eq "all" -or $ServiceName -eq "wa") {
            Write-Host "  - WA: http://localhost:8080"
        }
        if ($ServiceName -eq "all" -or $ServiceName -eq "chat-ai") {
            Write-Host "  - Chat AI: http://localhost:8081"
        }
        if ($ServiceName -eq "all" -or $ServiceName -eq "backend") {
            Write-Host "  - Backend API: http://localhost:8090"
        }
        if ($ServiceName -eq "all" -or $ServiceName -eq "frontend") {
            Write-Host "  - Frontend: http://localhost:8050"
        }
        Write-Host "  - PostgreSQL: localhost:5432"
    } else {
        if (Test-Path ".env") {
            $envVars = @{}
            Get-Content ".env" | ForEach-Object {
                if ($_ -match "^([^#][^=]+)=(.*)$") {
                    $envVars[$matches[1]] = $matches[2]
                }
            }
            
            if (($ServiceName -eq "all" -or $ServiceName -eq "wa") -and $envVars["WA_DOMAIN"]) {
                Write-Host "  - WA: https://$($envVars['WA_DOMAIN'])"
            }
            if (($ServiceName -eq "all" -or $ServiceName -eq "chat-ai") -and $envVars["CHAT_AI_DOMAIN"]) {
                Write-Host "  - Chat AI: https://$($envVars['CHAT_AI_DOMAIN'])"
            }
            if (($ServiceName -eq "all" -or $ServiceName -eq "backend") -and $envVars["BACKEND_DOMAIN"]) {
                Write-Host "  - Backend API: https://$($envVars['BACKEND_DOMAIN'])"
            }
            if (($ServiceName -eq "all" -or $ServiceName -eq "frontend") -and $envVars["FRONTEND_DOMAIN"]) {
                Write-Host "  - Frontend: https://$($envVars['FRONTEND_DOMAIN'])"
            }
        }
    }
}

function Stop-Services {
    param($ServiceName)
    
    Write-Yellow "Stopping services..."
    
    switch ($ServiceName) {
        "infrastructure" {
            docker compose down
        }
        "wa" {
            Push-Location "genfity-wa"
            docker compose down
            Pop-Location
        }
        "chat-ai" {
            Push-Location "genfity-chat-ai"
            docker compose down
            Pop-Location
        }
        "backend" {
            Push-Location "genfity-backend"
            docker compose --profile dev down
            docker compose --profile prod down
            Pop-Location
        }
        "frontend" {
            Push-Location "genfity-frontend"
            docker compose --profile dev down
            docker compose --profile prod down
            Pop-Location
        }
        "all" {
            Push-Location "genfity-wa"
            docker compose down
            Pop-Location
            Push-Location "genfity-chat-ai"
            docker compose down
            Pop-Location
            Push-Location "genfity-backend"
            docker compose --profile dev down
            docker compose --profile prod down
            Pop-Location
            Push-Location "genfity-frontend"
            docker compose --profile dev down
            docker compose --profile prod down
            Pop-Location
            docker compose down
        }
    }
    
    Write-Green "Services stopped."
}

function Show-Logs {
    param($ServiceName)
    
    switch ($ServiceName) {
        "infrastructure" {
            docker compose logs -f
        }
        "wa" {
            Push-Location "genfity-wa"
            docker compose logs -f
            Pop-Location
        }
        "chat-ai" {
            Push-Location "genfity-chat-ai"
            docker compose logs -f
            Pop-Location
        }
        "backend" {
            Push-Location "genfity-backend"
            # Try to get logs from both dev and prod containers
            docker compose logs -f 2>/dev/null || Write-Host "No backend containers running"
            Pop-Location
        }
        "frontend" {
            Push-Location "genfity-frontend"
            # Try to get logs from both dev and prod containers
            docker compose logs -f 2>/dev/null || Write-Host "No frontend containers running"
            Pop-Location
        }
        "all" {
            Write-Yellow "Showing logs for all services (Ctrl+C to exit)..."
            docker compose logs -f
        }
    }
}

function Show-Status {
    Write-Green "=== Service Status ==="
    Write-Host ""
    Write-Blue "Infrastructure:"
    docker compose ps
    Write-Host ""
    Write-Blue "WA:"
    Push-Location "genfity-wa"
    docker compose ps
    Pop-Location
    Write-Host ""
    Write-Blue "Chat AI:"
    Push-Location "genfity-chat-ai"
    docker compose ps
    Pop-Location
    Write-Host ""
    Write-Blue "Backend API:"
    Push-Location "genfity-backend"
    docker compose ps
    Pop-Location
    Write-Host ""
    Write-Blue "Frontend:"
    Push-Location "genfity-frontend"
    docker compose ps
    Pop-Location
}

function Remove-All {
    Write-Red "Warning: This will remove all containers, networks, and volumes!"
    $response = Read-Host "Are you sure? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Yellow "Cleaning up all resources..."
        
        Push-Location "genfity-wa"
        docker compose down -v --remove-orphans
        Pop-Location
        Push-Location "genfity-chat-ai"
        docker compose down -v --remove-orphans
        Pop-Location
        Push-Location "genfity-backend"
        docker compose --profile dev down -v --remove-orphans
        docker compose --profile prod down -v --remove-orphans
        Pop-Location
        Push-Location "genfity-frontend"
        docker compose --profile dev down -v --remove-orphans
        docker compose --profile prod down -v --remove-orphans
        Pop-Location
        docker compose down -v --remove-orphans
        
        try {
            docker network rm genfity-network
        } catch {
            # Network might not exist
        }
        
        Write-Green "Cleanup completed."
    } else {
        Write-Yellow "Cleanup cancelled."
    }
}

# Main execution
switch ($Command) {
    "dev" { Start-Environment "dev" $Service }
    "prod" { Start-Environment "prod" $Service }
    "stop" { Stop-Services $Service }
    "restart" { 
        Stop-Services $Service
        Start-Sleep -Seconds 2
        Start-Environment "dev" $Service
    }
    "logs" { Show-Logs $Service }
    "status" { Show-Status }
    "clean" { Remove-All }
    "config" { Invoke-GenerateNginxConfig }
    "help" { Show-Usage }
    default { 
        Write-Red "Error: Unknown command '$Command'."
        Show-Usage
        exit 1
    }
}
