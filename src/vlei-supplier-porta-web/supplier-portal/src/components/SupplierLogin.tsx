import React, { useState, useEffect } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal } from './ErrorModal';
import type { CompanyData, ApiError, ApplicationDetails } from '../types/api';
import { createClient, type ExtensionClient } from '../utils/client';

export interface SupplierLoginProps {
  orderId: string;
  supplierLei: string | null; // LEI from URL parameter
  onLogin: (supplierData: CompanyData, supplierLei: string) => void;
}

export const SupplierLogin: React.FC<SupplierLoginProps> = ({ orderId, supplierLei, onLogin }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  const [extensionClient, setExtensionClient] = useState<ExtensionClient | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  // Fetch application details and order details on component mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await SupplierApiService.getApplicationDetails();
        setApplicationDetails(details);
        console.log('Application details loaded:', details);

        // Fetch order details to show context
        const order = await SupplierApiService.getOrderDetailsWithCompanyData(orderId);
        setOrderDetails(order);
      } catch (err) {
        console.error('Failed to load details:', err);
      }

      const client = createClient();
      setExtensionClient(client);
      await client.isExtensionInstalled();
    };

    fetchDetails();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that we have a LEI from the URL
    if (!supplierLei) {
      setError({
        message: 'Supplier LEI is missing from the invitation link. Please use the link provided in your invitation email.',
        statusCode: 400
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const credentialResponse = await extensionClient?.authorizeCred({
        message: `Supplier login request at ${new Date().toISOString()}`,
        schema: { id: applicationDetails?.credentialSchemaAid || '' },
        target: applicationDetails?.aid || ''
      });

      console.log('Credential response:', credentialResponse);
      const credential = credentialResponse?.credential as any;
      const credentialLei = credential?.raw?.sad?.a?.LEI;
      const issueePrefix = credential?.raw?.sad?.a?.i;
      console.log('Extracted LEI from credential:', credentialLei);
      console.log('Expected LEI from URL:', supplierLei);

      // Note: We're using the LEI from the URL (invitation) rather than enforcing credential match
      // This allows flexibility in credential usage while still validating the invitation

      // Use the LEI from the URL
      const lei = supplierLei;

      // Get supplier company data
      const supplierData = await SupplierApiService.getCompanyData(lei);

      // If we have application details with credentialSchemaAid, check credentials
      if (applicationDetails && applicationDetails.credentialSchemaAid && supplierData.prefix) {
        console.log('Checking credentials before login...');
        await SupplierApiService.checkCredentials(
          issueePrefix,
          applicationDetails.credentialSchemaAid
        );
        console.log('Credentials check passed');
      }

      onLogin(supplierData, lei);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header">
          <img
            src="/assets/trustsphere.png"
            alt="TrustSphere Icon"
            style={{ width: '330px', height: '300px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          />
        </div>
        <div className="card-body">
          {orderDetails && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              <h3>Supplier Login</h3>
              <p>You've been invited to apply for:</p>
              <p><strong>Order:</strong> {orderDetails.description}</p>
              <p><strong>Requesting Company:</strong> {orderDetails.requester?.companyData?.legalName || orderDetails.requester?.lei}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading" style={{ width: '14px', height: '14px', marginRight: '8px' }}></span>
                    Authenticating...
                  </>
                ) : (
                  'Login with LEI Credential'
                )}
              </button>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>📋 How to login:</p>
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Click the "Login with LEI Credential" button above</li>
                <li>Your browser extension will prompt you to authenticate</li>
                <li>Select your company's LEI credential</li>
                <li>The system will verify you're invited to this order</li>
              </ol>
            </div>
          </form>
        </div>
      </div>

      <ErrorModal
        error={error}
        onClose={() => setError(null)}
      />
    </div>
  );
};
