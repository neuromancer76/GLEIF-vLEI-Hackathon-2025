import React, { useState, useEffect } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal, SuccessModal } from '../components/ErrorModal';
import type { OrderDetails, ApiError, SendSupplierInvitationDto, EnhancedCompanyRequester, EnhancedSupplierCandidate } from '../types/api';

export interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetailsComponent: React.FC<OrderDetailsProps> = ({ 
  orderId, 
  onBack 
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails & { 
    requester: EnhancedCompanyRequester; 
    candidates: EnhancedSupplierCandidate[] 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: {general: boolean, address: boolean, technical: boolean}}>({});

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const details = await SupplierApiService.getOrderDetailsWithCompanyData(orderId);
      setOrderDetails(details);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (supplier: EnhancedSupplierCandidate) => {
    if (!supplier.supplierEmail) {
      setError({ message: 'Supplier email is required', statusCode: 400 });
      return;
    }

    try {
      setSendingInvitation(supplier.supplierEmail);
      
      const invitationLink = SupplierApiService.generateSupplierLink(orderId, supplier.supplierEmail);
      
      const supplierName = supplier.companyData?.legalName || supplier.supplierEmail || 'Supplier';
      const requesterName = orderDetails?.requester.companyData?.legalName || 'Company';
      
      const invitation: SendSupplierInvitationDto = {
        body: `Dear ${supplierName},

You have been invited to apply for an order opportunity.

Order Details:
- Order ID: ${orderId}
- Description: ${orderDetails?.description}
- Total Amount: ${formatAmount(orderDetails?.totalAmount || '0')}

Please click the link below to review the order details and apply:
${invitationLink}

Best regards,
${requesterName}`,
        supplierEmail: supplier.supplierEmail || ''
      };

      await SupplierApiService.sendInvitation(invitation);
      setSuccess(`Invitation sent successfully to ${supplierName}`);
      
      // Reload order details to get updated status
      await loadOrderDetails();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSendingInvitation(null);
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

  const toggleSupplier = (lei: string) => {
    if (expandedSupplier === lei) {
      setExpandedSupplier(null);
    } else {
      setExpandedSupplier(lei);
      // Initialize expanded sections for this supplier if not already done
      if (!expandedSections[lei]) {
        setExpandedSections(prev => ({
          ...prev,
          [lei]: { general: false, address: false, technical: false }
        }));
      }
    }
  };

  const toggleSection = (lei: string, section: 'general' | 'address' | 'technical') => {
    setExpandedSections(prev => ({
      ...prev,
      [lei]: {
        ...prev[lei],
        [section]: !prev[lei]?.[section]
      }
    }));
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center p-lg">
          <div className="loading"></div>
          <p className="mt-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <h3>Order Not Found</h3>
            <p>The requested order could not be found.</p>
            <button className="btn btn-primary" onClick={onBack}>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-lg">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Orders
        </button>
      </div>

      {/* Order Information */}
      <div className="card company-info-card mb-lg">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Order Details</h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#ff9900' }}>
                <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
              </svg>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>{orderDetails.candidates?.length || 0}</strong> Total Candidates
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#ff9900' }}>
                <path d="M9 11.75C6.66 11.75 2 12.92 2 15.25V17H16V15.25C16 12.92 11.34 11.75 9 11.75ZM4.34 15C5.18 14.42 7.21 13.75 9 13.75C10.79 13.75 12.82 14.42 13.66 15H4.34ZM9 10C10.93 10 12.5 8.43 12.5 6.5C12.5 4.57 10.93 3 9 3C7.07 3 5.5 4.57 5.5 6.5C5.5 8.43 7.07 10 9 10ZM9 5C9.83 5 10.5 5.67 10.5 6.5C10.5 7.33 9.83 8 9 8C8.17 8 7.5 7.33 7.5 6.5C7.5 5.67 8.17 5 9 5ZM16.04 13.81C17.2 14.65 18 15.77 18 17H22V15.25C22 13.23 18.5 12.08 16.04 13.81ZM15 10C16.93 10 18.5 8.43 18.5 6.5C18.5 4.57 16.93 3 15 3C14.46 3 13.96 3.13 13.5 3.35C14.13 4.24 14.5 5.33 14.5 6.5C14.5 7.67 14.13 8.76 13.5 9.65C13.96 9.87 14.46 10 15 10Z" fill="currentColor"/>
              </svg>
              <span className={`badge ${(orderDetails.candidates?.filter(c => c.applied).length || 0) > 0 ? 'badge-success' : 'badge-secondary'}`}>
                {orderDetails.candidates?.filter(c => c.applied).length || 0} Applied
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* First Row: Order ID, Created Date, Total Amount */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="info-item" style={{ flex: '1', minWidth: '200px' }}>
              <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="currentColor"/>
              </svg>
              <div className="info-content">
                <label>Order ID</label>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{orderDetails.orderId}</span>
              </div>
            </div>

            <div className="info-item" style={{ flex: '1', minWidth: '200px' }}>
              <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3.01 3.9 3.01 5L3 19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10H12V15H7V10Z" fill="currentColor"/>
              </svg>
              <div className="info-content">
                <label>Created Date</label>
                <span>{formatDate(orderDetails.createdAt)}</span>
              </div>
            </div>

            <div className="info-item" style={{ flex: '1', minWidth: '200px' }}>
              <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" fill="currentColor"/>
              </svg>
              <div className="info-content">
                <label>Total Amount</label>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#232f3e' }}>{formatAmount(orderDetails.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Second Row: Description */}
          <div className="info-item">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM6 20V4H13V9H18V20H6ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z" fill="currentColor"/>
            </svg>
            <div className="info-content">
              <label>Description</label>
              <span>{orderDetails.description}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Candidates */}
      <div className="card">
        <div className="card-header">
          <h2>Supplier Candidates</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {!orderDetails.candidates || orderDetails.candidates.length === 0 ? (
            <div className="p-lg text-center">
              <p>No supplier candidates have been added to this order yet.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Email</th>
                  <th>LEI</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.candidates.map((supplier: EnhancedSupplierCandidate, index) => (
                  <React.Fragment key={supplier.lei || index}>
                    <tr 
                      onClick={() => toggleSupplier(supplier.lei || `supplier-${index}`)}
                      style={{ cursor: 'pointer', backgroundColor: expandedSupplier === (supplier.lei || `supplier-${index}`) ? '#f9fafb' : 'transparent' }}
                      className="supplier-row"
                    >
                      <td>
                        <strong>{supplier.companyData?.legalName || 'N/A'}</strong>
                      </td>
                      <td>{supplier.companyData?.primaryAddress?.city || 'N/A'}</td>
                      <td>{supplier.supplierEmail || 'N/A'}</td>
                      <td>{supplier.lei || 'N/A'}</td>
                      <td>
                        <span className={`badge ${supplier.applied ? 'badge-success' : 'badge-secondary'}`}>
                          {supplier.applied ? 'Applied' : 'Invited'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {!supplier.applied && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleSendInvitation(supplier)}
                            disabled={sendingInvitation === supplier.supplierEmail}
                          >
                            {sendingInvitation === supplier.supplierEmail ? (
                              <>
                                <span className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }}></span>
                                Sending...
                              </>
                            ) : (
                              'Send Invitation'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Expanded Supplier Details */}
                    {expandedSupplier === (supplier.lei || `supplier-${index}`) && supplier.companyData && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, backgroundColor: '#f9fafb' }}>
                          <div className="card company-info-card" style={{ margin: '16px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                            <div className="card-header">
                              <h2>{supplier.companyData.legalName}</h2>
                            </div>
                            <div className="card-body">
                              {/* Always Visible: Legal Name */}
                              <div className="info-item" style={{ marginBottom: '20px', background: '#ffffff', border: '1px solid #e5e7eb' }}>
                                <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="currentColor"/>
                                </svg>
                                <div className="info-content">
                                  <label>Legal Name</label>
                                  <span>{supplier.companyData.legalName}</span>
                                </div>
                              </div>

                              <div className="info-grid">
                                {/* General Information - Collapsible */}
                                <div className="info-section">
                                  <h3 
                                    onClick={() => toggleSection(supplier.lei || `supplier-${index}`, 'general')} 
                                    className="collapsible-header"
                                  >
                                    <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 17H13V11H11V17ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 9H13V7H11V9Z" fill="currentColor"/>
                                    </svg>
                                    <span className="section-title">General Information</span>
                                    <span className="toggle-arrow">{expandedSections[supplier.lei || `supplier-${index}`]?.general ? '▼' : '▶'}</span>
                                  </h3>
                                  {expandedSections[supplier.lei || `supplier-${index}`]?.general && (
                                    <>
                                      <div className="info-item">
                                        <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
                                        </svg>
                                        <div className="info-content">
                                          <label>LEI</label>
                                          <span className="lei-code">{supplier.lei}</span>
                                        </div>
                                      </div>
                                      {supplier.companyData.creationDate && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>Creation Date</label>
                                            <span>{formatDate(supplier.companyData.creationDate)}</span>
                                          </div>
                                        </div>
                                      )}
                                      <div className="info-item">
                                        <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" fill="currentColor"/>
                                          <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                                        </svg>
                                        <div className="info-content">
                                          <label>Jurisdiction</label>
                                          <span>{supplier.companyData.jurisdiction}</span>
                                        </div>
                                      </div>
                                      {supplier.companyData.language && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M12.87 15.07L10.33 12.56L10.36 12.53C12.1 10.59 13.34 8.36 14.07 6H17V4H10V2H8V4H1V6H12.17C11.5 7.92 10.44 9.75 9 11.35C8.07 10.32 7.3 9.19 6.69 8H4.69C5.42 9.63 6.42 11.17 7.67 12.56L2.58 17.58L4 19L9 14L12.11 17.11L12.87 15.07ZM18.5 10H16.5L12 22H14L15.12 19H19.87L21 22H23L18.5 10ZM15.88 17L17.5 12.67L19.12 17H15.88Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>Language</label>
                                            <span>{supplier.companyData.language}</span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Address - Collapsible */}
                                <div className="info-section">
                                  <h3 
                                    onClick={() => toggleSection(supplier.lei || `supplier-${index}`, 'address')} 
                                    className="collapsible-header"
                                  >
                                    <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                      <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                                    </svg>
                                    <span className="section-title">Address</span>
                                    <span className="toggle-arrow">{expandedSections[supplier.lei || `supplier-${index}`]?.address ? '▼' : '▶'}</span>
                                  </h3>
                                  {expandedSections[supplier.lei || `supplier-${index}`]?.address && (
                                    <div className="info-item address-item">
                                      <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                                      </svg>
                                      <div className="address-block">
                                        {supplier.companyData.primaryAddress.addressLines?.map((line, idx) => (
                                          <div key={idx}>{line}</div>
                                        ))}
                                        <div>{supplier.companyData.primaryAddress.city}, {supplier.companyData.primaryAddress.region} {supplier.companyData.primaryAddress.postalCode}</div>
                                        <div>{supplier.companyData.primaryAddress.country}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Technical Details - Collapsible */}
                                <div className="info-section">
                                  <h3 
                                    onClick={() => toggleSection(supplier.lei || `supplier-${index}`, 'technical')} 
                                    className="collapsible-header"
                                  >
                                    <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                      <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
                                    </svg>
                                    <span className="section-title">Technical Details</span>
                                    <span className="toggle-arrow">{expandedSections[supplier.lei || `supplier-${index}`]?.technical ? '▼' : '▶'}</span>
                                  </h3>
                                  {expandedSections[supplier.lei || `supplier-${index}`]?.technical && (
                                    <>
                                      {supplier.companyData.alternativeNames && supplier.companyData.alternativeNames.length > 0 && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>Alternative Names</label>
                                            <span>{supplier.companyData.alternativeNames.join(', ')}</span>
                                          </div>
                                        </div>
                                      )}
                                      {supplier.companyData.oobi && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>OOBI</label>
                                            <span className="oobi-code">{supplier.companyData.oobi}</span>
                                          </div>
                                        </div>
                                      )}
                                      {supplier.companyData.prefix && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M9.4 16.6L4.8 12L3.4 13.4L9.4 19.4L20.6 8.2L19.2 6.8L9.4 16.6Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>Prefix</label>
                                            <span className="prefix-code">{supplier.companyData.prefix}</span>
                                          </div>
                                        </div>
                                      )}
                                      {supplier.companyData.status && (
                                        <div className="info-item">
                                          <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                                          </svg>
                                          <div className="info-content">
                                            <label>Status</label>
                                            <span className={`badge ${supplier.companyData.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                                              {supplier.companyData.status}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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