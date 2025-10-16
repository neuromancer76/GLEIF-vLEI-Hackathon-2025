using supplier_bff.Services;

namespace supplier_bff.Middleware;

public class HeaderMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<HeaderMiddleware> _logger;

    // Signify header names as constants
    private const string SignatureHeader = "signature";
    private const string SignatureInputHeader = "signature-input";
    private const string SignifyResourceHeader = "signify-resource";
    private const string SignifyTimestampHeader = "signify-timestamp";

    public HeaderMiddleware(RequestDelegate next, ILogger<HeaderMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestContextService requestContextService, ISignifyValidationService signifyValidationService)
    {
        try
        {
            // Extract and store headers in the request-scoped service
            requestContextService.SetHeaders(context.Request.Headers);
            
            // Log signify headers for debugging
            LogSignifyHeaders(context.Request.Headers, requestContextService);
            
            // Perform signify validation if headers are present
            //await ValidateSignifyHeaders(context, requestContextService, signifyValidationService);
            
            _logger.LogDebug("Headers extracted and stored in request context");
            
            // Continue to the next middleware
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in HeaderMiddleware");
            throw;
        }
    }

    private void LogSignifyHeaders(IHeaderDictionary headers, RequestContextService requestContextService)
    {
        var signifyHeaders = requestContextService.GetSignifyHeaders();
        
        if (signifyHeaders != null)
        {
            _logger.LogInformation("Signify headers detected:");
            
            if (!string.IsNullOrEmpty(signifyHeaders.Signature))
            {
                _logger.LogInformation("Signature: {Signature}", 
                    signifyHeaders.Signature.Length > 50 ? 
                    signifyHeaders.Signature[..50] + "..." : 
                    signifyHeaders.Signature);
            }
            
            if (!string.IsNullOrEmpty(signifyHeaders.SignatureInput))
            {
                _logger.LogInformation("Signature-Input: {SignatureInput}", signifyHeaders.SignatureInput);
            }
            
            if (!string.IsNullOrEmpty(signifyHeaders.SignifyResource))
            {
                _logger.LogInformation("Signify-Resource: {SignifyResource}", signifyHeaders.SignifyResource);
            }
            
            if (!string.IsNullOrEmpty(signifyHeaders.SignifyTimestamp))
            {
                _logger.LogInformation("Signify-Timestamp: {SignifyTimestamp}", signifyHeaders.SignifyTimestamp);
            }

            // Log parsed signature input details
            var (keyId, algorithm, created) = requestContextService.GetSignifyMetadata();
            if (keyId != null || algorithm != null || created.HasValue)
            {
                _logger.LogInformation("Signify Metadata - KeyID: {KeyId}, Algorithm: {Algorithm}, Created: {Created}", 
                    keyId, algorithm, created);
            }

            // Log validation status
            if (requestContextService.HasValidSignifyHeaders())
            {
                _logger.LogInformation("All required signify headers are present and complete");
            }
            else
            {
                var missingHeaders = new List<string>();
                if (string.IsNullOrEmpty(signifyHeaders.Signature)) missingHeaders.Add(SignatureHeader);
                if (string.IsNullOrEmpty(signifyHeaders.SignatureInput)) missingHeaders.Add(SignatureInputHeader);
                if (string.IsNullOrEmpty(signifyHeaders.SignifyResource)) missingHeaders.Add(SignifyResourceHeader);
                if (string.IsNullOrEmpty(signifyHeaders.SignifyTimestamp)) missingHeaders.Add(SignifyTimestampHeader);
                
                _logger.LogWarning("Missing or incomplete signify headers: {MissingHeaders}", 
                    string.Join(", ", missingHeaders));
            }
        }
        else
        {
            _logger.LogDebug("No signify headers detected in request");
        }
    }

    private async Task ValidateSignifyHeaders(HttpContext context, RequestContextService requestContextService, ISignifyValidationService signifyValidationService)
    {
        var signifyHeaders = requestContextService.GetSignifyHeaders();
        
        if (signifyHeaders != null && requestContextService.HasValidSignifyHeaders())
        {
            _logger.LogInformation("Performing signify validation for {Method} {Path}", context.Request.Method, context.Request.Path);
            
            var validationResult = await signifyValidationService.ValidateSignifyHeadersAsync(
                signifyHeaders, 
                context.Request.Method, 
                context.Request.Path);

            requestContextService.SetSignifyValidationResult(validationResult);
  
            if (validationResult.IsValid)
            {
                _logger.LogInformation("Signify validation successful for {Method} {Path}", context.Request.Method, context.Request.Path);
            }
            else
            {
                _logger.LogWarning("Signify validation failed for {Method} {Path}. Errors: {Errors}", 
                    context.Request.Method, context.Request.Path, string.Join(", ", validationResult.ValidationErrors));
            }
        }
        else if (signifyHeaders != null)
        {
            _logger.LogWarning("Signify headers present but incomplete - skipping validation");
        }
    }
}