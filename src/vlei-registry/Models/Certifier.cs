namespace VleiRegistry.Models
{
    public class Certifier
    {
        public string Id { get; set; } = string.Empty;
        public List<string> BadgeTypes { get; set; } = new List<string>();
        public string ContactUri { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}