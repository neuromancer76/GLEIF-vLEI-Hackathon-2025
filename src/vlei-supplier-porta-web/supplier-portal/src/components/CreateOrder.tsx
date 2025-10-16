import React, { useState } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal, SuccessModal } from '../components/ErrorModal';
import type { CreateSupplierRequestDto, OrderDetails, SupplierCandidate, CompanyData, ApiError } from '../types/api';

export interface CreateOrderProps {
  company: CompanyData;
  onBack: () => void;
  onOrderCreated: () => void;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ 
  company, 
  onBack, 
  onOrderCreated 
}) => {
  const [orderData, setOrderData] = useState({
    orderId: '',
    description: '',
    totalAmount: ''
  });
  
  const [suppliers, setSuppliers] = useState<SupplierCandidate[]>([]);
  const [newSupplier, setNewSupplier] = useState<SupplierCandidate>({
    lei: '',
    supplierEmail: '',
    applied: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState('');

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSupplier = () => {
    if (!newSupplier.supplierEmail) {
      setError({
        message: 'Please fill in the supplier email',
        statusCode: 400
      });
      return;
    }

    setSuppliers(prev => [...prev, { ...newSupplier }]);
    setNewSupplier({
      lei: '',
      supplierEmail: '',
      applied: false
    });
  };

  const removeSupplier = (index: number) => {
    setSuppliers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderData.orderId || !orderData.description || !orderData.totalAmount) {
      setError({
        message: 'Please fill in all order fields',
        statusCode: 400
      });
      return;
    }

    if (suppliers.length === 0) {
      setError({
        message: 'Please add at least one supplier candidate',
        statusCode: 400
      });
      return;
    }

    try {
      setLoading(true);
      
      const orderDetails: OrderDetails = {
        orderId: orderData.orderId,
        description: orderData.description,
        totalAmount: orderData.totalAmount,
        requester: {
          prefix: company.prefix || null,
          oobi: company.oobi || null,
          lei: company.lei
        },
        candidates: suppliers,
        createdAt: new Date().toISOString()
      };

      const request: CreateSupplierRequestDto = {
        orderDetails
      };

      await SupplierApiService.createSupplierRequest(request);
      setSuccess('Order created successfully!');
      
      // Reset form
      setOrderData({ orderId: '', description: '', totalAmount: '' });
      setSuppliers([]);
      
      setTimeout(() => {
        onOrderCreated();
      }, 2000);
      
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-lg">
        <h1>Create New Order</h1>
        <button className="btn btn-secondary" onClick={onBack}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Order Details */}
        <div className="card mb-lg">
          <div className="card-header">
            <h2>Order Information</h2>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="orderId">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    id="orderId"
                    name="orderId"
                    className="form-input"
                    value={orderData.orderId}
                    onChange={handleOrderChange}
                    required
                    placeholder="Enter unique order ID"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="totalAmount">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    className="form-input"
                    value={orderData.totalAmount}
                    onChange={handleOrderChange}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                value={orderData.description}
                onChange={handleOrderChange}
                required
                placeholder="Enter detailed order description"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Add Supplier Section */}
        <div className="card mb-lg">
          <div className="card-header">
            <h2>Add Supplier Candidates</h2>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="supplierLei">
                    LEI (Optional)
                  </label>
                  <input
                    type="text"
                    id="supplierLei"
                    name="lei"
                    className="form-input"
                    value={newSupplier.lei || ''}
                    onChange={handleSupplierChange}
                    placeholder="Enter LEI (if known)"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label" htmlFor="supplierEmail">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="supplierEmail"
                    name="supplierEmail"
                    className="form-input"
                    value={newSupplier.supplierEmail || ''}
                    onChange={handleSupplierChange}
                    placeholder="supplier@example.com"
                  />
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={addSupplier}
            >
              Add Supplier
            </button>
          </div>
        </div>

        {/* Suppliers List */}
        {suppliers.length > 0 && (
          <div className="card mb-lg">
            <div className="card-header">
              <h2>Added Suppliers ({suppliers.length})</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>LEI</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier, index) => (
                    <tr key={index}>
                      <td><strong>{supplier.supplierEmail}</strong></td>
                      <td>{supplier.lei || '-'}</td>
                      <td>
                        <button 
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeSupplier(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="text-center">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: '200px' }}
          >
            {loading ? (
              <>
                <span className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }}></span>
                Creating Order...
              </>
            ) : (
              'Create Order'
            )}
          </button>
        </div>
      </form>

      <ErrorModal 
        error={error} 
        onClose={() => setError(null)} 
      />
      
      <SuccessModal 
        message={success}
        isVisible={!!success}
        onClose={() => setSuccess('')}
      />
    </div>
  );
};