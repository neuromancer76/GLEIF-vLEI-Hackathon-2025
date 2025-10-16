import React, { useState, useEffect } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal } from '../components/ErrorModal';
import type { OrderSummary, ApiError, CompanyData } from '../types/api';

export interface OrdersListProps {
  company: CompanyData;
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ 
  company, 
  onSelectOrder, 
  onCreateOrder 
}) => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    loadOrders();
  }, [company.lei]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const ordersData = await SupplierApiService.getOrders(company.lei);
      console.log('Loaded orders:', ordersData);
      
      // Ensure ordersData is an array
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else {
        console.warn('Expected array of orders, got:', ordersData);
        setOrders([]); // Set empty array as fallback
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err as ApiError);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-lg">
        <div>
          <h1>Orders Dashboard</h1>
          <p>Manage your procurement orders</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-lg">
          <div className="loading"></div>
          <p className="mt-sm">Loading orders...</p>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="card">
          <div className="card-body text-center">
            <h3>No Orders Found</h3>
            <p>You haven't created any orders yet.</p>
            <button 
              className="btn btn-primary mt-md"
              onClick={onCreateOrder}
            >
              Create New Order
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2>Your Orders ({orders?.length || 0})</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Description</th>
                  <th>Total Amount</th>
                  <th>Created Date</th>
                  <th>Candidates</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(orders || []).map((order) => (
                  <tr key={order.orderId || Math.random()}>
                    <td>
                      <strong>{order.orderId || 'N/A'}</strong>
                    </td>
                    <td>{order.description || 'No description'}</td>
                    <td>{formatAmount(order.totalAmount || '0')}</td>
                    <td>{formatDate(order.createdAt || new Date().toISOString())}</td>
                    <td>
                      <span className="badge">
                        {order.candidatesCount} suppliers
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${order.appliedCount > 0 ? 'badge-success' : 'badge-secondary'}`}>
                        {order.appliedCount} applied
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => onSelectOrder(order.orderId)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ErrorModal 
        error={error} 
        onClose={() => setError(null)} 
      />
    </div>
  );
};