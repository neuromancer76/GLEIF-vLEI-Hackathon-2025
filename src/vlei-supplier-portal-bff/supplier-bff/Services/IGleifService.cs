using supplier_bff.Models;

namespace supplier_bff.Services;

public interface IGleifService
{
    Task<CompanyData?> GetCompanyDataAsync(string lei);
    Task<GleifLeiRecordsResponse?> GetLeiRecordsAsync(string lei);
}