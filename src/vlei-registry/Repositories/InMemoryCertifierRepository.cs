using VleiRegistry.Models;
using System.Collections.Concurrent;

namespace VleiRegistry.Repositories
{
    public class InMemoryCertifierRepository : ICertifierRepository
    {
        private readonly ConcurrentDictionary<string, Certifier> _certifiers;

        public InMemoryCertifierRepository()
        {
            _certifiers = new ConcurrentDictionary<string, Certifier>();
        }

        public Task<IEnumerable<CertifierListItem>> GetAllAsync()
        {
            var certifiers = _certifiers.Values
                .Select(cert => new CertifierListItem
                {
                    Id = cert.Id,
                    Description = cert.Description
                });

            return Task.FromResult(certifiers);
        }

        public Task<CertifierDetails?> GetByIdAsync(string certifierId)
        {
            if (_certifiers.TryGetValue(certifierId, out var certifier))
            {
                var details = new CertifierDetails
                {
                    Id = certifier.Id,
                    BadgeTypes = new List<string>(certifier.BadgeTypes),
                    ContactUri = certifier.ContactUri,
                    Name = certifier.Name,
                    Description = certifier.Description
                };
                return Task.FromResult<CertifierDetails?>(details);
            }

            return Task.FromResult<CertifierDetails?>(null);
        }

        public Task<Certifier> AddAsync(Certifier certifier)
        {
            var added = _certifiers.AddOrUpdate(
                certifier.Id,
                certifier,
                (key, existing) => certifier);

            return Task.FromResult(added);
        }

        public Task<bool> ExistsAsync(string certifierId)
        {
            return Task.FromResult(_certifiers.ContainsKey(certifierId));
        }

        public void SeedData(IEnumerable<Certifier> certifiers)
        {
            foreach (var certifier in certifiers)
            {
                _certifiers.TryAdd(certifier.Id, certifier);
            }
        }
    }
}