namespace VleiRegistry.Models
{
    public class Application
    {
        public string ApplicationId { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CredentialSchema { get; set; } = string.Empty;
        public string McpName { get; set; } = string.Empty;
        public string ApiUrl { get; set; } = string.Empty;
        public string PortalUrl { get; set; } = string.Empty;
    }
}