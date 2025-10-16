import React from 'react';
import { CredentialCard } from '@components/credentialCard';
import { CredentialRequestCard } from '@components/credentialRequestCard';

// Example usage of CredentialCard with logo
const exampleCredential = {
  issueeName: "John Doe",
  ancatc: [],
  sad: { 
    a: { 
      i: "test-id", 
      employeeId: "EMP-12345",
      department: "Engineering", 
      position: "Senior Developer",
      validUntil: "2025-12-31",
      d: "test-digest",
      dt: "2024-01-01T00:00:00.000Z"
    }, 
    d: "test-digest" 
  },
  schema: {
    id: "EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zSdAiN0oBHLVvksBv", // ACME Corporation schema ID
    title: "Employee Identity Credential",
    credentialType: "EmployeeCredential",
    description: "Official employee identity verification"
  },
  status: {
    et: "iss"
  }
};

// Example usage of CredentialRequestCard with logo  
const exampleRequest = {
  title: "Legal Entity Credential Request",
  description: "Request for official legal entity verification",
  schemaId: "LE", // Legal Entity schema ID
  values: {
    entityName: "Example Corp",
    jurisdiction: "US-CA"
  },
  issuerName: "GLEIF",
  issuerAidPrefix: "test-prefix",
  grantSaid: "test-grant"
};

export function LogoDemo() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2>Credential Card with ACME Logo</h2>
      <CredentialCard credential={exampleCredential} />
      
      <h2>Credential Request Card with GLEIF Logo</h2>
      <CredentialRequestCard 
        request={exampleRequest} 
        onApprove={(issuerName, issuerAidPrefix, grantSaid) => {
          console.log('Approved:', issuerName, issuerAidPrefix, grantSaid);
        }}
      />
    </div>
  );
}