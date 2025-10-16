# Test script for VLEI Ecosystem Call Messages

Write-Host "🧪 Testing VLEI Ecosystem Call Messages" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:5184/api/Chat"

# Function to make HTTP request and display results
function Test-ChatEndpoint {
    param(
        [string]$Endpoint,
        [object]$Body,
        [string]$Description
    )
    
    Write-Host "📋 $Description" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$Endpoint" -Method POST -Body ($Body | ConvertTo-Json) -ContentType "application/json"
        
        Write-Host "✅ Response received:" -ForegroundColor Green
        Write-Host "  ConversationId: $($response.conversationId)" -ForegroundColor Gray
        Write-Host "  Message: $($response.message)" -ForegroundColor Gray
        
        if ($response.toolCalls -and $response.toolCalls.Count -gt 0) {
            Write-Host "  🔧 Tool Calls: $($response.toolCalls -join ', ')" -ForegroundColor Yellow
        }
        
        if ($response.ecosystemMessages -and $response.ecosystemMessages.Count -gt 0) {
            Write-Host "  💬 Ecosystem Messages:" -ForegroundColor Magenta
            foreach ($msg in $response.ecosystemMessages) {
                Write-Host "    - $msg" -ForegroundColor White
            }
        } else {
            Write-Host "  ⚠️  No ecosystem messages found" -ForegroundColor Yellow
        }
        
        Write-Host ""
        return $response.conversationId
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $null
    }
}

# Test 1: Start conversation
Write-Host "🚀 Step 1: Starting conversation..." -ForegroundColor Blue
$startBody = @{
    initialMessage = "I'm the CEO of a company with LEI: 549300ABCDEF123456789"
}

$conversationId = Test-ChatEndpoint "start" $startBody "Starting new conversation with company context"

if (-not $conversationId) {
    Write-Host "❌ Failed to start conversation. Is the chatbot API running on port 5184?" -ForegroundColor Red
    Write-Host "💡 Run this first: cd vlei-ecosystem-agent\vlei-chatbot-api && dotnet run" -ForegroundColor Cyan
    exit 1
}

# Test 2: Send message that should trigger tool calls
Write-Host "🔍 Step 2: Testing search query..." -ForegroundColor Blue
$searchBody = @{
    message = "Search for companies in Italy with more than 100 employees"
    conversationId = $conversationId
}

Test-ChatEndpoint "message" $searchBody "Sending search query (should trigger tool calls)"

# Test 3: Send validation message
Write-Host "✅ Step 3: Testing validation..." -ForegroundColor Blue
$validationBody = @{
    message = "Validate my LEI credentials and check supplier status"
    conversationId = $conversationId
}

Test-ChatEndpoint "message" $validationBody "Sending validation request (should trigger validation tools)"

Write-Host "🎯 Testing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What to check:" -ForegroundColor Yellow
Write-Host "  1. Look for '🔧 Tool Calls' in the output above" -ForegroundColor Gray
Write-Host "  2. Look for '💬 Ecosystem Messages' with user-friendly descriptions" -ForegroundColor Gray
Write-Host "  3. Check the chatbot API console for debug logs" -ForegroundColor Gray
Write-Host ""
Write-Host "🐛 If no ecosystem messages appear:" -ForegroundColor Yellow
Write-Host "  - Check that functions are being called (look for 🔧 in API logs)" -ForegroundColor Gray
Write-Host "  - Verify AutoFunctionInvocationFilter is registered" -ForegroundColor Gray
Write-Host "  - Check HTTP context is available during function calls" -ForegroundColor Gray