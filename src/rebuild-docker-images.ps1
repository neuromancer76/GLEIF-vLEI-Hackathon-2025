# VLEI Solution - Complete Docker Rebuild Script
# This script rebuilds all Docker images and prepares the environment

param(
    [Parameter()]
    [ValidateSet("build", "rebuild", "clean-build", "test")]
    [string]$Action = "rebuild",
    
    [Parameter()]
    [switch]$NoCache,
    
    [Parameter()]
    [switch]$SkipTests,
    
    [Parameter()]
    [switch]$Parallel
)

# Script configuration
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-ColorText {
    param(
        [string]$Text,
        [ConsoleColor]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

# Service definitions
$Services = @(
    @{
        Name = "vlei-registry"
        DisplayName = "VLEI Registry"
        Description = "Trust registry and application discovery service"
        Technology = ".NET 9.0"
        Port = 5136
        HealthEndpoint = "/health"
        Dependencies = @()
    },
    @{
        Name = "vlei-chatbot-api"
        DisplayName = "VLEI Chatbot API"
        Description = "AI-powered assistant using Azure OpenAI"
        Technology = ".NET 9.0"
        Port = 5184
        HealthEndpoint = "/health"
        Dependencies = @("vlei-registry", "vlei-supplier-portal-bff")
    },
    @{
        Name = "vlei-supplier-portal-bff"
        DisplayName = "VLEI Supplier Portal BFF"
        Description = "Backend-for-frontend service"
        Technology = ".NET 9.0"
        Port = 5178
        HealthEndpoint = "/health"
        Dependencies = @("vlei-registry")
    },
    @{
        Name = "vlei-supplier-portal-web"
        DisplayName = "VLEI Supplier Portal Web"
        Description = "React frontend with Nginx"
        Technology = "React + Nginx"
        Port = 3000
        HealthEndpoint = "/health.html"
        Dependencies = @("vlei-chatbot-api", "vlei-supplier-portal-bff")
    },
    @{
        Name = "vlei-holder-credential-responder"
        DisplayName = "VLEI Holder Credential Responder"
        Description = "Automated credential presentation daemon"
        Technology = "Node.js + TypeScript"
        Port = 3001
        HealthEndpoint = "process-check"
        Dependencies = @()
        Note = "May have dependency issues with vlei-keria-library"
    }
)

function Show-Header {
    param([string]$Title)
    Write-ColorText ""
    Write-ColorText "===========================================" "Blue"
    Write-ColorText "🐳 $Title" "Blue"
    Write-ColorText "===========================================" "Blue"
}

function Show-ServiceInfo {
    Write-ColorText "📋 VLEI Services Overview" "Cyan"
    Write-ColorText "=========================="
    
    foreach ($service in $Services) {
        Write-ColorText ""
        Write-ColorText "🔧 $($service.DisplayName)" "Yellow"
        Write-ColorText "   Technology: $($service.Technology)" "Gray"
        Write-ColorText "   Port: $($service.Port)" "Gray"
        Write-ColorText "   Description: $($service.Description)" "Gray"
        if ($service.Dependencies.Count -gt 0) {
            Write-ColorText "   Dependencies: $($service.Dependencies -join ', ')" "Gray"
        }
        if ($service.Note) {
            Write-ColorText "   Note: $($service.Note)" "DarkYellow"
        }
    }
    Write-ColorText ""
}

function Test-Prerequisites {
    Write-ColorText "🔍 Checking Prerequisites..." "Cyan"
    
    $issues = @()
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "   ✅ Docker: $dockerVersion" "Green"
        } else {
            $issues += "Docker is not installed or not in PATH"
        }
    } catch {
        $issues += "Docker is not available"
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorText "   ✅ Docker Compose: $composeVersion" "Green"
        } else {
            $issues += "Docker Compose is not installed"
        }
    } catch {
        $issues += "Docker Compose is not available"
    }
    
    # Check environment file
    if (Test-Path ".env") {
        Write-ColorText "   ✅ Environment file (.env) exists" "Green"
        
        # Check for required Azure OpenAI settings
        $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
        if ($envContent -match "AZURE_OPENAI_ENDPOINT.*=.*\S" -and 
            $envContent -match "AZURE_OPENAI_API_KEY.*=.*\S") {
            Write-ColorText "   ✅ Azure OpenAI configuration found" "Green"
        } else {
            $issues += "Azure OpenAI configuration missing in .env file"
        }
    } else {
        $issues += ".env file not found (copy from .env.example)"
    }
    
    # Check dockerImages folder
    if (Test-Path "dockerImages") {
        Write-ColorText "   ✅ dockerImages folder exists" "Green"
    } else {
        $issues += "dockerImages folder not found"
    }
    
    # Check infrastructure setup
    if (Test-Path "vlei-environment/infrastructure-setup/docker-compose.yml") {
        Write-ColorText "   ✅ Infrastructure setup found" "Green"
    } else {
        $issues += "VLEI infrastructure setup not found"
    }
    
    if ($issues.Count -gt 0) {
        Write-ColorText ""
        Write-ColorText "❌ Prerequisites Issues:" "Red"
        foreach ($issue in $issues) {
            Write-ColorText "   • $issue" "Red"
        }
        return $false
    }
    
    Write-ColorText "   🎉 All prerequisites satisfied!" "Green"
    return $true
}

