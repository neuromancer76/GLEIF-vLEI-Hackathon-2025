import React, { useState, useEffect } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal, SuccessModal } from '../components/ErrorModal';
import type { OrderDetails, ApiError, EnhancedCompanyRequester, EnhancedSupplierCandidate, ApplicationDetails } from '../types/api';
import { createClient, type ExtensionClient } from '../utils/client';

export interface SupplierPortalProps {
  orderId: string;
  supplierLei: string;
}

export const SupplierPortal: React.FC<SupplierPortalProps> = ({ 
  orderId, 
  supplierLei 
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails & { 
    requester: EnhancedCompanyRequester; 
    candidates: EnhancedSupplierCandidate[] 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  const [extensionClient, setExtensionClient] = useState<ExtensionClient | null>(null);

  useEffect(() => {
    loadOrderDetails();
    initializeExtension();
  }, [orderId]);

  const initializeExtension = async () => {
    try {
      const details = await SupplierApiService.getApplicationDetails();
      setApplicationDetails(details);
      console.log('Application details loaded:', details);

      const client = createClient();
      setExtensionClient(client);
      await client.isExtensionInstalled();
    } catch (err) {
      console.error('Failed to initialize extension:', err);
    }
  };

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const details = await SupplierApiService.getOrderDetailsWithCompanyData(orderId);
      setOrderDetails(details);
      
      // Check if this supplier has already applied
      const currentSupplier = details.candidates?.find(
        candidate => candidate.lei === supplierLei
      );
      setHasApplied(currentSupplier?.applied || false);
      
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError(null);

      // Step 1: Request credential from extension
      const credentialResponse = await extensionClient?.authorizeCred({
        message: `Supplier application request at ${new Date().toISOString()}`,
        schema: { id: applicationDetails?.requiredRiskSchemaCredentialAid || '' },
        target: applicationDetails?.aid || ''
      });

      console.log('Credential response:', credentialResponse);
      const credential = credentialResponse?.credential as any;
      const issueePrefix = credential?.raw?.sad?.a?.i;
      console.log('Extracted prefix from credential:', issueePrefix);

      // Step 2: Check credentials
      if (applicationDetails && applicationDetails.requiredRiskSchemaCredentialAid) {
        console.log('Checking credentials...');
        await SupplierApiService.checkCredentials(
          issueePrefix,
          applicationDetails.requiredRiskSchemaCredentialAid
        );
        console.log('Credentials check passed');
      }

      // Step 3: Submit application
      await SupplierApiService.applyAsSupplier(orderId, supplierLei);
      setSuccess('Your application has been submitted successfully!');
      setHasApplied(true);
      
      // Reload order details to show updated status
      await loadOrderDetails();
      
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setApplying(false);
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

  const getCurrentSupplier = (): EnhancedSupplierCandidate | undefined => {
    return orderDetails?.candidates?.find(
      candidate => candidate.lei === supplierLei
    );
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
            <p>The requested order could not be found or you may not have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentSupplier = getCurrentSupplier();
  
  if (!currentSupplier) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <h3>Access Denied</h3>
            <p>You are not listed as a candidate for this order.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="text-center mb-lg">
        <h1>Supplier Application Portal</h1>
        <p>Welcome, <strong>{currentSupplier.companyData?.legalName || currentSupplier.supplierEmail || 'Supplier'}</strong></p>
      </div>

      {/* Application Status */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2>Application Status</h2>
        </div>
        <div className="card-body text-center">
          {hasApplied ? (
            <div className="alert alert-success">
              <h3>✓ Application Submitted</h3>
              <p>You have successfully applied to this order. The company will review your application and contact you if selected.</p>
            </div>
          ) : (
            <div className="alert alert-info">
              <h3>📋 Application Pending</h3>
              <p>You have been invited to apply for this order. Review the details below and submit your application.</p>
            </div>
          )}
        </div>
      </div>

      {/* Application Action - Compact Version */}
      {!hasApplied && (
        <div className="card mb-lg">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '18px' }}>Ready to Apply?</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Click "Apply Now" to authenticate and submit your application.
                </p>
              </div>
              <div>
                <button 
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={applying}
                  style={{ minWidth: '180px', padding: '0.75rem 1.5rem' }}
                >
                  {applying ? (
                    <>
                      <span className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }}></span>
                      Processing...
                    </>
                  ) : (
                    'Apply Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requester Company - Expanded Information */}
      <div className="card company-info-card mb-lg">
        <div className="card-header">
          <h2>Requesting Company</h2>
        </div>
        <div className="card-body">
          {orderDetails.requester.companyData ? (
            <div className="info-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div className="info-section">
                <h3>General Information</h3>
                <div className="info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="currentColor"/>
                  </svg>
                  <div className="info-content">
                    <label>Legal Name</label>
                    <span>{orderDetails.requester.companyData.legalName}</span>
                  </div>
                </div>
                <div className="info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
                  </svg>
                  <div className="info-content">
                    <label>LEI</label>
                    <span className="lei-code">{orderDetails.requester.lei}</span>
                  </div>
                </div>
              </div>
              <div className="info-section">
                <h3>Address</h3>
                <div className="info-item address-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                  </svg>
                  <div className="address-block">
                    <div>{orderDetails.requester.companyData.primaryAddress.formattedAddress}</div>
                  </div>
                </div>
                <div className="info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" fill="currentColor"/>
                    <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
                  </svg>
                  <div className="info-content">
                    <label>Jurisdiction</label>
                    <span>{orderDetails.requester.companyData.jurisdiction}</span>
                  </div>
                </div>
              </div>
              <div className="info-section">
                <h3>Status</h3>
                <div className="info-item">
                  <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                  </svg>
                  <div className="info-content">
                    <label>Company Status</label>
                    <span className={`badge ${orderDetails.requester.companyData.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>{orderDetails.requester.companyData.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-info">
              <p><strong>LEI:</strong> {orderDetails.requester.lei}</p>
              <p><strong>Prefix:</strong> {orderDetails.requester.prefix}</p>
              <p><em>Company information not available</em></p>
            </div>
          )}
        </div>
      </div>

      {/* Order Information */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2>Order Details</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
              <p><strong>Description:</strong> {orderDetails.description}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Total Amount:</strong> {formatAmount(orderDetails.totalAmount)}</p>
              <p><strong>Created Date:</strong> {formatDate(orderDetails.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Company - Simplified */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2>Your Company</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Company Name:</strong> {currentSupplier.companyData?.legalName || 'Not available'}</p>
              <p><strong>LEI:</strong> <span className="lei-code">{currentSupplier.lei || 'Not provided'}</span></p>
            </div>
            <div className="col-md-6">
              {currentSupplier.companyData?.primaryAddress ? (
                <p><strong>Address:</strong> {currentSupplier.companyData.primaryAddress.formattedAddress}</p>
              ) : (
                <p><strong>Address:</strong> Not available</p>
              )}
              <p><strong>Email:</strong> {currentSupplier.supplierEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competition Info */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2>Competition Status</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Total Candidates:</strong> {orderDetails.candidates?.length || 0}</p>
              <p><strong>Applied Suppliers:</strong> {orderDetails.candidates?.filter(c => c.applied).length || 0}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Your Status:</strong> 
                <span className={`badge ${hasApplied ? 'badge-success' : 'badge-warning'} ml-sm`}>
                  {hasApplied ? 'Applied' : 'Pending'}
                </span>
              </p>
            </div>
          </div>
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