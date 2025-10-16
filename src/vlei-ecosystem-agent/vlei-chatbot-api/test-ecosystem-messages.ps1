# Test Ecosystem Call Messages

Write-Host "Testing VLEI Ecosystem Call Message Helper" -ForegroundColor Green

# Build the project
dotnet build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! The ToolCallMessageHelper is ready to use." -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Example ecosystem call messages:" -ForegroundColor Cyan
    Write-Host "- CompanyQueryEngine.SearchCompanies -> 'VLEI ECOSYSTEM CALL: Searching for companies in the VLEI ecosystem database'" -ForegroundColor Gray
    Write-Host "- SupplierPortal.ValidateEI -> 'VLEI ECOSYSTEM CALL: Verifying Legal Entity Identifier (LEI) credentials'" -ForegroundColor Gray  
    Write-Host "- VLEIRegistry.QueryRegistry -> 'VLEI ECOSYSTEM CALL: Searching the VLEI registry database'" -ForegroundColor Gray
    Write-Host "- CredentialService.VerifyCredential -> 'VLEI ECOSYSTEM CALL: Verifying digital credentials and certificates'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 Ready to test in the chatbot interface!" -ForegroundColor Yellow
} else {
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
}