using supplier_bff.Models;
using VleiSupplierPortalCommon.Models;

namespace supplier_bff.Repositories;

public class MockSignifyValidationRepository : ISignifyValidationRepository
{
    private readonly ILogger<MockSignifyValidationRepository> _logger;

    public MockSignifyValidationRepository(ILogger<MockSignifyValidationRepository> logger)
    {
        _logger = logger;
    }

    public async Task<bool> ValidateSignatureAsync(SignifyHeaders signifyHeaders, string httpMethod, string path)
    {
        _logger.LogInformation("Mock validation: Validating signature for {Method} {Path}", httpMethod, path);
        
        // Simulate some processing time
        await Task.Delay(10);

        if (signifyHeaders?.Signature == null)
        {
            _logger.LogWarning("Mock validation: No signature provided");
            return false;
        }

        // Mock validation logic - always return true for demonstration
        _logger.LogInformation("Mock validation: Signature validation successful");
        return true;
    }

    public async Task<bool> ValidateKeyIdAsync(string keyId)
    {
        _logger.LogInformation("Mock validation: Validating key ID: {KeyId}", keyId);
        
        // Simulate some processing time
        await Task.Delay(5);

        if (string.IsNullOrEmpty(keyId))
        {
            _logger.LogWarning("Mock validation: No key ID provided");
            return false;
        }

        // Mock validation - check if it looks like a valid key ID format
        if (keyId.Length < 10)
        {
            _logger.LogWarning("Mock validation: Key ID too short: {KeyId}", keyId);
            return false;
        }

        _logger.LogInformation("Mock validation: Key ID validation successful");
        return true;
    }

    public async Task<bool> ValidateTimestampAsync(string timestamp)
    {
        _logger.LogInformation("Mock validation: Validating timestamp: {Timestamp}", timestamp);
        
        // Simulate some processing time
        await Task.Delay(5);

        if (string.IsNullOrEmpty(timestamp))
        {
            _logger.LogWarning("Mock validation: No timestamp provided");
            return false;
        }

        // Mock validation - try to parse the timestamp
        if (DateTime.TryParse(timestamp, out var parsedTime))
        {
            var now = DateTime.UtcNow;
            var timeDiff = Math.Abs((now - parsedTime).TotalMinutes);
            
            // Mock rule: timestamp should be within 24 hours
            if (timeDiff > 1440) // 24 hours in minutes
            {
                _logger.LogWarning("Mock validation: Timestamp too old or too far in future: {Timestamp}", timestamp);
                return false;
            }

            _logger.LogInformation("Mock validation: Timestamp validation successful");
            return true;
        }

        _logger.LogWarning("Mock validation: Invalid timestamp format: {Timestamp}", timestamp);
        return false;
    }

    public async Task<bool> ValidateResourceAsync(string resource)
    {
        _logger.LogInformation("Mock validation: Validating resource: {Resource}", resource);
        
        // Simulate some processing time
        await Task.Delay(5);

        if (string.IsNullOrEmpty(resource))
        {
            _logger.LogWarning("Mock validation: No resource provided");
            return false;
        }

        // Mock validation - check if resource looks valid (basic format check)
        if (resource.Length < 20)
        {
            _logger.LogWarning("Mock validation: Resource ID too short: {Resource}", resource);
            return false;
        }

        _logger.LogInformation("Mock validation: Resource validation successful");
        return true;
    }
}