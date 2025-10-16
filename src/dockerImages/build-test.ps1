# VLEI Docker Images Build Script

Write-Host "🐳 VLEI Docker Images Build & Test Script" -ForegroundColor Blue
Write-Host "=========================================="

# Configuration
$Services = @(
    @{Name="vlei-registry"; DisplayName="VLEI Registry"},
    @{Name="vlei-chatbot-api"; DisplayName="VLEI Chatbot API"},
    @{Name="vlei-supplier-portal-bff"; DisplayName="VLEI Supplier Portal BFF"},
    @{Name="vlei-supplier-portal-web"; DisplayName="VLEI Supplier Portal Web"},
    @{Name="vlei-holder-credential-responder"; DisplayName="VLEI Holder Credential Responder"}
)

$BuildResults = @()

Write-Host "📋 Building services from dockerImages folder..." -ForegroundColor Yellow
Write-Host ""

foreach ($Service in $Services) {
    $serviceName = $Service.Name
    $displayName = $Service.DisplayName
    
    Write-Host "🔨 Building $displayName..." -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    try {
        $result = docker-compose build $serviceName 2>&1
        $exitCode = $LASTEXITCODE
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-Host "  ✅ SUCCESS ($([math]::Round($buildTime, 1))s)" -ForegroundColor Green
            $BuildResults += @{
                Service = $displayName
                Status = "SUCCESS"
                Time = $buildTime
                Error = $null
            }
        } else {
            Write-Host "  ❌ FAILED ($([math]::Round($buildTime, 1))s)" -ForegroundColor Red
            $BuildResults += @{
                Service = $displayName
                Status = "FAILED"
                Time = $buildTime
                Error = $result
            }
        }
    }
    catch {
        $endTime = Get-Date
        $buildTime = ($endTime - $startTime).TotalSeconds
        Write-Host "  ❌ ERROR ($([math]::Round($buildTime, 1))s)" -ForegroundColor Red
        $BuildResults += @{
            Service = $displayName
            Status = "ERROR"
            Time = $buildTime
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Build Summary
Write-Host "📊 Build Summary" -ForegroundColor Blue
Write-Host "=================="

$successCount = ($BuildResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedCount = ($BuildResults | Where-Object { $_.Status -ne "SUCCESS" }).Count
$totalTime = ($BuildResults | Measure-Object -Property Time -Sum).Sum

foreach ($result in $BuildResults) {
    $status = $result.Status
    $time = [math]::Round($result.Time, 1)
    
    if ($status -eq "SUCCESS") {
        $statusColor = "Green"
        $statusIcon = "✅"
    } else {
        $statusColor = "Red"  
        $statusIcon = "❌"
    }
    
    Write-Host "$statusIcon $($result.Service.PadRight(35)) $status ($($time)s)" -ForegroundColor $statusColor
}

Write-Host ""
Write-Host "📈 Overall Results:" -ForegroundColor Blue
Write-Host "   Successful: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
Write-Host "   Total Time: $([math]::Round($totalTime, 1)) seconds" -ForegroundColor White

if ($failedCount -gt 0) {
    Write-Host ""
    Write-Host "❌ Build Failures:" -ForegroundColor Red
    Write-Host "=================="
    
    $failedResults = $BuildResults | Where-Object { $_.Status -ne "SUCCESS" }
    foreach ($failed in $failedResults) {
        Write-Host ""
        Write-Host "🔴 $($failed.Service):" -ForegroundColor Red
        if ($failed.Error) {
            $errorLines = $failed.Error -split "`n" | Select-Object -Last 10
            foreach ($line in $errorLines) {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    }
}

if ($successCount -eq $Services.Count) {
    Write-Host ""
    Write-Host "🎉 All services built successfully!" -ForegroundColor Green
    Write-Host "   Ready to run: docker-compose up -d" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️  Some services failed to build. Check errors above." -ForegroundColor Yellow
    Write-Host "   Working services can still be run individually." -ForegroundColor Gray
}

# List built images
Write-Host ""
Write-Host "🖼️  Built Images:" -ForegroundColor Blue
Write-Host "================"

try {
    $images = docker images | Select-String "vlei-" | ForEach-Object { $_.ToString().Trim() }
    if ($images) {
        foreach ($image in $images) {
            Write-Host "   $image" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No VLEI images found" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Error listing images: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Blue
Write-Host "   1. Configure environment: cp .env.example .env"
Write-Host "   2. Start infrastructure: cd vlei-environment/infrastructure-setup && docker-compose up -d"  
Write-Host "   3. Start applications: docker-compose up -d"
Write-Host "   4. Test deployment: ./test-deployment.ps1"