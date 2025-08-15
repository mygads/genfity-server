# Genfity Server Management Script for Windows
# Use: .\deploy.ps1 [command] [options]

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod", "stop", "restart", "logs", "status", "clean", "setup-ssl", "help")]
    [string]$Command = "help",
    
    [Parameter()]
    [ValidateSet("all", "wuzapi", "eventapi")]
    [string]$Service = "all"
)

# Colors for output (Windows PowerShell)
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Green { Write-ColorOutput Green $args }
function Write-Yellow { Write-ColorOutput Yellow $args }
function Write-Red { Write-ColorOutput Red $args }
function Write-Blue { Write-ColorOutput Blue $args }

function Show-Usage {
    Write-Green "=== Genfity Deployment Manager ==="
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [-Service SERVICE]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Blue "  dev          "; Write-Host "Start development environment (DB + Apps only)"
    Write-Blue "  prod         "; Write-Host "Start production environment (DB + Apps + Nginx + SSL)"
    Write-Blue "  stop         "; Write-Host "Stop all services"
    Write-Blue "  restart      "; Write-Host "Restart all services"
    Write-Blue "  logs         "; Write-Host "Show logs for all services"
    Write-Blue "  status       "; Write-Host "Show status of all services"
    Write-Blue "  clean        "; Write-Host "Stop and remove all containers, networks, and volumes"
    Write-Blue "  setup-ssl    "; Write-Host "Setup SSL certificates (production only)"
    Write-Host ""
    Write-Host "Options:"
    Write-Blue "  -Service     "; Write-Host "Specify service (wuzapi|eventapi|all) - default: all"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 dev                    # Start development environment"
    Write-Host "  .\deploy.ps1 prod                   # Start production environment"
    Write-Host "  .\deploy.ps1 dev -Service wuzapi    # Start only wuzapi in dev mode"
    Write-Host "  .\deploy.ps1 stop                   # Stop all services"
    Write-Host "  .\deploy.ps1 logs -Service eventapi # Show logs for event-api only"
}

function Test-NetworkExists {
    $networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^genfity-network$"
    return $networkExists -ne $null
}

function New-Network {
    if (-not (Test-NetworkExists)) {
        Write-Yellow "Creating genfity-network..."
        docker network create genfity-network
    }
}

function Start-DevEnvironment {
    param($ServiceName)
    
    Write-Green "Starting development environment..."
    
    New-Network
    
    # Start infrastructure
    Write-Yellow "Starting PostgreSQL database..."
    docker compose --profile dev up -d postgres
    
    switch ($ServiceName) {
        "wuzapi" {
            Write-Yellow "Starting WuzAPI service..."
            Set-Location genfity-wuzapi
            docker compose --profile dev up -d
            Set-Location ..
        }
        "eventapi" {
            Write-Yellow "Starting Event API service..."
            Set-Location genfity-event-api
            docker compose --profile dev up -d
            Set-Location ..
        }
        default {
            Write-Yellow "Starting all application services..."
            Set-Location genfity-wuzapi
            docker compose --profile dev up -d
            Set-Location ..\genfity-event-api
            docker compose --profile dev up -d
            Set-Location ..
        }
    }
    
    Write-Green "Development environment started successfully!"
    Write-Yellow "Services available at:"
    if ($ServiceName -eq "all" -or $ServiceName -eq "wuzapi") {
        Write-Host "  - WuzAPI: http://localhost:8080"
    }
    if ($ServiceName -eq "all" -or $ServiceName -eq "eventapi") {
        Write-Host "  - Event API: http://localhost:8081"
    }
    Write-Host "  - PostgreSQL: localhost:5432"
}

function Start-ProdEnvironment {
    param($ServiceName)
    
    Write-Green "Starting production environment..."
    
    # Check if .env exists
    if (-not (Test-Path ".env")) {
        Write-Red "Error: .env file not found. Please copy .env.example to .env and configure it."
        exit 1
    }
    
    New-Network
    
    # Start infrastructure
    Write-Yellow "Starting infrastructure (PostgreSQL + Nginx + SSL)..."
    docker compose --profile prod up -d
    
    switch ($ServiceName) {
        "wuzapi" {
            Write-Yellow "Starting WuzAPI service..."
            Set-Location genfity-wuzapi
            docker compose --profile prod up -d
            Set-Location ..
        }
        "eventapi" {
            Write-Yellow "Starting Event API service..."
            Set-Location genfity-event-api
            docker compose --profile prod up -d
            Set-Location ..
        }
        default {
            Write-Yellow "Starting all application services..."
            Set-Location genfity-wuzapi
            docker compose --profile prod up -d
            Set-Location ..\genfity-event-api
            docker compose --profile prod up -d
            Set-Location ..
        }
    }
    
    Write-Green "Production environment started successfully!"
    Write-Yellow "Services available at:"
    
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
        
        if ($ServiceName -eq "all" -or $ServiceName -eq "wuzapi") {
            $wuzapiDomain = $env:WUZAPI_DOMAIN
            if (-not $wuzapiDomain) { $wuzapiDomain = "wuzapi.yourdomain.com" }
            Write-Host "  - WuzAPI: https://$wuzapiDomain"
        }
        if ($ServiceName -eq "all" -or $ServiceName -eq "eventapi") {
            $eventapiDomain = $env:EVENTAPI_DOMAIN
            if (-not $eventapiDomain) { $eventapiDomain = "eventapi.yourdomain.com" }
            Write-Host "  - Event API: https://$eventapiDomain"
        }
    }
}

