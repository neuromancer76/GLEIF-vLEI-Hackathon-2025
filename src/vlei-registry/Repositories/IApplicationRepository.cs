using VleiRegistry.Models;

namespace VleiRegistry.Repositories
{
    public interface IApplicationRepository
    {
        Task<IEnumerable<ApplicationListItem>> GetAllAsync();
        Task<ApplicationDetails?> GetByIdAsync(string applicationId);
        Task<Application> AddAsync(Application application);
        Task<bool> ExistsAsync(string applicationId);
    }
}