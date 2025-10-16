using supplier_bff.Models;
using VleiSupplierPortalCommon.Models;

namespace supplier_bff.Repositories;

public interface ISignifyValidationRepository
{
    Task<bool> ValidateSignatureAsync(SignifyHeaders signifyHeaders, string httpMethod, string path);
    Task<bool> ValidateKeyIdAsync(string keyId);
    Task<bool> ValidateTimestampAsync(string timestamp);
    Task<bool> ValidateResourceAsync(string resource);
}