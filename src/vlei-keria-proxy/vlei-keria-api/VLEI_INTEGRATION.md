# VLEI KERIA Integration Guide

## Overview

The credential service has been updated to integrate with the VLEI KERIA library for Risk Lens credential issuance using the `issueEdgeCredential` function.

## Key Components

### 1. Imports Added

```typescript
import { Saider } from 'vlei-keria-library/node_modules/signify-ts';
import { issueEdgeCredential } from 'vlei-keria-library';
import { RISKLENS_BADGE_SCHEMA_SAID } from 'vlei-keria-library';
```

- **Saider**: Used for generating self-addressing identifiers (SAIDs) for credential rules
- **issueEdgeCredential**: Core function for issuing edge credentials with rules and edge data
- **RISKLENS_BADGE_SCHEMA_SAID**: Schema identifier for Risk Lens Badge credentials

### 2. Risk Lens Badge Rules

The service now generates standardized rules using `Saider.saidify()`:

```typescript
const riskLensBadgeRules = Saider.saidify({
  d: '',
  usageDisclaimer: { l: '...' },
  issuanceDisclaimer: { l: '...' },
  privacyDisclaimer: { l: '...' }
})[1];
```

This creates a self-addressing data structure containing:
- **usageDisclaimer**: Legal disclaimer about credential usage
- **issuanceDisclaimer**: Validation and accuracy statements
- **privacyDisclaimer**: Privacy considerations for credential presentation

### 3. Credential Data Structure

The service prepares credential data from the API request:

```typescript
const riskLensBadgeAuthData = {
  riskIndicator: request.riskIndicator.category,
  creditLimit: request.creditLimit.amount,
};
```

### 4. Edge Credential Issuance (Placeholder)

The integration point for `issueEdgeCredential` is prepared:

```typescript
// Example (commented until entities are fully configured):
const resultAcmeEcr = await issueEdgeCredential(
  crifEntity.client,           // Issuer client
  crifEntity.alias,            // Issuer alias
  crifEntity.registrySaid,     // Registry identifier
  RISKLENS_BADGE_SCHEMA_SAID,  // Schema SAID
  acmeEntity.client,           // Recipient client
  acmeEntity.prefix,           // Recipient prefix
  riskLensBadgeAuthData,       // Credential data
  riskLensBadgeEdge,           // Edge configuration
  riskLensBadgeRules           // Rules (from Saider.saidify)
);
```

## Next Steps

### Entity Configuration

To fully enable credential issuance, you need to:

1. **Set up entity clients** using the KERIA client service:
   ```typescript
   import { initializeEntity, ENTITY_CONFIGS } from './keria-client.service';
   
   const crifEntity = await initializeEntity(ENTITY_CONFIGS.CRIF);
   const acmeEntity = await initializeEntity(ENTITY_CONFIGS.ACME);
   ```

2. **Configure environment variables** in `.env`:
   ```env
   CRIF_BRAN=your_crif_bran_value
   ACME_BRAN=your_acme_bran_value
   ```

3. **Complete entity setup** by calling `createEntity` from the library's setup module to get full entity details including:
   - Registry SAID
   - AID prefix
   - OOBI

### Edge Configuration

Define the `riskLensBadgeEdge` object based on your credential chain requirements:

```typescript
const riskLensBadgeEdge = {
  // Add edge links to parent credentials
  // Example: links to Legal Entity credentials, QVI credentials, etc.
};
```

Refer to the VLEI specification for proper edge structure.

## Files Modified

1. **src/services/credential.service.ts**
   - Added imports for Saider, issueEdgeCredential, and RISKLENS_BADGE_SCHEMA_SAID
   - Integrated `Saider.saidify()` for rules generation
   - Prepared credential data and edge structure
   - Added commented integration example

2. **src/services/keria-client.service.ts** (NEW)
   - Helper service for initializing KERIA entities
   - Entity configuration interfaces
   - Example configurations for CRIF and ACME entities

## Testing

The current implementation includes:
- ✅ Import statements for required modules
- ✅ Rules generation using `Saider.saidify()`
- ✅ Credential data preparation
- ✅ TypeScript compilation passes

To test the full flow:
1. Configure entity credentials (bran values)
2. Uncomment the `issueEdgeCredential` call
3. Ensure KERIA agent is running and accessible
4. Call the `/api/v1/credentials/issue-risk-lens` endpoint

## References

- **VLEI KERIA Library**: `vlei-keria-library` package
- **Signify-TS**: KERI implementation in TypeScript
- **ACDC Specification**: Authentic Chained Data Container
- **IPEX Protocol**: Issuance and Presentation Exchange

## Notes

- The `@ts-ignore` comment is used for the Saider import because signify-ts is a transitive dependency
- Entity initialization requires proper KERIA agent connectivity
- Full credential issuance will require all entities to be properly configured and have established mutual OOBIs
