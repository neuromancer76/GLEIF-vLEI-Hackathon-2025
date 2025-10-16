using supplier_bff.Models;
using supplier_bff.Services;
using System.Text.Json;

namespace supplier_bff.Repositories;

public class InMemoryItalianCompanyRepository : IItalianCompanyRepository
{
    private readonly List<ItalianCompany> _companies = new();
    private readonly ILogger<InMemoryItalianCompanyRepository> _logger;
    private readonly string _dataFilePath;
    private bool _isLoaded = false;

    public InMemoryItalianCompanyRepository(
        ILogger<InMemoryItalianCompanyRepository> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        // Default to the file in the project directory
        _dataFilePath = configuration["ItalianCompaniesDataPath"] 
            ?? Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "italian_companies.json");
    }

    public async Task LoadDataAsync()
    {
        if (_isLoaded)
        {
            _logger.LogInformation("Data already loaded, skipping reload");
            return;
        }

        try
        {
            _logger.LogInformation("Loading Italian company data from {FilePath}", _dataFilePath);
            
            if (!File.Exists(_dataFilePath))
            {
                _logger.LogWarning("Data file not found at {FilePath}", _dataFilePath);
                return;
            }

            var jsonData = await File.ReadAllTextAsync(_dataFilePath);
            
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var companies = JsonSerializer.Deserialize<List<ItalianCompany>>(jsonData, options);
            
            if (companies != null)
            {
                _companies.Clear();
                _companies.AddRange(companies);
                _isLoaded = true;
                _logger.LogInformation("Successfully loaded {Count} Italian companies", _companies.Count);
            }
            else
            {
                _logger.LogWarning("Failed to deserialize company data");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading Italian company data");
            throw;
        }
    }

    public Task<List<ItalianCompany>> GetAllAsync()
    {
        EnsureDataLoaded();
        return Task.FromResult(_companies.ToList());
    }

    public Task<QueryResult<ItalianCompany>> SearchAsync(string query)
    {
        EnsureDataLoaded();
        
        try
        {
            _logger.LogInformation("Executing DSL query: {Query}", query);
            
            var queryEngine = new CompanyQueryEngine(_companies);
            var result = queryEngine.Execute(query);
            
            _logger.LogInformation("Query returned {Count} results with {AggCount} aggregations", 
                result.Data.Count, result.Aggregations.Count);
            
            return Task.FromResult(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing DSL query");
            throw;
        }
    }

    public Task<ItalianCompany?> GetByVleiAsync(string vlei)
    {
        EnsureDataLoaded();
        
        var company = _companies.FirstOrDefault(c => 
            c.Vlei.Equals(vlei, StringComparison.OrdinalIgnoreCase));
        
        return Task.FromResult(company);
    }

    private void EnsureDataLoaded()
    {
        if (!_isLoaded)
        {
            throw new InvalidOperationException(
                "Data not loaded. Call LoadDataAsync() first.");
        }
    }
}
