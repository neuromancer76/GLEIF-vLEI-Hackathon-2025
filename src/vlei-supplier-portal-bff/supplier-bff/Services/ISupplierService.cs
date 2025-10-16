using supplier_bff.Models;

namespace supplier_bff.Services;

public interface ISupplierService
{
    Task<bool> CreateSupplierRequestAsync(OrderDetails orderDetails);
    Task<bool> SendSupplierInvitationAsync(string body, string supplierEmail);
    Task<bool> ApplyToRequestAsync(string orderId, string lei);
    Task<OrderDetails?> GetOrderDetailsAsync(string orderId);
    Task<List<OrderDetails>> GetOrderListAsync(string lei);
    Task<List<OrderDetails>> GetOrdersForSupplierAsync(string supplierLei);
}