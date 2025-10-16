using VleiRegistry.Models;
using System.Collections.Concurrent;

namespace VleiRegistry.Repositories
{
    public class InMemoryApplicationRepository : IApplicationRepository
    {
        private readonly ConcurrentDictionary<string, Application> _applications;

        public InMemoryApplicationRepository()
        {
            _applications = new ConcurrentDictionary<string, Application>();
        }

        public Task<IEnumerable<ApplicationListItem>> GetAllAsync()
        {
            var applications = _applications.Values
                .Select(app => new ApplicationListItem
                {
                    ApplicationId = app.ApplicationId,
                    Description = app.Description
                });

            return Task.FromResult(applications);
        }

        public Task<ApplicationDetails?> GetByIdAsync(string applicationId)
        {
            if (_applications.TryGetValue(applicationId, out var application))
            {
                var details = new ApplicationDetails
                {
                    ApplicationId = application.ApplicationId,
                    Description = application.Description,
                    CredentialSchema = application.CredentialSchema,
                    McpName = application.McpName,
                    ApiUrl = application.ApiUrl,
                    PortalUrl = application.PortalUrl
                };
                return Task.FromResult<ApplicationDetails?>(details);
            }

            return Task.FromResult<ApplicationDetails?>(null);
        }

        public Task<Application> AddAsync(Application application)
        {
            var added = _applications.AddOrUpdate(
                application.ApplicationId,
                application,
                (key, existing) => application);

            return Task.FromResult(added);
        }

        public Task<bool> ExistsAsync(string applicationId)
        {
            return Task.FromResult(_applications.ContainsKey(applicationId));
        }

        public void SeedData(IEnumerable<Application> applications)
        {
            foreach (var application in applications)
            {
                _applications.TryAdd(application.ApplicationId, application);
            }
        }
    }
}