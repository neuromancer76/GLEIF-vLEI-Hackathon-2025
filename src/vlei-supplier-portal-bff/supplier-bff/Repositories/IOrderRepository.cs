using supplier_bff.Models;

namespace supplier_bff.Repositories;

public interface IOrderRepository
{
    Task<bool> CreateOrderAsync(OrderDetails order);
    Task<OrderDetails?> GetOrderByIdAsync(string orderId);
    Task<List<OrderDetails>> GetOrdersByLeiAsync(string lei);
    Task<List<OrderDetails>> GetOrdersForSupplierByLeiAsync(string supplierLei);
    Task<bool> UpdateOrderAsync(OrderDetails order);
    Task<bool> OrderExistsAsync(string orderId);
}