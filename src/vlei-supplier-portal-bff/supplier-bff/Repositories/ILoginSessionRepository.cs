using supplier_bff.Models;

namespace supplier_bff.Repositories;

public interface ILoginSessionRepository
{
    /// <summary>
    /// Confirm a grant by adding an entry to the repository
    /// </summary>
    /// <param name="entityAid">The entity AID</param>
    /// <param name="credentialSchemaAid">The credential schema AID</param>
    /// <param name="vlei">The VLEI identifier</param>
    /// <param name="validatedCredential">The validated credential</param>
    Task ConfirmGrantAsync(string entityAid, string credentialSchemaAid, string vlei, string validatedCredential);
    
    /// <summary>
    /// Check credentials by verifying if an entry exists for the given entityAID and credentialSchemaAid
    /// Polls for up to 10 seconds to find the entry
    /// </summary>
    /// <param name="entityAid">The entity AID to search for</param>
    /// <param name="credentialSchemaAid">The credential schema AID to search for</param>
    /// <returns>The login session if found</returns>
    /// <exception cref="TimeoutException">Thrown if no entry is found after 10 seconds</exception>
    Task<LoginSession> CheckCredentialsAsync(string entityAid, string credentialSchemaAid);
    
    /// <summary>
    /// Get a login session by entity AID and credential schema AID (without polling)
    /// </summary>
    Task<LoginSession?> GetByKeyAsync(string entityAid, string credentialSchemaAid);
}
