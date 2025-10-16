using supplier_bff.Models;
using supplier_bff.Repositories;

namespace supplier_bff.Services;

public class SupplierService : ISupplierService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IEmailService _emailService;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(IOrderRepository orderRepository, IEmailService emailService, ILogger<SupplierService> logger)
    {
        _orderRepository = orderRepository;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<bool> CreateSupplierRequestAsync(OrderDetails orderDetails)
    {
        try
        {
            // Check if order ID already exists
            if (await _orderRepository.OrderExistsAsync(orderDetails.OrderId))
            {
                _logger.LogWarning("Order with ID {OrderId} already exists", orderDetails.OrderId);
                return false;
            }

            // Create the complete order
            var order = orderDetails;

            var result = await _orderRepository.CreateOrderAsync(order);
            
            if (result)
            {
                _logger.LogInformation("Successfully created supplier request for order {OrderId}", orderDetails.OrderId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier request for order {OrderId}", orderDetails.OrderId);
            return false;
        }
    }

    public async Task<bool> SendSupplierInvitationAsync(string body, string supplierEmail)
    {
        try
        {
            // This would typically send an actual email, but for now we'll simulate it
            var emailSent = await _emailService.SendEmailAsync(supplierEmail, "Supplier Invitation", body);
            
            if (emailSent)
            {
                _logger.LogInformation("Successfully sent invitation email to {SupplierEmail}", supplierEmail);
            }
            
            return emailSent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invitation email to {SupplierEmail}", supplierEmail);
            return false;
        }
    }

    public async Task<bool> ApplyToRequestAsync(string orderId, string lei)
    {
        try
        {
            var order = await _orderRepository.GetOrderByIdAsync(orderId);
            if (order == null)
            {
                _logger.LogWarning("Order {OrderId} not found", orderId);
                return false;
            }

            // Check if any supplier has already applied
            var appliedCount = order.Candidates.Count(c => c.Applied);
            if (appliedCount > 0)
            {
                _logger.LogWarning("Order {OrderId} already has an applied supplier", orderId);
                return false;
            }

            // Find the supplier candidate by LEI and mark as applied
            var supplier = order.Candidates.FirstOrDefault(c => c.Lei.Equals(lei, StringComparison.OrdinalIgnoreCase));
            if (supplier == null)
            {
                _logger.LogWarning("Supplier with LEI {Lei} not found in candidates for order {OrderId}", lei, orderId);
                return false;
            }

            supplier.Applied = true;
            var updateResult = await _orderRepository.UpdateOrderAsync(order);
            
            if (updateResult)
            {
                _logger.LogInformation("Supplier with LEI {Lei} successfully applied to order {OrderId}", lei, orderId);
            }
            
            return updateResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying supplier with LEI {Lei} to order {OrderId}", lei, orderId);
            return false;
        }
    }

    public async Task<OrderDetails?> GetOrderDetailsAsync(string orderId)
    {
        try
        {
            return await _orderRepository.GetOrderByIdAsync(orderId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order details for {OrderId}", orderId);
            return null;
        }
    }

    public async Task<List<OrderDetails>> GetOrderListAsync(string lei)
    {
        try
        {
            return await _orderRepository.GetOrdersByLeiAsync(lei);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for LEI {Lei}", lei);
            return new List<OrderDetails>();
        }
    }

    public async Task<List<OrderDetails>> GetOrdersForSupplierAsync(string supplierLei)
    {
        try
        {
            return await _orderRepository.GetOrdersForSupplierByLeiAsync(supplierLei);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for supplier LEI {SupplierLei}", supplierLei);
            return new List<OrderDetails>();
        }
    }
}