function Build-Service {
    param(
        [hashtable]$Service,
        [bool]$UseNoCache = $false
    )
    
    $serviceName = $Service.Name
    $displayName = $Service.DisplayName
    
    Write-ColorText "🔨 Building $displayName..." "Cyan"
    
    $buildArgs = @("build")
    if ($UseNoCache) {
        $buildArgs += "--no-cache"
    }
    $buildArgs += $serviceName
    
    $startTime = Get-Date
    
    try {
        $output = & docker-compose @buildArgs 2>&1
        $exitCode = $LASTEXITCODE
        
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-ColorText "   ✅ SUCCESS ($([math]::Round($buildTime, 1))s)" "Green"
            return @{
                Service = $displayName
                Status = "SUCCESS"
                Time = $buildTime
                Output = $output
            }
        } else {
            Write-ColorText "   ❌ FAILED ($([math]::Round($buildTime, 1))s)" "Red"
            Write-ColorText "   Error output:" "Red"
            ($output | Select-Object -Last 5) | ForEach-Object { Write-ColorText "     $_" "DarkRed" }
            
            return @{
                Service = $displayName
                Status = "FAILED"
                Time = $buildTime
                Output = $output
            }
        }
    } catch {
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        
        Write-ColorText "   ❌ ERROR ($([math]::Round($buildTime, 1))s)" "Red"
        Write-ColorText "   Exception: $($_.Exception.Message)" "DarkRed"
        
        return @{
            Service = $displayName
            Status = "ERROR"
            Time = $buildTime
            Output = $_.Exception.Message
        }
    }
}

function Build-AllServices {
    param([bool]$UseNoCache = $false, [bool]$BuildParallel = $false)
    
    Write-ColorText "🏗️ Building VLEI Services..." "Cyan"
    Write-ColorText "=============================="
    
    $buildResults = @()
    $startTime = Get-Date
    
    if ($BuildParallel) {
        Write-ColorText "   Using parallel build jobs..." "Yellow"
        
        # Build services in dependency order, but parallelize where possible
        $independentServices = $Services | Where-Object { $_.Dependencies.Count -eq 0 }
        $dependentServices = $Services | Where-Object { $_.Dependencies.Count -gt 0 }
        
        # Build independent services first (in parallel)
        $independentJobs = @()
        foreach ($service in $independentServices) {
            $job = Start-Job -ScriptBlock {
                param($ServiceName, $UseNoCache)
                Set-Location $using:PWD
                & docker-compose build $(if ($UseNoCache) { "--no-cache" }) $ServiceName
                return $LASTEXITCODE
            } -ArgumentList $service.Name, $UseNoCache
            
            $independentJobs += @{Job = $job; Service = $service}
        }
        
        # Wait for independent services
        foreach ($jobInfo in $independentJobs) {
            $result = Receive-Job -Job $jobInfo.Job -Wait
            Remove-Job -Job $jobInfo.Job
            
            $buildResults += @{
                Service = $jobInfo.Service.DisplayName
                Status = if ($result -eq 0) { "SUCCESS" } else { "FAILED" }
                Time = 0
            }
        }
        
        # Build dependent services sequentially
        foreach ($service in $dependentServices) {
            $result = Build-Service -Service $service -UseNoCache $UseNoCache
            $buildResults += $result
        }
    } else {
        # Sequential build
        foreach ($service in $Services) {
            $result = Build-Service -Service $service -UseNoCache $UseNoCache
            $buildResults += $result
            Write-ColorText ""
        }
    }
    
    $endTime = Get-Date
    $totalTime = ($endTime - $startTime).TotalSeconds
    
    return @{
        Results = $buildResults
        TotalTime = $totalTime
    }
}