function Stop-Services {
    Write-Yellow "Stopping all services..."
    
    # Stop applications
    Set-Location genfity-wuzapi
    docker compose down
    Set-Location ..\genfity-event-api
    docker compose down
    Set-Location ..
    
    # Stop infrastructure
    docker compose down
    
    Write-Green "All services stopped."
}

function Restart-Services {
    param($ServiceName, $Mode)
    
    Write-Yellow "Restarting services..."
    Stop-Services
    Start-Sleep -Seconds 2
    
    if ($Mode -eq "prod") {
        Start-ProdEnvironment $ServiceName
    } else {
        Start-DevEnvironment $ServiceName
    }
}

function Show-Logs {
    param($ServiceName)
    
    switch ($ServiceName) {
        "wuzapi" {
            Set-Location genfity-wuzapi
            docker compose logs -f
            Set-Location ..
        }
        "eventapi" {
            Set-Location genfity-event-api
            docker compose logs -f
            Set-Location ..
        }
        default {
            Write-Yellow "Showing logs for all services (Ctrl+C to exit)..."
            Start-Job -ScriptBlock { docker compose logs -f } | Out-Null
            Start-Job -ScriptBlock { 
                Set-Location genfity-wuzapi
                docker compose logs -f 
            } | Out-Null
            Start-Job -ScriptBlock { 
                Set-Location genfity-event-api
                docker compose logs -f 
            } | Out-Null
            
            try {
                while ($true) {
                    Start-Sleep -Seconds 1
                }
            } finally {
                Get-Job | Stop-Job
                Get-Job | Remove-Job
            }
        }
    }
}

function Show-Status {
    Write-Green "=== Service Status ==="
    Write-Host ""
    Write-Blue "Infrastructure:"
    docker compose ps
    Write-Host ""
    Write-Blue "WuzAPI:"
    Set-Location genfity-wuzapi
    docker compose ps
    Set-Location ..
    Write-Host ""
    Write-Blue "Event API:"
    Set-Location genfity-event-api
    docker compose ps
    Set-Location ..
}

function Remove-All {
    Write-Red "Warning: This will remove all containers, networks, and volumes!"
    $response = Read-Host "Are you sure? (y/N)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Yellow "Cleaning up all resources..."
        
        # Stop and remove everything
        Set-Location genfity-wuzapi
        docker compose down -v --remove-orphans
        Set-Location ..\genfity-event-api
        docker compose down -v --remove-orphans
        Set-Location ..
        docker compose down -v --remove-orphans
        
        # Remove network
        try {
            docker network rm genfity-network
        } catch {
            # Network might not exist, ignore error
        }
        
        Write-Green "Cleanup completed."
    } else {
        Write-Yellow "Cleanup cancelled."
    }
}

function Setup-SSL {
    if (Test-Path "scripts\setup-ssl.sh") {
        # Run in WSL or Git Bash if available
        if (Get-Command wsl -ErrorAction SilentlyContinue) {
            wsl bash scripts/setup-ssl.sh
        } elseif (Get-Command "C:\Program Files\Git\bin\bash.exe" -ErrorAction SilentlyContinue) {
            & "C:\Program Files\Git\bin\bash.exe" scripts/setup-ssl.sh
        } else {
            Write-Red "Error: SSL setup requires WSL or Git Bash. Please install one of them or run the script manually."
            Write-Yellow "Alternative: Run the SSL setup commands manually in Docker."
        }
    } else {
        Write-Red "Error: scripts\setup-ssl.sh not found."
    }
}

# Main execution
switch ($Command) {
    "dev" { Start-DevEnvironment $Service }
    "prod" { Start-ProdEnvironment $Service }
    "stop" { Stop-Services }
    "restart" { Restart-Services $Service "dev" }
    "logs" { Show-Logs $Service }
    "status" { Show-Status }
    "clean" { Remove-All }
    "setup-ssl" { Setup-SSL }
    "help" { Show-Usage }
    default { 
        Write-Red "Error: Unknown command '$Command'."
        Show-Usage
        exit 1
    }
}
