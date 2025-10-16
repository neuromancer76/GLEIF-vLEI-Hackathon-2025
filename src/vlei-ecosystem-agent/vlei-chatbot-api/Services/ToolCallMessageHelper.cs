namespace vlei_chatbot_api.Services;

public static class ToolCallMessageHelper
{
    /// <summary>
    /// Converts technical tool names into user-friendly messages
    /// </summary>
    public static string GetUserFriendlyMessage(string toolCall)
    {
        // Parse plugin and function name
        var parts = toolCall.Split('.');
        var pluginName = parts.Length > 1 ? parts[0] : "Unknown";
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
            
            // Credential and certificate functions
            "issuecredential" or "createcredential" => "Processing credential issuance request",
            "verifycredential" or "validatecertificate" => "Verifying digital credentials and certificates",
            "renewcertificate" or "updatecredential" => "Updating or renewing digital certificates",
            
            // KERI and cryptographic functions
            "createidentifier" or "generateidentifier" => "Creating cryptographic identifier",
            "signdata" or "createsignature" => "Creating cryptographic signature",
            "verifyignature" or "validatesignature" => "Verifying cryptographic signature",
            
            // Notification and communication
            "sendnotification" or "notify" => "Sending notification through the ecosystem",
            "sendemail" or "sendalert" => "Sending email notification",
            "createalert" or "triggerevent" => "Creating system alert or event",
            
            // Data analysis and reporting
            "generatereport" or "createreport" => "Generating business intelligence report",
            "analyzedata" or "processdata" => "Analyzing ecosystem data",
            "getstats" or "getstatistics" => "Retrieving statistical information",
            
            // Integration and API calls
            "callapi" or "invokeservice" => "Calling external service or API",
            "syncdata" or "updatedata" => "Synchronizing data across systems",
            "fetchexternaldata" => "Retrieving data from external sources",
            
            // Default cases for unknown functions
            var name when name.Contains("search") => "Searching the VLEI ecosystem",
            var name when name.Contains("validate") || name.Contains("verify") => "Validating information in the ecosystem",
            var name when name.Contains("get") || name.Contains("fetch") || name.Contains("retrieve") => "Retrieving information from the ecosystem",
            var name when name.Contains("create") || name.Contains("generate") => "Creating new data in the ecosystem",
            var name when name.Contains("update") || name.Contains("modify") => "Updating ecosystem information",
            var name when name.Contains("send") || name.Contains("notify") => "Sending communication through the ecosystem",
            
            // Fallback for completely unknown functions
            _ => $"Executing {functionName} operation in the VLEI ecosystem"
        };
    }

    /// <summary>
    /// Creates the complete message with prefix
    /// </summary>
    public static string CreateEcosystemCallMessage(string toolCall)
    {
        var friendlyMessage = GetUserFriendlyMessage(toolCall);
        return $"VLEI ECOSYSTEM CALL: {friendlyMessage}";
    }

    /// <summary>
    /// Creates multiple ecosystem call messages
    /// </summary>
    public static List<string> CreateEcosystemCallMessages(List<string> toolCalls)
    {
        return toolCalls.Select(CreateEcosystemCallMessage).ToList();
    }
}