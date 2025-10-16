using supplier_bff.Models;
using VleiSupplierPortalCommon.Models;

namespace supplier_bff.Services;

public interface ISignifyValidationService
{
    Task<SignifyValidationResult> ValidateSignifyHeadersAsync(SignifyHeaders signifyHeaders, string httpMethod, string path);
}

public class SignifyValidationResult
{
    public bool IsValid { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public Dictionary<string, bool> ComponentValidation { get; set; } = new();
    public string? KeyId { get; set; }
    public string? Algorithm { get; set; }
    public DateTime? ValidatedAt { get; set; } = DateTime.UtcNow;
}