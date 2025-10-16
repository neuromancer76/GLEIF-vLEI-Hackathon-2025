using supplier_bff.Models;

namespace supplier_bff.Services
{
    public interface INotificationService
    {
        Task AddOrderNotificationAsync(string orderId, string description, string requesterLei);
        Task<List<OrderNotification>> GetUnreadNotificationsAsync(string userLei);
        Task MarkNotificationAsReadAsync(string notificationId);
        Task MarkAllNotificationsAsReadAsync(string userLei);
        Task<int> GetUnreadCountAsync(string userLei);
    }

    public class NotificationService : INotificationService
    {
        private static readonly List<OrderNotification> _notifications = new();
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger)
        {
            _logger = logger;
        }

        public async Task AddOrderNotificationAsync(string orderId, string description, string requesterLei)
        {
            var notification = new OrderNotification
            {
                Id = Guid.NewGuid().ToString(),
                OrderId = orderId,
                Description = description,
                RequesterLei = requesterLei,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _notifications.Add(notification);
            
            _logger.LogInformation("📢 New order notification added: OrderId={OrderId}, RequesterLei={RequesterLei}", 
                orderId, requesterLei);

            await Task.CompletedTask;
        }

        public async Task<List<OrderNotification>> GetUnreadNotificationsAsync(string userLei)
        {
            var unreadNotifications = _notifications
                .Where(n => n.RequesterLei == userLei && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();

            _logger.LogInformation("📋 Retrieved {Count} unread notifications for LEI: {UserLei}", 
                unreadNotifications.Count, userLei);

            await Task.CompletedTask;
            return unreadNotifications;
        }

        public async Task MarkNotificationAsReadAsync(string notificationId)
        {
            var notification = _notifications.FirstOrDefault(n => n.Id == notificationId);
            if (notification != null)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                
                _logger.LogInformation("✅ Marked notification as read: {NotificationId}", notificationId);
            }

            await Task.CompletedTask;
        }

        public async Task MarkAllNotificationsAsReadAsync(string userLei)
        {
            var userNotifications = _notifications.Where(n => n.RequesterLei == userLei && !n.IsRead);
            foreach (var notification in userNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            var count = userNotifications.Count();
            _logger.LogInformation("✅ Marked {Count} notifications as read for LEI: {UserLei}", count, userLei);

            await Task.CompletedTask;
        }

        public async Task<int> GetUnreadCountAsync(string userLei)
        {
            var count = _notifications.Count(n => n.RequesterLei == userLei && !n.IsRead);
            
            _logger.LogInformation("🔢 Unread notification count for LEI {UserLei}: {Count}", userLei, count);

            await Task.CompletedTask;
            return count;
        }
    }
}