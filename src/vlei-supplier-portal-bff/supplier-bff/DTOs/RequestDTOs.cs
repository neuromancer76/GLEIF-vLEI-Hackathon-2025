using supplier_bff.Models;

namespace supplier_bff.DTOs;

public class CreateSupplierRequestDto
{
    public OrderDetails OrderDetails { get; set; } = new();
}

public class SendSupplierInvitationDto
{
    public string Body { get; set; } = string.Empty;
    public string SupplierEmail { get; set; } = string.Empty;
    public string SupplierLei { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
}

public class ApplyToRequestDto
{
    public string OrderId { get; set; } = string.Empty;
    public string Lei { get; set; } = string.Empty;
}