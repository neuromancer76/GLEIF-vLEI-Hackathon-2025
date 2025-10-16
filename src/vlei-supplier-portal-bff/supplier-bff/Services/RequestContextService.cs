using supplier_bff.Models;
using VleiSupplierPortalCommon.Models;

namespace supplier_bff.Services;

public class RequestContextService
{
    private readonly Dictionary<string, string> _headers = new();
    private SignifyHeaders? _signifyHeaders;
    private SignifyValidationResult? _validationResult;

    public void SetHeaders(IHeaderDictionary headers)
    {
        _headers.Clear();
        foreach (var header in headers)
        {
            _headers[header.Key] = header.Value.ToString();
        }

        // Extract and parse signify headers
        ExtractSignifyHeaders();
    }

    public string? GetHeader(string key)
    {
        _headers.TryGetValue(key, out var value);
        return value;
    }

    public Dictionary<string, string> GetAllHeaders()
    {
        return new Dictionary<string, string>(_headers);
    }

    /// <summary>
    /// Gets the parsed signify headers from the request
    /// </summary>
    public SignifyHeaders? GetSignifyHeaders()
    {
        return _signifyHeaders;
    }

    /// <summary>
    /// Checks if the request contains valid signify authentication headers
    /// </summary>
    public bool HasValidSignifyHeaders()
    {
        return _signifyHeaders?.IsComplete == true;
    }

    private void ExtractSignifyHeaders()
    {
        _signifyHeaders = new SignifyHeaders
        {
            Signature = GetHeader("signature"),
            SignatureInput = GetHeader("signature-input"),
            SignifyResource = GetHeader("signify-resource"),
            SignifyTimestamp = GetHeader("signify-timestamp")
        };
    }

    /// <summary>
    /// Gets specific signify header values for logging or validation
    /// </summary>
    public (string? keyId, string? algorithm, long? created) GetSignifyMetadata()
    {
        var details = _signifyHeaders?.ParseSignatureInput();
        return (details?.KeyId, details?.Algorithm, details?.Created);
    }

    /// <summary>
    /// Sets the signify validation result
    /// </summary>
    public void SetSignifyValidationResult(SignifyValidationResult validationResult)
    {
        _validationResult = validationResult;
    }

    /// <summary>
    /// Gets the signify validation result if validation has been performed
    /// </summary>
    public SignifyValidationResult? GetSignifyValidationResult()
    {
        return _validationResult;
    }

    /// <summary>
    /// Checks if the signify headers have been validated and are valid
    /// </summary>
    public bool IsSignifyValidated()
    {
        return _validationResult?.IsValid == true;
    }
}