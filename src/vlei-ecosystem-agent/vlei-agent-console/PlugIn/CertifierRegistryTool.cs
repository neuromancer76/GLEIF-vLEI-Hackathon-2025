using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace MyCustomMCPServer.Tools;

public class CertifierRegistryTool
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public CertifierRegistryTool(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _baseUrl = configuration["VleiRegistry:BaseUrl"] ?? "https://localhost:7042";
    }

    [KernelFunction("registry-certifier-list")]
    [Description("Get a list of all certifiers with their IDs and descriptions from the VLEI Registry API")]
    public async Task<string> GetCertifierListAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/Certifiers/list");
            
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
            return $"Error retrieving certifier list: {ex.Message}";
        }
    }

    [KernelFunction("registry-certifier-details")]
    [Description("Get detailed information about a specific certifier from the VLEI Registry API")]
    public async Task<string> GetCertifierDetailsAsync(
        [Description("The certifier ID to retrieve details for")] string certifierId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(certifierId))
            {
                return "Error: Certifier ID is required";
            }

            var response = await _httpClient.GetAsync($"{_baseUrl}/api/Certifiers/{certifierId}/details");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return content;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return $"Certifier with ID '{certifierId}' not found";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error retrieving certifier details: {ex.Message}";
        }
    }

    [KernelFunction("registry-certifier-create")]
    [Description("Create a new certifier in the VLEI Registry API")]
    public async Task<string> CreateCertifierAsync(
        [Description("The certifier ID")] string id,
        [Description("The certifier name")] string name,
        [Description("The certifier description")] string description,
        [Description("The contact URI")] string contactUri,
        [Description("The badge types (comma-separated)")] string badgeTypes)
    {
        try
        {
            var badgeTypesList = string.IsNullOrWhiteSpace(badgeTypes) 
                ? new List<string>() 
                : badgeTypes.Split(',').Select(bt => bt.Trim()).ToList();

            var request = new
            {
                id,
                name,
                description,
                contactUri,
                badgeTypes = badgeTypesList
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/Certifiers", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return responseContent;
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                return $"Certifier with ID '{id}' already exists";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error creating certifier: {ex.Message}";
        }
    }
}