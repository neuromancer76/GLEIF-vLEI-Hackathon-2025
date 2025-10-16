using System.Text.Json;

namespace supplier_bff.Services;

public interface IVleiGrantService
{
    Task<VleiGrantApiResponse?> LoginAsync(string entityAid, string? schemaSAID = null);
}

public class VleiGrantService : IVleiGrantService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<VleiGrantService> _logger;
    private readonly string _baseUrl = "http://localhost:5006";

    public VleiGrantService(HttpClient httpClient, ILogger<VleiGrantService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<VleiGrantApiResponse?> LoginAsync(string entityAid, string? schemaSAID = null)
    {
        try
        {
            _logger.LogInformation("Calling VLEI Grant API for entity login - EntityAID: {EntityAid}, SchemaSAID: {SchemaSAID}", 
                entityAid, schemaSAID);

            var url = $"{_baseUrl}/api/Grants/entity/{entityAid}";
            if (!string.IsNullOrEmpty(schemaSAID))
            {
                url += $"?schemaSAID={Uri.EscapeDataString(schemaSAID)}";
            }

            var response = await _httpClient.GetAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Successfully retrieved grants for entity {EntityAid}", entityAid);
                
                var apiResponse = JsonSerializer.Deserialize<VleiGrantApiResponse>(content, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                return apiResponse;
            }
            else
            {
                _logger.LogWarning("Failed to retrieve grants for entity {EntityAid}. Status: {StatusCode}, Reason: {ReasonPhrase}", 
                    entityAid, response.StatusCode, response.ReasonPhrase);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling VLEI Grant API for entity {EntityAid}", entityAid);
            return null;
        }
    }
}

/// <summary>
/// Response model for VLEI Grant API operations
/// </summary>
public class VleiGrantApiResponse
{
    /// <summary>
    /// Whether the operation was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message describing the result
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Optional data payload
    /// </summary>
    public object? Data { get; set; }
}