function Show-BuildSummary {
    param([array]$BuildResults, [double]$TotalTime)
    
    Write-ColorText "📊 Build Summary" "Blue"
    Write-ColorText "================"
    
    $successCount = ($BuildResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
    $failedCount = ($BuildResults | Where-Object { $_.Status -ne "SUCCESS" }).Count
    
    foreach ($result in $BuildResults) {
        $status = $result.Status
        $time = if ($result.Time) { [math]::Round($result.Time, 1) } else { 0 }
        
        $statusIcon = switch ($status) {
            "SUCCESS" { "✅"; break }
            "FAILED" { "❌"; break }
            "ERROR" { "🔴"; break }
            default { "⚠️" }
        }
        
        $statusColor = switch ($status) {
            "SUCCESS" { "Green"; break }
            "FAILED" { "Red"; break }
            "ERROR" { "Red"; break }
            default { "Yellow" }
        }
        
        Write-ColorText "$statusIcon $($result.Service.PadRight(35)) $status ($($time)s)" $statusColor
    }
    
    Write-ColorText ""
    Write-ColorText "📈 Overall Results:" "Blue"
    Write-ColorText "   Successful: $successCount" "Green"
    Write-ColorText "   Failed: $failedCount" $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
    Write-ColorText "   Total Time: $([math]::Round($TotalTime, 1)) seconds" "White"
    
    return $successCount -eq $BuildResults.Count
}

function Clean-DockerResources {
    Write-ColorText "🧹 Cleaning Docker Resources..." "Yellow"
    
    # Stop and remove existing containers
    Write-ColorText "   Stopping containers..." "Gray"
    docker-compose down 2>$null
    
    # Remove VLEI images
    Write-ColorText "   Removing old VLEI images..." "Gray"
    $vleiImages = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "vlei-"
    foreach ($image in $vleiImages) {
        docker rmi $image.ToString() --force 2>$null
    }
    
    # Prune unused resources
    Write-ColorText "   Pruning unused resources..." "Gray"
    docker system prune -f 2>$null
    
    Write-ColorText "   ✅ Cleanup complete" "Green"
}

function Test-BuiltImages {
    Write-ColorText "🧪 Testing Built Images..." "Cyan"
    
    $vleiImages = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "vlei-"
    
    if ($vleiImages.Count -eq 0) {
        Write-ColorText "   ❌ No VLEI images found" "Red"
        return $false
    }
    
    Write-ColorText "   📦 Built Images:" "Green"
    foreach ($image in $vleiImages) {
        Write-ColorText "     • $($image.ToString())" "Gray"
    }
    
    # Test image integrity
    $allHealthy = $true
    foreach ($image in $vleiImages) {
        try {
            $inspect = docker inspect $image.ToString() --format "{{.Config.Healthcheck}}" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "     ✅ $($image.ToString()) - OK" "Green"
            } else {
                Write-ColorText "     ⚠️ $($image.ToString()) - No healthcheck" "Yellow"
            }
        } catch {
            Write-ColorText "     ❌ $($image.ToString()) - Error" "Red"
            $allHealthy = $false
        }
    }
    
    return $allHealthy
}

