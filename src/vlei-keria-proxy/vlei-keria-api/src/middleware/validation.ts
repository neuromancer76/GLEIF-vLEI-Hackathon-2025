import { body } from 'express-validator';

/**
 * Validation middleware for Risk Lens credential issuance
 */
export const validateRiskLensCredential = [
  body('riskIndicator')
    .exists()
    .withMessage('Risk indicator is required')
    .isObject()
    .withMessage('Risk indicator must be an object'),
  
  body('riskIndicator.score')
    .exists()
    .withMessage('Risk indicator score is required')
    .isNumeric()
    .withMessage('Risk indicator score must be a number'),
  
  body('riskIndicator.category')
    .exists()
    .withMessage('Risk indicator category is required')
    .isString()
    .withMessage('Risk indicator category must be a string')
    .notEmpty()
    .withMessage('Risk indicator category cannot be empty'),
  
  body('creditLimit')
    .exists()
    .withMessage('Credit limit is required')
    .isObject()
    .withMessage('Credit limit must be an object'),
  
  body('creditLimit.amount')
    .exists()
    .withMessage('Credit limit amount is required')
    .isNumeric()
    .withMessage('Credit limit amount must be a number')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Credit limit amount must be non-negative');
      }
      return true;
    }),
  
  body('creditLimit.currency')
    .exists()
    .withMessage('Credit limit currency is required')
    .isString()
    .withMessage('Credit limit currency must be a string')
    .notEmpty()
    .withMessage('Credit limit currency cannot be empty')
    .isLength({ min: 3, max: 3 })
    .withMessage('Credit limit currency must be a 3-letter currency code'),
  
  body('aid')
    .exists()
    .withMessage('AID (Agent Identifier) is required')
    .isString()
    .withMessage('AID must be a string')
    .notEmpty()
    .withMessage('AID cannot be empty')
    .isLength({ min: 1 })
    .withMessage('AID must be at least 1 character long')
];

/**
 * Validation middleware for credential revocation
 */
export const validateRevokeCredential = [
  body('said')
    .exists()
    .withMessage('SAID (Self-Addressing Identifier) is required')
    .isString()
    .withMessage('SAID must be a string')
    .notEmpty()
    .withMessage('SAID cannot be empty')
    .isLength({ min: 1 })
    .withMessage('SAID must be at least 1 character long')
    // Additional SAID format validation can be added here based on actual SAID format requirements
];

/**
 * Validation middleware for assigning credential to application
 */
export const validateAssignCredential = [
  body('targetAid')
    .exists()
    .withMessage('Target AID (Agent Identifier) is required')
    .isString()
    .withMessage('Target AID must be a string')
    .notEmpty()
    .withMessage('Target AID cannot be empty')
    .isLength({ min: 1 })
    .withMessage('Target AID must be at least 1 character long')
    // Additional AID format validation can be added here based on actual AID format requirements
];
