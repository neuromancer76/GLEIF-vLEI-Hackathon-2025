# VLEI Solution Deployment Test Script
# This script tests the complete VLEI solution deployment

param(
    [Parameter()]
    [ValidateSet("quick", "full", "health", "integration")]
    [string]$TestType = "full",
    
    [Parameter()]
    [switch]$ShowLogs,
    
    [Parameter()]
    [int]$TimeoutSeconds = 120,
    
    [Parameter()]
    [switch]$SkipInfrastructure
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-ColorText {
    param(
        [string]$Text,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# Service definitions with test endpoints
$Services = @(
    @{
        Name = "vlei-registry"
        DisplayName = "VLEI Registry"
        Port = 5136
        HealthEndpoint = "/health"
        TestEndpoints = @("/health", "/api/applications")
        StartupTime = 30
    },
    @{
        Name = "vlei-chatbot-api" 
        DisplayName = "VLEI Chatbot API"
        Port = 5184
        HealthEndpoint = "/health"
        TestEndpoints = @("/health", "/swagger")
        Dependencies = @("vlei-registry")
        StartupTime = 45
    },
    @{
        Name = "vlei-supplier-portal-bff"
        DisplayName = "VLEI Supplier Portal BFF"
        Port = 5178
        HealthEndpoint = "/health"
        TestEndpoints = @("/health", "/api/grants")
        Dependencies = @("vlei-registry")
        StartupTime = 40
    },
    @{
        Name = "vlei-supplier-portal-web"
        DisplayName = "VLEI Supplier Portal Web"
        Port = 3000
        HealthEndpoint = "/health.html"
        TestEndpoints = @("/", "/health.html")
        Dependencies = @("vlei-chatbot-api", "vlei-supplier-portal-bff")
        StartupTime = 20
    },
    @{
        Name = "vlei-holder-credential-responder"
        DisplayName = "VLEI Holder Credential Responder"
        Port = 3001
        HealthEndpoint = "process-check"
        TestEndpoints = @()
        StartupTime = 25
    }
)

# Infrastructure services
$Infrastructure = @(
    @{
        Name = "keria"
        DisplayName = "KERIA Agent"
        Port = 3901
        HealthEndpoint = "/ping"
        Required = $true
    },
    @{
        Name = "keria-registrar"
        DisplayName = "KERIA Registrar"
        Port = 3902
        HealthEndpoint = "/ping"
        Required = $true
    },
    @{
        Name = "witness-demo"
        DisplayName = "Witness Demo"
        Port = 5642
        HealthEndpoint = ""
        Required = $false
    }
)

function Show-Header {
    param([string]$Title)
    Write-ColorText ""
    Write-ColorText "===========================================" "Blue"
    Write-ColorText "🧪 $Title" "Blue"
    Write-ColorText "===========================================" "Blue"
}

function Test-ServiceHealth {
    param(
        [hashtable]$Service,
        [int]$TimeoutSeconds = 30
    )
    
    $serviceName = $Service.Name
    $port = $Service.Port
    $healthEndpoint = $Service.HealthEndpoint
    $url = "http://localhost:$port$healthEndpoint"
    
    Write-ColorText "   Testing $($Service.DisplayName) at $url..." "Gray"
    
    $startTime = Get-Date
    $timeout = $startTime.AddSeconds($TimeoutSeconds)
    
    do {
        try {
            if ($healthEndpoint -eq "process-check") {
                # Special case for Node.js service - check container process
                $containerStatus = docker-compose ps $serviceName --format json | ConvertFrom-Json
                if ($containerStatus.State -eq "running") {
                    Write-ColorText "     ✅ Container running" "Green"
                    return $true
                }
            } else {
                $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
                    Write-ColorText "     ✅ OK (${responseTime}ms)" "Green"
                    return $true
                }
            }
        } catch {
            # Service not ready yet, continue waiting
            Start-Sleep -Seconds 2
        }
        
        $now = Get-Date
    } while ($now -lt $timeout)
    
    Write-ColorText "     ❌ Timeout after $TimeoutSeconds seconds" "Red"
    return $false
}

function Test-HealthEndpoint {
    param(
        [string]$Url,
        [string]$ServiceName
    )
    
    Write-Host "Health check $ServiceName... " -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 10 -ErrorAction Stop
        
        if ($response -match "Healthy" -or $response -eq "healthy") {
            Write-Host "✓ HEALTHY" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "✗ UNHEALTHY ($response)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "✗ UNHEALTHY (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

function Check-DockerServices {
    Write-Host "📦 Checking Docker Services" -ForegroundColor Blue
    Write-Host "============================" 
    
    # Check if docker-compose is running
    try {
        $services = docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}" 2>$null
        if (-not $services -or $services.Count -le 1) {
            Write-Host "❌ No running Docker Compose services found" -ForegroundColor Red
            Write-Host "Please run: docker-compose up -d"
            exit 1
        }
        
        # List running services
        Write-Host "Running services:"
        $services | ForEach-Object { Write-Host $_ }
        Write-Host ""
    }
    catch {
        Write-Host "❌ Error checking Docker services: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

function Test-InfrastructureServices {
    Write-Host "🏗️ Testing VLEI Infrastructure Services" -ForegroundColor Blue
    Write-Host "========================================"
    
    $failed = 0
    
    # Test KERIA services
    if (-not (Test-Endpoint -Url $KERIA_ADMIN_URL -ServiceName "KERIA Admin" -Timeout 15)) { $failed++ }
    if (-not (Test-Endpoint -Url $KERIA_AGENT_URL -ServiceName "KERIA Agent" -Timeout 15)) { $failed++ }
    if (-not (Test-Endpoint -Url "$VLEI_SCHEMA_URL/ping" -ServiceName "VLEI Schema Server" -Timeout 10)) { $failed++ }
    
    Write-Host ""
    return $failed
}

function Test-ApplicationServices {
    Write-Host "🚀 Testing VLEI Application Services" -ForegroundColor Blue
    Write-Host "==================================="
    
    $failed = 0
    
    # Test health endpoints
    if (-not (Test-HealthEndpoint -Url "$REGISTRY_URL/health" -ServiceName "Registry Service")) { $failed++ }
    if (-not (Test-HealthEndpoint -Url "$BFF_URL/health" -ServiceName "Supplier BFF")) { $failed++ }
    if (-not (Test-HealthEndpoint -Url "$CHATBOT_URL/health" -ServiceName "Chatbot API")) { $failed++ }
    if (-not (Test-HealthEndpoint -Url "$WEB_URL/health.html" -ServiceName "Web Frontend")) { $failed++ }
    
    # Test basic connectivity
    if (-not (Test-Endpoint -Url $HOLDER_URL -ServiceName "Holder Responder" -Timeout 10)) { $failed++ }
    
    Write-Host ""
    return $failed
}

function Test-ApiEndpoints {
    Write-Host "🔌 Testing API Endpoints" -ForegroundColor Blue
    Write-Host "========================"
    
    $failed = 0
    
    # Test Registry API
    Write-Host "Registry API (/applications)... " -NoNewline
    try {
        Invoke-RestMethod -Uri "$REGISTRY_URL/api/applications" -TimeoutSec 10 -ErrorAction Stop | Out-Null
        Write-Host "✓ PASS" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $failed++
    }
    
    # Test BFF API
    Write-Host "Supplier BFF API (/api/supplier)... " -NoNewline
    try {
        Invoke-RestMethod -Uri "$BFF_URL/api/supplier" -TimeoutSec 10 -ErrorAction Stop | Out-Null
        Write-Host "✓ PASS" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $failed++
    }
    
    # Test Chatbot API
    Write-Host "Chatbot API (/chat)... " -NoNewline
    try {
        $body = @{
            message = "test"
            conversationId = "test"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$CHATBOT_URL/api/chat" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10 -ErrorAction Stop | Out-Null
        Write-Host "✓ PASS" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $failed++
    }
    
    Write-Host ""
    return $failed
}

function Test-WebFrontend {
    Write-Host "🌐 Testing Web Frontend" -ForegroundColor Blue
    Write-Host "======================="
    
    $failed = 0
    
    # Test main page
    Write-Host "Main page load... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $WEB_URL -TimeoutSec 10 -ErrorAction Stop
        if ($response.Content -match "html") {
            Write-Host "✓ PASS" -ForegroundColor Green
        }
        else {
            Write-Host "✗ FAIL" -ForegroundColor Red
            $failed++
        }
    }
    catch {
        Write-Host "✗ FAIL" -ForegroundColor Red
        $failed++
    }
    
    # Test static assets
    Write-Host "Static assets... " -NoNewline
    try {
        Invoke-WebRequest -Uri "$WEB_URL/vite.svg" -TimeoutSec 10 -ErrorAction Stop | Out-Null
        Write-Host "✓ PASS" -ForegroundColor Green
    }
    catch {
        Write-Host "? SKIP (assets may not be built)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    return $failed
}

function Check-Environment {
    Write-Host "⚙️ Checking Environment Configuration" -ForegroundColor Blue
    Write-Host "===================================="
    
    if (Test-Path ".env") {
        Write-Host "✓ .env file exists" -ForegroundColor Green
        
        # Check for required variables
        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "AZURE_OPENAI_ENDPOINT" -and $envContent -match "AZURE_OPENAI_API_KEY") {
            Write-Host "✓ Azure OpenAI configuration found" -ForegroundColor Green
        }
        else {
            Write-Host "⚠ Azure OpenAI configuration missing (some features may not work)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "⚠ .env file not found - copy from .env.example" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

function Show-ServiceUrls {
    Write-Host "🔗 Service URLs" -ForegroundColor Blue
    Write-Host "==============="
    Write-Host "Web Frontend:     $WEB_URL"
    Write-Host "Registry API:     $REGISTRY_URL"
    Write-Host "Supplier BFF:     $BFF_URL"
    Write-Host "Chatbot API:      $CHATBOT_URL"
    Write-Host "Holder Responder: $HOLDER_URL"
    Write-Host ""
    Write-Host "KERI Infrastructure:"
    Write-Host "KERIA Admin:      $KERIA_ADMIN_URL"
    Write-Host "KERIA Agent:      $KERIA_AGENT_URL"
    Write-Host "VLEI Schemas:     $VLEI_SCHEMA_URL"
    Write-Host ""
}

function Show-Logs {
    Write-Host "📋 Recent Service Logs" -ForegroundColor Blue
    Write-Host "======================"
    
    $services = @("vlei-registry", "vlei-supplier-portal-bff", "vlei-chatbot-api", "vlei-holder-credential-responder", "vlei-supplier-portal-web")
    
    foreach ($service in $services) {
        Write-Host "--- $service logs (last 5 lines) ---" -ForegroundColor Yellow
        try {
            docker-compose logs --tail=5 $service 2>$null
        }
        catch {
            Write-Host "Service not running"
        }
        Write-Host ""
    }
}

# Main execution
function Main {
    Write-Host "🐳 VLEI Ecosystem Health Check & Test Suite"
    Write-Host "==========================================="
    Write-Host "Starting at $(Get-Date)"
    Write-Host ""
    
    # Check environment
    Check-Environment
    
    # Check Docker services
    Check-DockerServices
    
    # Wait a moment for services to stabilize
    Write-Host "Waiting 5 seconds for services to stabilize..."
    Start-Sleep -Seconds 5
    Write-Host ""
    
    # Run tests
    $totalFailed = 0
    
    $totalFailed += Test-InfrastructureServices
    $totalFailed += Test-ApplicationServices
    $totalFailed += Test-ApiEndpoints
    $totalFailed += Test-WebFrontend
    
    # Show URLs
    Show-ServiceUrls
    
    # Final result
    Write-Host "📊 Test Summary" -ForegroundColor Blue
    Write-Host "==============="
    
    if ($totalFailed -eq 0) {
        Write-Host "🎉 All tests passed! VLEI ecosystem is healthy." -ForegroundColor Green
        Write-Host ""
        Write-Host "🌐 Access the application at: $WEB_URL"
    }
    else {
        Write-Host "❌ $totalFailed test(s) failed. Check service logs for details." -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Troubleshooting tips:"
        Write-Host "1. Check all services are running: docker-compose ps"
        Write-Host "2. Check logs: docker-compose logs [service-name]"
        Write-Host "3. Restart services: docker-compose restart"
        Write-Host "4. Check infrastructure: cd vlei-environment/infrastructure-setup && docker-compose ps"
        Write-Host ""
        
        # Show recent logs if there are failures
        Show-Logs
        
        exit 1
    }
}

function Quick {
    Check-DockerServices
    $failed = Test-ApplicationServices
    Show-ServiceUrls
    
    if ($failed -eq 0) {
        Write-Host "✅ Quick health check passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Quick health check failed!" -ForegroundColor Red
        exit 1
    }
}

# Handle command line arguments
switch ($Command) {
    "test" { Main }
    "logs" { Show-Logs }
    "urls" { Show-ServiceUrls }
    "quick" { Quick }
    default {
        Write-Host "Usage: .\test-deployment.ps1 [test|logs|urls|quick]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  test  - Run full test suite (default)"
        Write-Host "  logs  - Show recent service logs"
        Write-Host "  urls  - Show service URLs"
        Write-Host "  quick - Run quick health checks only"
    }
}