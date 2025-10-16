using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using vlei_chatbot_api.Services;

namespace vlei_chatbot_api;

internal class AutoFunctionInvocationFilter : IAutoFunctionInvocationFilter
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AutoFunctionInvocationFilter> _logger;

    public AutoFunctionInvocationFilter(
        IHttpContextAccessor httpContextAccessor,
        ILogger<AutoFunctionInvocationFilter> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task OnAutoFunctionInvocationAsync(AutoFunctionInvocationContext context, Func<AutoFunctionInvocationContext, Task> next)
    {
        try
        {
            // Log that we're calling the ecosystem tool
            var functionName = context.Function.Name;
            var pluginName = context.Function.PluginName ?? "Unknown";
            var fullToolName = $"{pluginName}.{functionName}";
            
            Console.WriteLine($"🔧 Calling ecosystem tool: {fullToolName}");
            _logger.LogInformation("🔧 AutoFunctionInvocationFilter: Calling tool {ToolName}", fullToolName);
            
            // Store tool call info in HTTP context so ChatService can notify the user
            if (_httpContextAccessor.HttpContext != null)
            {
                var toolCalls = _httpContextAccessor.HttpContext.Items["ToolCalls"] as List<string> 
                    ?? new List<string>();
                toolCalls.Add(fullToolName);
                _httpContextAccessor.HttpContext.Items["ToolCalls"] = toolCalls;
                
                // Also store pre-execution ecosystem messages for immediate display
                var preExecutionMessages = _httpContextAccessor.HttpContext.Items["PreExecutionMessages"] as List<string>
                    ?? new List<string>();
                var ecosystemMessage = $"VLEI ECOSYSTEM CALL: {GetUserFriendlyMessage(fullToolName)}";
                preExecutionMessages.Add(ecosystemMessage);
                _httpContextAccessor.HttpContext.Items["PreExecutionMessages"] = preExecutionMessages;
                
                _logger.LogInformation("✅ Stored tool call in HTTP context. Total calls: {Count}", toolCalls.Count);
                _logger.LogInformation("💬 Pre-execution message: {Message}", ecosystemMessage);
            }
            else
            {
                _logger.LogWarning("⚠️ HttpContext is null - cannot store tool call information!");
            }

            // Proceed with execution immediately (no approval required)
            await next(context);
            
            Console.WriteLine($"✅ Completed ecosystem tool call: {pluginName}.{functionName}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error in AutoFunctionInvocationFilter: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Converts technical tool names into user-friendly messages
    /// </summary>
    private static string GetUserFriendlyMessage(string toolCall)
    {
        // Parse plugin and function name
        var parts = toolCall.Split('.');
        var functionName = parts.Length > 1 ? parts[1] : toolCall;

        // Generate user-friendly messages based on the function name
        return functionName.ToLower() switch
        {
            // Company search and query functions
            "searchcompanies" or "querycompanies" or "executequery" => "Searching for companies in the VLEI ecosystem database",
            "getcompany" or "getcompanydetails" => "Retrieving detailed company information",
            "validatecompany" or "verifycompany" => "Validating company credentials and information",
            
            // Supplier portal functions
            "getsuppliers" or "searchsuppliers" => "Looking up supplier information in the portal",
            "validateei" or "verifyei" => "Verifying Legal Entity Identifier (LEI) credentials",
            "checkcredentials" or "validatecredentials" => "Validating digital credentials and certificates",
            
            // Registry functions
            "queryregistry" or "searchregistry" => "Searching the VLEI registry database",
            "getregistrydata" or "fetchregistryinfo" => "Fetching data from the VLEI registry",
            "validateregistry" or "verifyregistry" => "Verifying information against the registry",
            
            // Default cases for unknown functions
            var name when name.Contains("search") => "Searching the VLEI ecosystem",
            var name when name.Contains("validate") || name.Contains("verify") => "Validating information in the ecosystem",
            var name when name.Contains("get") || name.Contains("fetch") || name.Contains("retrieve") => "Retrieving information from the ecosystem",
            var name when name.Contains("create") || name.Contains("generate") => "Creating new data in the ecosystem",
            var name when name.Contains("send") || name.Contains("notify") => "Sending communication through the ecosystem",
            
            // Fallback for completely unknown functions
            _ => $"Executing {functionName} operation in the VLEI ecosystem"
        };
    }
}