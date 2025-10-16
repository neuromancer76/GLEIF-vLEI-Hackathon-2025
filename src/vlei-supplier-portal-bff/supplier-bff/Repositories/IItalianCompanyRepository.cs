using supplier_bff.Models;
using supplier_bff.Services;

namespace supplier_bff.Repositories;

public interface IItalianCompanyRepository
{
    /// <summary>
    /// Load all Italian company data
    /// </summary>
    Task LoadDataAsync();
    
    /// <summary>
    /// Get all Italian companies
    /// </summary>
    Task<List<ItalianCompany>> GetAllAsync();
    
    /// <summary>
    /// Search companies using DSL query
    /// </summary>
    /// <param name="query">DSL query string</param>
    /// <returns>Query result containing filtered data and aggregations</returns>
    Task<QueryResult<ItalianCompany>> SearchAsync(string query);
    
    /// <summary>
    /// Get a company by VLEI
    /// </summary>
    Task<ItalianCompany?> GetByVleiAsync(string vlei);
}
