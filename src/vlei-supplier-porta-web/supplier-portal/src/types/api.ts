// API Types based on OpenAPI specification

export interface CompanyRequester {
  prefix: string | null;
  lei: string | null;
  oobi: string | null;
}

// Address structure from GLEIF API
export interface CompanyAddress {
  addressLines: string[];
  city: string;
  region: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

// New interface for company data response from BFF
export interface CompanyData {
  lei: string;
  legalName: string;
  language: string;
  status: string;
  jurisdiction: string;
  creationDate: string;
  primaryAddress: CompanyAddress;
  alternativeNames: string[];
  retrievedAt: string;
  // Computed fields for backward compatibility
  companyName?: string;
  address?: string;
  prefix?: string;
  oobi?: string;
}



export interface SupplierCandidate {
  lei: string | null;
  supplierEmail: string | null;
  applied: boolean;
}

// Enhanced interfaces for UI display with loaded company data
export interface EnhancedCompanyRequester extends CompanyRequester {
  companyData?: CompanyData;
}

export interface EnhancedSupplierCandidate extends SupplierCandidate {
  companyData?: CompanyData;
}

export interface OrderDetails {
  orderId: string;
  description: string;
  totalAmount: string;
  requester: CompanyRequester;
  candidates: SupplierCandidate[];
  createdAt: string;
}

export interface CreateSupplierRequestDto {
  orderDetails: OrderDetails;
}

export interface SendSupplierInvitationDto {
  body: string;
  supplierEmail: string;
}

// Additional types for UI components
export interface OrderSummary {
  orderId: string;
  description: string;
  totalAmount: string;
  createdAt: string;
  candidatesCount: number;
  appliedCount: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface SupplierLinkParams {
  orderId: string;
  supplierEmail: string;
}

export interface ApplicationDetails {
  credentialSchemaAid?: string;
  requiredRiskSchemaCredentialAid?: string;
  [key: string]: any; // Flexible structure for additional application details
}

// Notification types
export interface OrderNotification {
  id: string;
  orderId: string;
  description: string;
  requesterLei: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
}