namespace supplier_bff.Models;

public class LoginSession
{
    public string EntityAid { get; set; } = string.Empty;
    public string CredentialSchemaAid { get; set; } = string.Empty;
    public string Vlei { get; set; } = string.Empty;
    public string ValidatedCredential { get; set; } = string.Empty;
    public DateTime LoginDate { get; set; }
}
