/**
 * Risk Lens Credential interfaces and types
 */

export interface RiskIndicator {
  /** Risk assessment score or rating */
  score: number;
  /** Risk category or type */
  category: string;
  /** Additional risk metadata */
  metadata?: Record<string, any>;
}

export interface CreditLimit {
  /** Credit limit amount */
  amount: number;
  /** Currency code (e.g., USD, EUR) */
  currency: string;
  /** Credit limit type or classification */
  type?: string;
}

export interface RiskLensCredentialRequest {
  /** Risk indicator information */
  riskIndicator: RiskIndicator;
  /** Credit limit information */
  creditLimit: CreditLimit;
  /** AID (Agent Identifier) of the destination entity */
  aid: string;
}

export interface RevokeCredentialRequest {
  /** SAID (Self-Addressing Identifier) of the credential to revoke */
  said: string;
}

export interface AssignCredentialRequest {
  /** Target AID (Agent Identifier) to assign the credential to */
  targetAid: string;
}

export interface CredentialResponse {
  /** Success status */
  success: boolean;
  /** Response message */
  message: string;
  /** Credential data or identifier */
  data?: {
    credentialId?: string;
    said?: string;
    issuedAt?: string;
    revokedAt?: string;
    assignedAt?: string;
    targetAid?: string;
  };
}

export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: any;
}

export interface ApiResponse<T = any> {
  /** Success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information */
  error?: ApiError;
  /** Response timestamp */
  timestamp: string;
}