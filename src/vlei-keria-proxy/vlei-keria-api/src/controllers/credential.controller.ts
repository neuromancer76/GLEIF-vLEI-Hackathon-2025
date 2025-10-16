import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { CredentialService } from '../services';
import { 
  RiskLensCredentialRequest, 
  RevokeCredentialRequest,
  AssignCredentialRequest,
  ApiResponse 
} from '../types';

/**
 * Controller for handling credential-related API endpoints
 */
export class CredentialController {
  private credentialService: CredentialService;

  constructor() {
    this.credentialService = new CredentialService();
  }

  /**
   * Issues a Risk Lens credential
   * POST /api/v1/credentials/issue-risk-lens
   */
  async issueRiskLensCredentials(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const request: RiskLensCredentialRequest = req.body;

      // Call the service to issue the credential
      const result = await this.credentialService.issueRiskLensCredentials(request);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        error: result.success ? undefined : {
          code: 'CREDENTIAL_ISSUANCE_ERROR',
          message: result.message
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 201 : 500;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in issueRiskLensCredentials controller:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while issuing the credential'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Revokes a credential
   * DELETE /api/v1/credentials/revoke
   */
  async revokeCredential(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const request: RevokeCredentialRequest = req.body;

      // Call the service to revoke the credential
      const result = await this.credentialService.revokeCredential(request);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        error: result.success ? undefined : {
          code: 'CREDENTIAL_REVOCATION_ERROR',
          message: result.message
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 500;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in revokeCredential controller:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while revoking the credential'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Assigns a credential to an application
   * POST /api/v1/credentials/assign-to-application
   */
  async assignCredentialToApplication(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          },
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }

      const request: AssignCredentialRequest = req.body;

      // Call the service to assign the credential
      const result = await this.credentialService.assignCredentialToApplication(request);

      const response: ApiResponse = {
        success: result.success,
        data: result.data,
        error: result.success ? undefined : {
          code: 'CREDENTIAL_ASSIGNMENT_ERROR',
          message: result.message
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 500;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Error in assignCredentialToApplication controller:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while assigning the credential'
        },
        timestamp: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Health check endpoint
   * GET /api/v1/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        service: 'VLEI KERIA API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  }
}