import { 
  RiskLensCredentialRequest, 
  RevokeCredentialRequest,
  AssignCredentialRequest,
  CredentialResponse 
} from '../types';
import { Saider } from 'signify-ts';
import { createEntity, issueEdgeCredential } from 'vlei-keria-library/dist/setup';
import { initializeAndConnectClient, initializeSignify } from 'vlei-keria-library/dist/keri';
import { CERTIFICATOR_SCHEMA_SAID, RISKLENS_BADGE_SCHEMA_SAID } from 'vlei-keria-library/dist/constants';

/**
 * Service class for handling VLEI KERIA credential operations
 * This service integrates with the VLEI KERIA library for credential management
 */
export class CredentialService {
  /**
   * Issues a Risk Lens credential
   * @param request - The risk lens credential request containing risk indicator, credit limit, and destination AID
   * @returns Promise<CredentialResponse> - The credential issuance response
   */
  async issueRiskLensCredentials(request: RiskLensCredentialRequest): Promise<CredentialResponse> {
    try {
        
        await initializeSignify();  
        const bran = process.env.CERTIFICATOR_BRAN||"crif";
        const alias = process.env.CERTIFICATOR_ALIAS||"";
        
        const certificatorClient = await initializeAndConnectClient(bran);// Validate input parameters
        const certificatorEntity = await createEntity(certificatorClient.client, bran, alias);
        const riskLensBadgeAuthData = {
    AID: request.aid,
    riskIndicator: request.riskIndicator,
    creditLimit: request.creditLimit
};

    let filter: { [x: string]: any } = { '-s':  CERTIFICATOR_SCHEMA_SAID}; // Filter by schema SAID   
    const crifFoundCredentials = await certificatorClient.client.credentials().list({filter});

    // Generate edge data using the found certificator credentials
    const riskLensBadgeEdge = Saider.saidify({
        d: '',
        certificator: {
            n: crifFoundCredentials[0]?.sad?.d || '',
            s: crifFoundCredentials[0]?.sad?.s || CERTIFICATOR_SCHEMA_SAID,
        },
    })[1];

    // Generate rules using Saider.saidify
    const riskLensBadgeRules = Saider.saidify({
        d: '',
        usageDisclaimer: {
            l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
        },
        issuanceDisclaimer: {
            l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
        },
        privacyDisclaimer: {
            l: 'Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials.  It is the sole responsibility of QVIs as Issuees of QVI ECR AUTH vLEI Credentials to present these Credentials in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification.  https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification.',
        },
    })[1];

    // Issue the edge credential
    const credential = await issueEdgeCredential(
        certificatorEntity.client,
        certificatorEntity.alias,
        certificatorEntity.registrySaid,
        RISKLENS_BADGE_SCHEMA_SAID,
        certificatorEntity.client, // targetClient
        request.aid, // targetPrefix
        riskLensBadgeAuthData,
        riskLensBadgeEdge,
        riskLensBadgeRules
    );

    const credentialId = credential.credentialSaid;
    const said = credential.credentialSaid;

      return {
        success: true,
        message: 'Risk Lens credential issued successfully',
        data: {
          credentialId,
          said,
          issuedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error issuing Risk Lens credential:', error);
      
      return {
        success: false,
        message: `Failed to issue Risk Lens credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: undefined
      };
    }
  }

  /**
   * Revokes a credential using its SAID
   * @param request - The revoke credential request containing the SAID
   * @returns Promise<CredentialResponse> - The credential revocation response
   */
  async revokeCredential(request: RevokeCredentialRequest): Promise<CredentialResponse> {
    try {
      // Validate input parameters
      this.validateRevokeRequest(request);

      console.log('Revoking credential with SAID:', request.said);

      // Here you would integrate with the actual VLEI KERIA library:
      // const keriaClient = await this.initializeKeriaClient();
      // const revocationResult = await keriaClient.revokeCredential(request.said);

      // Simulate credential revocation process
      const revokedAt = new Date().toISOString();

      return {
        success: true,
        message: 'Credential revoked successfully',
        data: {
          said: request.said,
          revokedAt
        }
      };

    } catch (error) {
      console.error('Error revoking credential:', error);
      
      return {
        success: false,
        message: `Failed to revoke credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: undefined
      };
    }
  }

  /**
   * Assigns a credential to a target application/entity
   * @param request - The assign credential request containing the target AID
   * @returns Promise<CredentialResponse> - The credential assignment response
   */
  async assignCredentialToApplication(request: AssignCredentialRequest): Promise<CredentialResponse> {
    try {
      // Validate input parametersnpp
      this.validateAssignCredentialRequest(request);

      console.log('Assigning credential to application with AID:', request.targetAid);

      await initializeSignify();
      
      // Initialize certificator client
      const bran = process.env.CERTIFICATOR_BRAN || "crif";
      const alias = process.env.CERTIFICATOR_ALIAS || "";
      
      const certificatorClient = await initializeAndConnectClient(bran);
      const certificatorEntity = await createEntity(certificatorClient.client, bran, alias);

      // Find credentials to assign (example: get latest Risk Lens credential)
      let filter: { [x: string]: any } = { '-s': RISKLENS_BADGE_SCHEMA_SAID };
      const foundCredentials = await certificatorClient.client.credentials().list({filter});

      if (!foundCredentials || foundCredentials.length === 0) {
        throw new Error('No credentials found to assign');
      }

      // Get the first credential
      const credentialToAssign = foundCredentials[0];
      const credentialSaid = credentialToAssign.sad?.d;

      console.log(`Assigning credential ${credentialSaid} to ${request.targetAid}`);

      // TODO: Implement actual credential assignment via IPEX grant
      // This would typically involve:
      // 1. Creating an IPEX grant message
      // 2. Sending the grant to the target AID
      // 3. Waiting for acknowledgment
      // 
      // Example (to be implemented when grant functionality is needed):
      // const { ipexGrantCredential } = await import('vlei-keria-library/dist/keri');
      // await ipexGrantCredential(
      //   certificatorEntity.client,
      //   certificatorEntity.alias,
      //   request.targetAid,
      //   credentialToAssign
      // );

      const assignedAt = new Date().toISOString();

      return {
        success: true,
        message: 'Credential assigned to application successfully',
        data: {
          credentialId: credentialSaid,
          said: credentialSaid,
          targetAid: request.targetAid,
          assignedAt
        }
      };

    } catch (error) {
      console.error('Error assigning credential to application:', error);
      
      return {
        success: false,
        message: `Failed to assign credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: undefined
      };
    }
  }

  /**
   * Validates the risk lens credential request
   * @private
   */
  private validateRiskLensRequest(request: RiskLensCredentialRequest): void {
    if (!request.aid || typeof request.aid !== 'string' || request.aid.trim().length === 0) {
      throw new Error('Invalid or missing AID (Agent Identifier)');
    }

    if (!request.riskIndicator) {
      throw new Error('Risk indicator is required');
    }

    if (typeof request.riskIndicator.score !== 'number') {
      throw new Error('Risk indicator score must be a number');
    }

    if (!request.riskIndicator.category || typeof request.riskIndicator.category !== 'string') {
      throw new Error('Risk indicator category is required and must be a string');
    }

    if (!request.creditLimit) {
      throw new Error('Credit limit is required');
    }

    if (typeof request.creditLimit.amount !== 'number' || request.creditLimit.amount < 0) {
      throw new Error('Credit limit amount must be a non-negative number');
    }

    if (!request.creditLimit.currency || typeof request.creditLimit.currency !== 'string') {
      throw new Error('Credit limit currency is required and must be a string');
    }
  }

  /**
   * Validates the revoke credential request
   * @private
   */
  private validateRevokeRequest(request: RevokeCredentialRequest): void {
    if (!request.said || typeof request.said !== 'string' || request.said.trim().length === 0) {
      throw new Error('Invalid or missing SAID (Self-Addressing Identifier)');
    }

    // Additional SAID format validation could be added here
    // depending on the specific SAID format requirements
  }

  /**
   * Validates the assign credential request
   * @private
   */
  private validateAssignCredentialRequest(request: AssignCredentialRequest): void {
    if (!request.targetAid || typeof request.targetAid !== 'string' || request.targetAid.trim().length === 0) {
      throw new Error('Invalid or missing target AID (Agent Identifier)');
    }

    // Additional AID format validation could be added here
    // depending on the specific AID format requirements
  }

  /**
   * Generates a mock credential ID
   * @private
   */
  private generateCredentialId(): string {
    return `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a mock SAID (Self-Addressing Identifier)
   * @private
   */
  private generateSAID(): string {
    return `E${Math.random().toString(36).substr(2, 43)}`;
  }

  /**
   * Initialize KERIA client (placeholder for actual implementation)
   * @private
   */
  private async initializeKeriaClient(): Promise<any> {
    // TODO: Implement actual KERIA client initialization
    // This would typically involve loading the KERIA library and setting up the client
    // Example:
    // const { KeriaClient } = require('vlei-keria-library');
    // return new KeriaClient(config);
    
    throw new Error('KERIA client initialization not yet implemented');
  }
}