# Main execution
function Main {
    Show-Header "VLEI Solution Docker Rebuild"
    
    Write-ColorText "Action: $Action" "Yellow"
    if ($NoCache) { Write-ColorText "Mode: No cache" "Yellow" }
    if ($Parallel) { Write-ColorText "Mode: Parallel build" "Yellow" }
    
    Show-ServiceInfo
    
    # Check prerequisites
    if (-not (Test-Prerequisites)) {
        Write-ColorText ""
        Write-ColorText "❌ Prerequisites not met. Please fix the issues above." "Red"
        exit 1
    }
    
    Write-ColorText ""
    
    # Execute action
    switch ($Action) {
        "clean-build" {
            Clean-DockerResources
            $buildResult = Build-AllServices -UseNoCache $true -BuildParallel $Parallel
        }
        "rebuild" {
            $buildResult = Build-AllServices -UseNoCache $NoCache -BuildParallel $Parallel
        }
        "build" {
            $buildResult = Build-AllServices -UseNoCache $false -BuildParallel $Parallel
        }
        "test" {
            if (-not (Test-BuiltImages)) {
                Write-ColorText "❌ Image tests failed" "Red"
                exit 1
            }
            Write-ColorText "✅ All images passed tests" "Green"
            return
        }
    }
    
    Write-ColorText ""
    $success = Show-BuildSummary -BuildResults $buildResult.Results -TotalTime $buildResult.TotalTime
    
    if (-not $SkipTests -and $success) {
        Write-ColorText ""
        Test-BuiltImages | Out-Null
    }
    
    # Show next steps
    Write-ColorText ""
    Write-ColorText "🚀 Next Steps:" "Blue"
    
    if ($success) {
        Write-ColorText "   1. Configure environment: Edit .env file with your settings" "Gray"
        Write-ColorText "   2. Start infrastructure: cd vlei-environment/infrastructure-setup && docker-compose up -d" "Gray"
        Write-ColorText "   3. Start applications: docker-compose up -d" "Gray"
        Write-ColorText "   4. Test deployment: ./test-deployment.ps1" "Gray"
        Write-ColorText "   5. Access application: http://localhost:3000" "Gray"
        Write-ColorText ""
        Write-ColorText "🎉 Docker rebuild completed successfully!" "Green"
    } else {
        Write-ColorText "   1. Check build errors above" "Gray"
        Write-ColorText "   2. Fix any dependency issues" "Gray"
        Write-ColorText "   3. Re-run: ./rebuild-docker-images.ps1" "Gray"
        Write-ColorText ""
        Write-ColorText "⚠️ Some builds failed. Check the errors above." "Yellow"
        exit 1
    }
}

# Script help
if ($args -contains "-help" -or $args -contains "--help" -or $args -contains "-?") {
    Show-Header "VLEI Docker Rebuild Script Help"
    
    Write-ColorText "USAGE:" "Yellow"
    Write-ColorText "   .\rebuild-docker-images.ps1 [Action] [Options]" "Gray"
    Write-ColorText ""
    Write-ColorText "ACTIONS:" "Yellow"
    Write-ColorText "   build        - Build images incrementally (default: rebuild)" "Gray"
    Write-ColorText "   rebuild      - Rebuild all images (default)" "Gray"
    Write-ColorText "   clean-build  - Clean all resources and rebuild from scratch" "Gray"
    Write-ColorText "   test         - Test existing built images" "Gray"
    Write-ColorText ""
    Write-ColorText "OPTIONS:" "Yellow"
    Write-ColorText "   -NoCache     - Build without using Docker cache" "Gray"
    Write-ColorText "   -Parallel    - Use parallel builds where possible" "Gray"
    Write-ColorText "   -SkipTests   - Skip image testing after build" "Gray"
    Write-ColorText ""
    Write-ColorText "EXAMPLES:" "Yellow"
    Write-ColorText "   .\rebuild-docker-images.ps1                    # Standard rebuild" "Gray"
    Write-ColorText "   .\rebuild-docker-images.ps1 clean-build        # Clean rebuild" "Gray"
    Write-ColorText "   .\rebuild-docker-images.ps1 build -NoCache     # Build without cache" "Gray"
    Write-ColorText "   .\rebuild-docker-images.ps1 rebuild -Parallel  # Parallel rebuild" "Gray"
    
    return
}

# Run main function
Main