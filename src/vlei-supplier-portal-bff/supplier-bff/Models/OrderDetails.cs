namespace supplier_bff.Models;

public class OrderDetails
{
    public string OrderId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TotalAmount { get; set; } = string.Empty;
    public CompanyRequester? Requester { get; set; }
    public List<SupplierCandidate> Candidates { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}