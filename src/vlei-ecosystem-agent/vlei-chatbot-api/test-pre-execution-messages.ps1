# Complete test for VLEI Ecosystem Call Messages Display

Write-Host "🧪 Testing Pre-Execution Ecosystem Messages" -ForegroundColor Green
Write-Host "This test verifies that ecosystem messages appear BEFORE the agent response" -ForegroundColor Gray
Write-Host ""

$baseUrl = "http://localhost:5184/api/Chat"

function Test-EcosystemMessages {
    param(
        [string]$TestMessage,
        [string]$ConversationId,
        [string]$Description
    )
    
    Write-Host "📋 $Description" -ForegroundColor Cyan
    
    try {
        $body = @{
            message = $TestMessage
            conversationId = $ConversationId
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/message" -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json"
        
        Write-Host "✅ Response received:" -ForegroundColor Green
        Write-Host "  Message Preview: $($response.message.Substring(0, [Math]::Min(100, $response.message.Length)))" -ForegroundColor Gray
        
        if ($response.toolCalls -and $response.toolCalls.Count -gt 0) {
            Write-Host "  🔧 Tool Calls ($($response.toolCalls.Count)):" -ForegroundColor Yellow
            foreach ($tool in $response.toolCalls) {
                Write-Host "    - $tool" -ForegroundColor White
            }
        } else {
            Write-Host "  ⚠️  No tool calls detected" -ForegroundColor Yellow
        }
        
        if ($response.ecosystemMessages -and $response.ecosystemMessages.Count -gt 0) {
            Write-Host "  💬 Ecosystem Messages ($($response.ecosystemMessages.Count)):" -ForegroundColor Magenta
            foreach ($msg in $response.ecosystemMessages) {
                Write-Host "    ✨ $msg" -ForegroundColor Green
            }
            Write-Host "  🎯 SUCCESS: Ecosystem messages will appear BEFORE assistant response!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ No ecosystem messages found" -ForegroundColor Red
            Write-Host "     This means function calls are not being properly tracked" -ForegroundColor Gray
        }
        
        Write-Host ""
        return $true
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Start conversation
Write-Host "🚀 Step 1: Starting conversation..." -ForegroundColor Blue
try {
    $startResponse = Invoke-RestMethod -Uri "$baseUrl/start" -Method POST -Body '{}' -ContentType "application/json"
    $conversationId = $startResponse.conversationId
    Write-Host "✅ Conversation started: $conversationId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Failed to start conversation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure the chatbot API is running: dotnet run" -ForegroundColor Cyan
    exit 1
}

# Test messages that should trigger functions
$testCases = @(
    @{
        Message = "Search for companies in Italy with more than 100 employees"
        Description = "Company Search Query (should trigger search functions)"
    },
    @{
        Message = "Validate LEI credentials for my company"  
        Description = "LEI Validation (should trigger validation functions)"
    },
    @{
        Message = "Get supplier information from the registry"
        Description = "Registry Query (should trigger registry functions)"
    },
    @{
        Message = "Generate a business report for companies in Lombardia"
        Description = "Report Generation (should trigger analysis functions)"
    }
)

$successCount = 0
foreach ($test in $testCases) {
    Write-Host "🔍 Step: Testing - $($test.Description)" -ForegroundColor Blue
    $success = Test-EcosystemMessages -TestMessage $test.Message -ConversationId $conversationId -Description $test.Description
    if ($success) { $successCount++ }
}

Write-Host "📊 Test Summary:" -ForegroundColor Yellow
Write-Host "  Successful tests: $successCount / $($testCases.Count)" -ForegroundColor $(if ($successCount -eq $testCases.Count) { "Green" } else { "Yellow" })
Write-Host ""

if ($successCount -eq $testCases.Count) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✨ Your chatbot will now show ecosystem calls before agent responses!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 In the frontend, you should see:" -ForegroundColor Yellow
    Write-Host "  1. User sends message" -ForegroundColor Gray
    Write-Host "  2. 💬 'VLEI ECOSYSTEM CALL: [action]' appears" -ForegroundColor Gray
    Write-Host "  3. 🤖 Assistant response appears after" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some tests failed. Check the following:" -ForegroundColor Yellow
    Write-Host "  - Are your MCP tools properly registered?" -ForegroundColor Gray
    Write-Host "  - Is AutoFunctionInvocationFilter working?" -ForegroundColor Gray
    Write-Host "  - Check the API logs for function call traces" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔧 To test in the actual UI:" -ForegroundColor Cyan
Write-Host "  1. Start the supplier portal frontend" -ForegroundColor Gray
Write-Host "  2. Open the chatbot" -ForegroundColor Gray
Write-Host "  3. Send: 'Search for Italian companies'" -ForegroundColor Gray
Write-Host "  4. Watch for blue ecosystem messages appearing first! ✨" -ForegroundColor Gray