using VleiRegistry.Models;

namespace VleiRegistry.Repositories
{
    public interface ICertifierRepository
    {
        Task<IEnumerable<CertifierListItem>> GetAllAsync();
        Task<CertifierDetails?> GetByIdAsync(string certifierId);
        Task<Certifier> AddAsync(Certifier certifier);
        Task<bool> ExistsAsync(string certifierId);
    }
}