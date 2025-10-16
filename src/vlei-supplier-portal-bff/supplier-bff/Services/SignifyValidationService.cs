using supplier_bff.Models;
using supplier_bff.Repositories;
using VleiSupplierPortalCommon.Models;

namespace supplier_bff.Services;

public class SignifyValidationService : ISignifyValidationService
{
    private readonly ISignifyValidationRepository _validationRepository;
    private readonly ILogger<SignifyValidationService> _logger;

    public SignifyValidationService(
        ISignifyValidationRepository validationRepository,
        ILogger<SignifyValidationService> logger)
    {
        _validationRepository = validationRepository;
        _logger = logger;
    }

    public async Task<SignifyValidationResult> ValidateSignifyHeadersAsync(
        SignifyHeaders signifyHeaders, 
        string httpMethod, 
        string path)
    {
        var result = new SignifyValidationResult();
        
        try
        {
            _logger.LogInformation("Starting signify validation for {Method} {Path}", httpMethod, path);

            // Check if headers are complete
            if (signifyHeaders == null || !signifyHeaders.IsComplete)
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Incomplete signify headers");
                _logger.LogWarning("Signify validation failed: Incomplete headers");
                return result;
            }

            // Extract metadata
            var parsedInput = signifyHeaders.ParseSignatureInput();
            if (parsedInput != null)
            {
                result.KeyId = parsedInput.KeyId;
                result.Algorithm = parsedInput.Algorithm;
            }

            // Validate signature
            var signatureValid = await _validationRepository.ValidateSignatureAsync(signifyHeaders, httpMethod, path);
            result.ComponentValidation["signature"] = signatureValid;
            if (!signatureValid)
            {
                result.ValidationErrors.Add("Invalid signature");
            }

            // Validate key ID
            var keyIdValid = false;
            if (parsedInput?.KeyId != null)
            {
                keyIdValid = await _validationRepository.ValidateKeyIdAsync(parsedInput.KeyId);
            }
            result.ComponentValidation["keyId"] = keyIdValid;
            if (!keyIdValid)
            {
                result.ValidationErrors.Add("Invalid key ID");
            }

            // Validate timestamp
            var timestampValid = false;
            if (signifyHeaders.SignifyTimestamp != null)
            {
                timestampValid = await _validationRepository.ValidateTimestampAsync(signifyHeaders.SignifyTimestamp);
            }
            result.ComponentValidation["timestamp"] = timestampValid;
            if (!timestampValid)
            {
                result.ValidationErrors.Add("Invalid timestamp");
            }

            // Validate resource
            var resourceValid = false;
            if (signifyHeaders.SignifyResource != null)
            {
                resourceValid = await _validationRepository.ValidateResourceAsync(signifyHeaders.SignifyResource);
            }
            result.ComponentValidation["resource"] = resourceValid;
            if (!resourceValid)
            {
                result.ValidationErrors.Add("Invalid resource");
            }

            // Overall validation result
            result.IsValid = signatureValid && keyIdValid && timestampValid && resourceValid;

            if (result.IsValid)
            {
                _logger.LogInformation("Signify validation successful for {Method} {Path}", httpMethod, path);
            }
            else
            {
                _logger.LogWarning("Signify validation failed for {Method} {Path}. Errors: {Errors}", 
                    httpMethod, path, string.Join(", ", result.ValidationErrors));
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during signify validation for {Method} {Path}", httpMethod, path);
            result.IsValid = false;
            result.ValidationErrors.Add($"Validation error: {ex.Message}");
            return result;
        }
    }
}