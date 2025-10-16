import React, { useState, useEffect } from 'react';
import { SupplierApiService } from '../services/apiService';
import { ErrorModal } from './ErrorModal';
import type { CompanyData, ApiError, ApplicationDetails } from '../types/api';
import { createClient, type ExtensionClient } from '../utils/client';

export interface CompanyLoginProps {
  onLogin: (company: CompanyData) => void;
}

export const CompanyLogin: React.FC<CompanyLoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  const [extensionClient, setExtensionClient] = useState<ExtensionClient | null>(null);

  // Fetch application details on component mount
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const details = await SupplierApiService.getApplicationDetails();
        setApplicationDetails(details);
        console.log('Application details loaded:', details);
      } catch (err) {
        console.error('Failed to load application details:', err);
        // Not setting error state here as this is a background fetch
        // and shouldn't block the login form
      }

      const client = createClient();
      setExtensionClient(client);
      await client.isExtensionInstalled();
    };

    fetchApplicationDetails();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!lei.trim()) {
    //   setError({
    //     message: 'Please enter a valid LEI',
    //     statusCode: 400
    //   });
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);

      const credentialResponse = await extensionClient?.authorizeCred({
        message: `Login request at ${new Date().toISOString()}`,
        schema: { id: applicationDetails?.credentialSchemaAid || '' },
        target: applicationDetails?.aid || ''
      });

      console.log('Credential response:', credentialResponse);
      const credential = credentialResponse?.credential as any;
      const lei = credential?.raw?.sad?.a?.LEI;
      const issueePrefix = credential?.raw?.sad?.a?.i;
      console.log('Extracted LEI from credential:', lei);
      

      // First, get company data
      const companyData = await SupplierApiService.getCompanyData(lei);

      // If we have application details with credentialSchemaAid, check credentials
      if (applicationDetails && applicationDetails.credentialSchemaAid && companyData.prefix) {
        console.log('Checking credentials before login...');
        await SupplierApiService.checkCredentials(
          issueePrefix, // Using prefix as entityAid
          applicationDetails.credentialSchemaAid
        );
        console.log('Credentials check passed');
      }

      onLogin(companyData);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <div className="card-header">
          <img
                src="/assets/trustsphere.png"
                alt="TrustSphere Icon"
                style={{ width: '330px', height: '300px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
              />
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* <div className="form-group">
              <label className="form-label" htmlFor="lei">
                Legal Entity Identifier (LEI) *
              </label>
              <input
                type="text"
                id="lei"
                name="lei"
                className="form-input"
                value={lei}
                onChange={handleChange}
                required
                placeholder="Enter your company's LEI (e.g., 335800CZZQAMN5PMNQ89)"
                pattern="[A-Z0-9]{20}"
                title="LEI must be 20 characters long and contain only uppercase letters and numbers"
                maxLength={20}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Example: 335800CZZQAMN5PMNQ89
              </small>
            </div> */}

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
                    Fetching Company Data...
                  </>
                ) : (
                  'Login with LEI'
                )}
              </button>
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