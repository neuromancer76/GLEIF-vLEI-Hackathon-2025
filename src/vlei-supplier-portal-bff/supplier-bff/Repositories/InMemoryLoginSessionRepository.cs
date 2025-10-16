using supplier_bff.Models;
using System.Collections.Concurrent;

namespace supplier_bff.Repositories;

public class InMemoryLoginSessionRepository : ILoginSessionRepository
{
    private readonly ConcurrentDictionary<string, LoginSession> _sessions = new();
    private readonly ILogger<InMemoryLoginSessionRepository> _logger;

    public InMemoryLoginSessionRepository(
        ILogger<InMemoryLoginSessionRepository> logger,
        IConfiguration configuration )
    {
        _logger = logger;
          
    }

    private static string GetKey(string entityAid, string credentialSchemaAid)
    {
        return $"{entityAid}|{credentialSchemaAid}";
    }

    public Task ConfirmGrantAsync(string entityAid, string credentialSchemaAid, string vlei, string validatedCredential)
    {
        if (string.IsNullOrWhiteSpace(entityAid))
        {
            throw new ArgumentException("EntityAid cannot be null or empty", nameof(entityAid));
        }

        if (string.IsNullOrWhiteSpace(credentialSchemaAid))
        {
            throw new ArgumentException("CredentialSchemaAid cannot be null or empty", nameof(credentialSchemaAid));
        }

        if (string.IsNullOrWhiteSpace(vlei))
        {
            throw new ArgumentException("VLEI cannot be null or empty", nameof(vlei));
        }

        if (string.IsNullOrWhiteSpace(validatedCredential))
        {
            throw new ArgumentException("ValidatedCredential cannot be null or empty", nameof(validatedCredential));
        }

        var session = new LoginSession
        {
            EntityAid = entityAid,
            CredentialSchemaAid = credentialSchemaAid,
            Vlei = vlei,
            ValidatedCredential = validatedCredential,
            LoginDate = DateTime.UtcNow
        };

        var key = GetKey(entityAid, credentialSchemaAid);
        _sessions.AddOrUpdate(key, session, (k, existing) => session);
        
        _logger.LogInformation("Grant confirmed for EntityAID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}, VLEI: {Vlei}", 
            entityAid, credentialSchemaAid, vlei);
        
        return Task.CompletedTask;
    }

    public async Task<LoginSession> CheckCredentialsAsync(string entityAid, string credentialSchemaAid)
    {
        if (string.IsNullOrWhiteSpace(entityAid))
        {
            throw new ArgumentException("EntityAid cannot be null or empty", nameof(entityAid));
        }

        if (string.IsNullOrWhiteSpace(credentialSchemaAid))
        {
            throw new ArgumentException("CredentialSchemaAid cannot be null or empty", nameof(credentialSchemaAid));
        }

        _logger.LogInformation("Starting credential check polling for EntityAID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}", 
            entityAid, credentialSchemaAid);

        const int maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
        const int delayMs = 500;
        var key = GetKey(entityAid, credentialSchemaAid);
        
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            if (_sessions.TryGetValue(key, out var session))
            {
                _logger.LogInformation("Credentials found for EntityAID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid} after {Attempt} attempts", 
                    entityAid, credentialSchemaAid, attempt);
                return session;
            }

            _logger.LogDebug("Attempt {Attempt}/{MaxAttempts}: No session found for EntityAID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}", 
                attempt, maxAttempts, entityAid, credentialSchemaAid);

            if (attempt < maxAttempts)
            {
                await Task.Delay(delayMs);
            }
        }

        _logger.LogWarning("Credential check timeout: No session found for EntityAID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid} after {Seconds} seconds", 
            entityAid, credentialSchemaAid, maxAttempts * delayMs / 1000);

        throw new TimeoutException($"No login session found for EntityAID '{entityAid}' and CredentialSchemaAid '{credentialSchemaAid}' after 10 seconds of polling");
    }

    public Task<LoginSession?> GetByKeyAsync(string entityAid, string credentialSchemaAid)
    {
        if (string.IsNullOrWhiteSpace(entityAid) || string.IsNullOrWhiteSpace(credentialSchemaAid))
        {
            return Task.FromResult<LoginSession?>(null);
        }

        var key = GetKey(entityAid, credentialSchemaAid);
        _sessions.TryGetValue(key, out var session);
        return Task.FromResult(session);
    }
}
