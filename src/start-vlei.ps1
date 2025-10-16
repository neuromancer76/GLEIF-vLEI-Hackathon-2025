# VLEI Ecosystem Quick Start Script (PowerShell)

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "clean")]
    [string]$Command = "start"
)

Write-Host "🐳 VLEI Ecosystem Quick Start" -ForegroundColor Blue
Write-Host "=============================="

function Start-VleiEcosystem {
    Write-Host "🚀 Starting VLEI Ecosystem..."
    
    # Check if .env file exists
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "📝 Please edit .env file with your Azure OpenAI credentials before continuing." -ForegroundColor Yellow
            Write-Host "   Required variables:"
            Write-Host "   - AZURE_OPENAI_ENDPOINT"
            Write-Host "   - AZURE_OPENAI_DEPLOYMENT_NAME" 
            Write-Host "   - AZURE_OPENAI_API_KEY"
            Write-Host ""
            Read-Host "Press Enter after configuring .env file to continue"
        } else {
            Write-Host "❌ .env.example not found. Please create .env file manually." -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "1️⃣  Starting VLEI Infrastructure..."
    Push-Location "vlei-environment/infrastructure-setup"
    try {
        docker-compose up -d
        Write-Host "✅ Infrastructure started" -ForegroundColor Green
        
        Write-Host "⏳ Waiting for infrastructure to initialize (30 seconds)..."
        Start-Sleep -Seconds 30
        
        # Check infrastructure health
        Write-Host "🔍 Checking infrastructure health..."
        $keriaHealth = $false
        $vleiHealth = $false
        
        try {
            Invoke-WebRequest -Uri "http://localhost:3901" -TimeoutSec 5 -ErrorAction Stop | Out-Null
            $keriaHealth = $true
            Write-Host "   ✅ KERIA services responding" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  KERIA services not ready yet" -ForegroundColor Yellow
        }
        
        try {
            Invoke-WebRequest -Uri "http://localhost:7723/ping" -TimeoutSec 5 -ErrorAction Stop | Out-Null
            $vleiHealth = $true
            Write-Host "   ✅ VLEI Schema server responding" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  VLEI Schema server not ready yet" -ForegroundColor Yellow
        }
        
        if (-not $keriaHealth -or -not $vleiHealth) {
            Write-Host "   💡 Infrastructure is starting up - application services may need extra time" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Failed to start infrastructure: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Host "2️⃣  Starting VLEI Application Services..."
    try {
        docker-compose up -d --build
        Write-Host "✅ Application services started" -ForegroundColor Green
        
        Write-Host "⏳ Waiting for application services to initialize (20 seconds)..."
        Start-Sleep -Seconds 20
        
    } catch {
        Write-Host "❌ Failed to start application services: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "3️⃣  Running health checks..."
    try {
        & ".\test-deployment.ps1" quick
    } catch {
        Write-Host "⚠️  Health check script not found or failed - checking manually..." -ForegroundColor Yellow
        
        # Manual health checks
        $services = @(
            @{Name="Registry"; Url="http://localhost:5136/health"},
            @{Name="Supplier BFF"; Url="http://localhost:5178/health"},
            @{Name="Chatbot API"; Url="http://localhost:5184/health"},
            @{Name="Web Frontend"; Url="http://localhost:3000/health.html"}
        )
        
        foreach ($service in $services) {
            Write-Host "Checking $($service.Name)... " -NoNewline
            try {
                $response = Invoke-RestMethod -Uri $service.Url -TimeoutSec 10 -ErrorAction Stop
                if ($response -match "Healthy" -or $response -eq "healthy") {
                    Write-Host "✅" -ForegroundColor Green
                } else {
                    Write-Host "❌" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "🎉 VLEI Ecosystem Started Successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Access Points:"
    Write-Host "   Web Application: http://localhost:3000"
    Write-Host "   Registry API:    http://localhost:5136"
    Write-Host "   Supplier BFF:    http://localhost:5178"
    Write-Host "   Chatbot API:     http://localhost:5184"
    Write-Host ""
    Write-Host "📊 Monitor with:"
    Write-Host "   docker-compose ps                 # Check service status"
    Write-Host "   docker-compose logs -f [service]  # View logs"
    Write-Host "   .\test-deployment.ps1             # Run health checks"
}

function Stop-VleiEcosystem {
    Write-Host "🛑 Stopping VLEI Ecosystem..."
    
    Write-Host "1️⃣  Stopping application services..."
    try {
        docker-compose down
        Write-Host "✅ Application services stopped" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Error stopping application services: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "2️⃣  Stopping infrastructure services..."
    Push-Location "vlei-environment/infrastructure-setup"
    try {
        docker-compose down
        Write-Host "✅ Infrastructure services stopped" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Error stopping infrastructure services: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Pop-Location
    
    Write-Host "🏁 VLEI Ecosystem stopped"
}

function Restart-VleiEcosystem {
    Write-Host "🔄 Restarting VLEI Ecosystem..."
    Stop-VleiEcosystem
    Start-Sleep -Seconds 5
    Start-VleiEcosystem
}

function Show-Status {
    Write-Host "📊 VLEI Ecosystem Status"
    Write-Host "========================"
    
    Write-Host "Infrastructure Services:" -ForegroundColor Blue
    Push-Location "vlei-environment/infrastructure-setup"
    try {
        docker-compose ps
    } catch {
        Write-Host "Error checking infrastructure status"
    }
    Pop-Location
    
    Write-Host ""
    Write-Host "Application Services:" -ForegroundColor Blue
    try {
        docker-compose ps
    } catch {
        Write-Host "Error checking application status"
    }
    
    Write-Host ""
    Write-Host "Docker System Status:" -ForegroundColor Blue
    docker system df
}

function Show-Logs {
    Write-Host "📋 VLEI Ecosystem Logs"
    Write-Host "======================"
    
    $choice = Read-Host "Show logs for: [a]ll, [i]nfrastructure, [app]lications, or [service name]"
    
    switch ($choice.ToLower()) {
        "a" {
            Write-Host "Application Services:" -ForegroundColor Blue
            docker-compose logs --tail=20
            
            Write-Host ""
            Write-Host "Infrastructure Services:" -ForegroundColor Blue
            Push-Location "vlei-environment/infrastructure-setup"
            docker-compose logs --tail=20
            Pop-Location
        }
        "i" {
            Write-Host "Infrastructure Services:" -ForegroundColor Blue
            Push-Location "vlei-environment/infrastructure-setup"
            docker-compose logs --tail=50
            Pop-Location
        }
        "app" {
            Write-Host "Application Services:" -ForegroundColor Blue
            docker-compose logs --tail=50
        }
        default {
            Write-Host "Service '$choice' logs:" -ForegroundColor Blue
            docker-compose logs --tail=50 $choice
        }
    }
}

function Clean-VleiEcosystem {
    Write-Host "🧹 Cleaning VLEI Ecosystem..."
    
    $confirm = Read-Host "This will remove all containers, volumes, and images. Continue? (y/N)"
    
    if ($confirm.ToLower() -eq "y" -or $confirm.ToLower() -eq "yes") {
        Write-Host "Stopping and removing containers..."
        
        # Stop and remove application services
        docker-compose down -v --remove-orphans
        
        # Stop and remove infrastructure services  
        Push-Location "vlei-environment/infrastructure-setup"
        docker-compose down -v --remove-orphans
        Pop-Location
        
        # Clean Docker system
        Write-Host "Cleaning Docker system..."
        docker system prune -f
        docker volume prune -f
        
        Write-Host "✅ VLEI Ecosystem cleaned" -ForegroundColor Green
    } else {
        Write-Host "Clean operation cancelled"
    }
}

# Main execution
switch ($Command) {
    "start" { Start-VleiEcosystem }
    "stop" { Stop-VleiEcosystem }
    "restart" { Restart-VleiEcosystem }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "clean" { Clean-VleiEcosystem }
    default {
        Write-Host "Usage: .\start-vlei.ps1 [start|stop|restart|status|logs|clean]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start   - Start VLEI infrastructure and applications (default)"
        Write-Host "  stop    - Stop all VLEI services"
        Write-Host "  restart - Restart all VLEI services"
        Write-Host "  status  - Show service status"
        Write-Host "  logs    - Show service logs"
        Write-Host "  clean   - Remove all containers and volumes"
    }
}