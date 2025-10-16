import React from 'react';
import type { OrderNotification } from '../types/api';
import '../styles/notifications.css';

interface NotificationsPanelProps {
  notifications: OrderNotification[];
  isLoading: boolean;
  error: string | null;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  isLoading,
  error,
  onMarkAllAsRead,
  onMarkAsRead,
  onClose,
  onViewOrder
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <div className="notifications-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
            </svg>
            <h3>Notifications</h3>
            <span className="notification-badge">{notifications.filter(n => !n.isRead).length}</span>
          </div>
          <div className="notifications-actions">
            {notifications.filter(n => !n.isRead).length > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                Mark all read
              </button>
            )}
            <button 
              className="close-btn"
              onClick={onClose}
              title="Close notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="notifications-content">
          {isLoading && (
            <div className="notifications-loading">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          )}
          
          {error && (
            <div className="notifications-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" fill="currentColor"/>
              </svg>
              <p>{error}</p>
            </div>
          )}
          
          {!isLoading && !error && notifications.length === 0 && (
            <div className="notifications-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
              </svg>
              <p>No new notifications</p>
              <small>You're all caught up!</small>
            </div>
          )}
          
          {!isLoading && !error && notifications.length > 0 && (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      <strong>New Order Created</strong>
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className="notification-description">{notification.description}</p>
                    <div className="notification-details">
                      <small>Order ID: {notification.orderId}</small>
                    </div>
                  </div>
                  <div className="notification-actions">
                    <button 
                      className="view-order-btn"
                      onClick={() => onViewOrder(notification.orderId)}
                      title="View order details"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z" fill="currentColor"/>
                      </svg>
                      View
                    </button>
                    {!notification.isRead && (
                      <button 
                        className="mark-read-btn"
                        onClick={() => onMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};