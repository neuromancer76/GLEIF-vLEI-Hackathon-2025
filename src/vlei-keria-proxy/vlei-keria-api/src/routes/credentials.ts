import { Router } from 'express';
import { CredentialController } from '../controllers';
import { validateRiskLensCredential, validateRevokeCredential, validateAssignCredential } from '../middleware';

const router = Router();
const credentialController = new CredentialController();

/**
 * @route POST /credentials/issue-risk-lens
 * @desc Issue a Risk Lens credential
 * @access Public (add authentication as needed)
 */
router.post(
  '/issue-risk-lens',
  validateRiskLensCredential,
  credentialController.issueRiskLensCredentials.bind(credentialController)
);

/**
 * @route DELETE /credentials/revoke
 * @desc Revoke a credential using its SAID
 * @access Public (add authentication as needed)
 */
router.delete(
  '/revoke',
  validateRevokeCredential,
  credentialController.revokeCredential.bind(credentialController)
);

/**
 * @route POST /credentials/assign-to-application
 * @desc Assign a credential to an application
 * @access Public (add authentication as needed)
 */
router.post(
  '/assign-to-application',
  validateAssignCredential,
  credentialController.assignCredentialToApplication.bind(credentialController)
);

export default router;