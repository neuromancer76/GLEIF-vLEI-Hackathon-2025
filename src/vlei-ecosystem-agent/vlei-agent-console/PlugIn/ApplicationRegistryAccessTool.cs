
using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace MyCustomMCPServer.Tools;

public class ApplicationRegistryAccessTool
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public ApplicationRegistryAccessTool(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _baseUrl = configuration["VleiRegistry:BaseUrl"] ?? "https://localhost:7042";
    }

    [KernelFunction("registry-application-list")]
    [Description("Get a list of all applications with their IDs and descriptions from the VLEI Registry API")]
    public async Task<string> GetApplicationListAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/Applications/list");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return content;
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error retrieving application list: {ex.Message}";
        }
    }

    [KernelFunction("registry-application-details")]
    [Description("Get detailed information about a specific application from the VLEI Registry API")]
    public async Task<string> GetApplicationDetailsAsync(
        [Description("The application ID to retrieve details for")] string applicationId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(applicationId))
            {
                return "Error: Application ID is required";
            }

            var response = await _httpClient.GetAsync($"{_baseUrl}/api/Applications/{applicationId}/details");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return content;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return $"Application with ID '{applicationId}' not found";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error retrieving application details: {ex.Message}";
        }
    }

    [KernelFunction("registry-application-create")]
    [Description("Create a new application in the VLEI Registry API")]
    public async Task<string> CreateApplicationAsync(
        [Description("The application ID")] string applicationId,
        [Description("The application description")] string description,
        [Description("The credential schema")] string credentialSchema,
        [Description("The MCP name")] string mcpName,
        [Description("The API URL")] string apiUrl,
        [Description("The portal URL")] string portalUrl)
    {
        try
        {
            var request = new
            {
                applicationId,
                description,
                credentialSchema,
                mcpName,
                apiUrl,
                portalUrl
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/Applications", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return responseContent;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                return $"Application with ID '{applicationId}' already exists";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error creating application: {ex.Message}";
        }
    }
}
