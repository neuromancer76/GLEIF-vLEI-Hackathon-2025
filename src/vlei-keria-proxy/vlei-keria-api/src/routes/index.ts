import { Router } from 'express';
import credentialsRouter from './credentials';
import { CredentialController } from '../controllers';

const router = Router();
const credentialController = new CredentialController();

// Health check endpoint
router.get('/health', credentialController.healthCheck.bind(credentialController));

// Credentials routes
router.use('/credentials', credentialsRouter);

export default router;