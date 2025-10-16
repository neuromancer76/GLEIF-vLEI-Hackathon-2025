import { useState, useEffect, useCallback } from 'react';
import { SupplierApiService } from '../services/apiService';
import type { OrderNotification } from '../types/api';

export const useNotifications = (userLei: string) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificationCount = useCallback(async () => {
    if (!userLei) {
      console.log('useNotifications: No userLei provided');
      return;
    }
    
    try {
      console.log('useNotifications: Fetching count for LEI:', userLei);
      const result = await SupplierApiService.getNotificationCount(userLei);
      console.log('useNotifications: Received count:', result.count);
      setNotificationCount(result.count);
    } catch (err) {
      console.error('Error fetching notification count:', err);
      setError('Failed to fetch notification count');
      // Set count to 0 on error so badge still shows
      setNotificationCount(0);
    }
  }, [userLei]);

  const fetchNotifications = useCallback(async () => {
    if (!userLei) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await SupplierApiService.getNotifications(userLei);
      setNotifications(result);
      setNotificationCount(result.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userLei]);

  const markAllAsRead = useCallback(async () => {
    if (!userLei) return;
    
    try {
      await SupplierApiService.markAllNotificationsAsRead(userLei);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setNotificationCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark notifications as read');
    }
  }, [userLei]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await SupplierApiService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ));
      
      // Update count
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Auto-refresh notification count every 30 seconds
  useEffect(() => {
    if (userLei) {
      fetchNotificationCount();
      const interval = setInterval(fetchNotificationCount, 3000);
      return () => clearInterval(interval);
    }
  }, [userLei, fetchNotificationCount]);

  // Manual refresh function for immediate updates (e.g., after creating an order)
  const refresh = useCallback(() => {
    fetchNotificationCount();
    fetchNotifications();
  }, [fetchNotificationCount, fetchNotifications]);

  return {
    notifications,
    notificationCount,
    isLoading,
    error,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    refresh
  };
};