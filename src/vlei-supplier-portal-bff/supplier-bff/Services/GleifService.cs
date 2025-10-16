using supplier_bff.Models;
using supplier_bff.Repositories;
using System.Text.Json;

namespace supplier_bff.Services;

public class GleifService : IGleifService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GleifService> _logger;
    private readonly IItalianCompanyRepository _italianCompanyRepository;
    private const string GleifApiBaseUrl = "https://api.gleif.org/api/v1";

    public GleifService(
        HttpClient httpClient, 
        ILogger<GleifService> logger,
        IItalianCompanyRepository italianCompanyRepository)
    {
        _httpClient = httpClient;
        _logger = logger;
        _italianCompanyRepository = italianCompanyRepository;
        
        // Configure HttpClient
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "SupplierBFF/1.0");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<CompanyData?> GetCompanyDataAsync(string vlei)
    {
        try
        {
            _logger.LogInformation("Fetching company data for VLEI: {Vlei}", vlei);

            if (string.IsNullOrWhiteSpace(vlei))
            {
                _logger.LogWarning("VLEI parameter is null or empty");
                return null;
            }

            // Call the Italian company repository instead of GLEIF API
            var italianCompany = await _italianCompanyRepository.GetByVleiAsync(vlei);
            
            if (italianCompany == null)
            {
                _logger.LogWarning("No company found for VLEI: {Vlei}", vlei);
                return null;
            }

            // Map ItalianCompany to CompanyData
            var companyData = new CompanyData
            {
                Lei = italianCompany.Vlei,
                LegalName = italianCompany.Name,
                Language = "it", // Default to Italian
                Status = "ACTIVE", // Default status
                Jurisdiction = "IT", // Italy
                CreationDate = null,
                AlternativeNames = new List<string>(),
                PrimaryAddress = new CompanyAddress
                {
                    AddressLines = new List<string> { italianCompany.Address },
                    City = italianCompany.City,
                    Region = italianCompany.Region,
                    Country = "Italy",
                    PostalCode = string.Empty,
                    FormattedAddress = $"{italianCompany.Address}, {italianCompany.City}, {italianCompany.Region}, Italy"
                }
            };

            _logger.LogInformation("Successfully retrieved company data for VLEI: {Vlei}, Company: {CompanyName}", 
                vlei, companyData.LegalName);

            return companyData;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching company data for VLEI: {Vlei}", vlei);
            return null;
        }
    }

    public async Task<GleifLeiRecordsResponse?> GetLeiRecordsAsync(string lei)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(lei))
            {
                _logger.LogWarning("LEI parameter is null or empty");
                return null;
            }

            var url = $"{GleifApiBaseUrl}/lei-records?filter%5Blei%5D={Uri.EscapeDataString(lei)}";
            _logger.LogDebug("Making request to GLEIF API: {Url}", url);

            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GLEIF API request failed with status code: {StatusCode}, LEI: {Lei}", 
                    response.StatusCode, lei);
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            _logger.LogDebug("GLEIF API response received, content length: {Length}", jsonContent.Length);

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };

            var gleifResponse = JsonSerializer.Deserialize<GleifLeiRecordsResponse>(jsonContent, options);
            
            if (gleifResponse?.Data?.Any() == true)
            {
                _logger.LogInformation("Successfully retrieved {Count} LEI record(s) for LEI: {Lei}", 
                    gleifResponse.Data.Count, lei);
            }
            else
            {
                _logger.LogWarning("No LEI records found for LEI: {Lei}", lei);
            }

            return gleifResponse;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error while fetching LEI records for LEI: {Lei}", lei);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error while processing LEI records for LEI: {Lei}", lei);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching LEI records for LEI: {Lei}", lei);
            return null;
        }
    }

    private CompanyAddress MapAddress(GleifAddress gleifAddress)
    {
        var address = new CompanyAddress
        {
            AddressLines = gleifAddress.AddressLines ?? new List<string>(),
            City = gleifAddress.City ?? string.Empty,
            Region = gleifAddress.Region ?? string.Empty,
            Country = gleifAddress.Country ?? string.Empty,
            PostalCode = gleifAddress.PostalCode ?? string.Empty
        };

        // Create formatted address
        var addressParts = new List<string>();
        
        if (address.AddressLines.Any())
        {
            addressParts.AddRange(address.AddressLines);
        }
        
        if (!string.IsNullOrEmpty(address.City))
        {
            var cityLine = address.City;
            if (!string.IsNullOrEmpty(address.Region))
            {
                cityLine += $", {address.Region}";
            }
            if (!string.IsNullOrEmpty(address.PostalCode))
            {
                cityLine += $" {address.PostalCode}";
            }
            addressParts.Add(cityLine);
        }
        
        if (!string.IsNullOrEmpty(address.Country))
        {
            addressParts.Add(address.Country);
        }

        address.FormattedAddress = string.Join(", ", addressParts.Where(p => !string.IsNullOrWhiteSpace(p)));
        
        return address;
    }
}