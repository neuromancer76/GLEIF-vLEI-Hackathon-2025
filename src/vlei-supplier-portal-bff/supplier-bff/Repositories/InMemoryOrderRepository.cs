using supplier_bff.Models;
using System.Collections.Concurrent;

namespace supplier_bff.Repositories;

public class InMemoryOrderRepository : IOrderRepository
{
    private readonly ConcurrentDictionary<string, OrderDetails> _orders = new();

    public Task<bool> CreateOrderAsync(OrderDetails order)
    {
        if (_orders.ContainsKey(order.OrderId))
        {
            return Task.FromResult(false); // Order already exists
        }

        return Task.FromResult(_orders.TryAdd(order.OrderId, order));
    }

    public Task<OrderDetails?> GetOrderByIdAsync(string orderId)
    {
        _orders.TryGetValue(orderId, out var order);
        return Task.FromResult(order);
    }

    public Task<List<OrderDetails>> GetOrdersByLeiAsync(string lei)
    {
        var orders = _orders.Values
            .Where(o => o.Requester?.Lei?.Equals(lei, StringComparison.OrdinalIgnoreCase) == true)
            .ToList();
        
        return Task.FromResult(orders);
    }

    public Task<List<OrderDetails>> GetOrdersForSupplierByLeiAsync(string supplierLei)
    {
        var orders = _orders.Values
            .Where(o => o.Candidates.Any(c => c.Lei.Equals(supplierLei, StringComparison.OrdinalIgnoreCase)))
            .ToList();
        
        return Task.FromResult(orders);
    }

    public Task<bool> UpdateOrderAsync(OrderDetails order)
    {
        if (!_orders.ContainsKey(order.OrderId))
        {
            return Task.FromResult(false);
        }

        _orders.TryUpdate(order.OrderId, order, _orders[order.OrderId]);
        return Task.FromResult(true);
    }

    public Task<bool> OrderExistsAsync(string orderId)
    {
        return Task.FromResult(_orders.ContainsKey(orderId));
    }
}