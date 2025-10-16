# Signify Console App - Library Migration

## 🔄 Migration to vlei-keria-library

This project has been successfully migrated to use the **vlei-keria-library** instead of local utility files.

### Changes Made

#### ✅ Dependencies Updated
- Added `vlei-keria-library` as a local file dependency in `package.json`
- The library provides all previously local utility functions

#### ✅ Imports Refactored  
**Before:**
```typescript
import { prContinue, prMessage, prTitle } from './utils/console.js';
import { initializeSignify, initializeAndConnectClient, ... } from './utils/keri.js';
import { DEFAULT_IDENTIFIER_ARGS, ROLE_AGENT, ... } from './utils/utils.js';
import { acceptCredentialNotification, createEntity, ... } from './utils/setup.js';
import { verifyAskCredential, holderReceiveApplyRequest, ... } from './utils/credentialPresentationProcess.js';
import { GLEIF, ACME_INC, CRIF, QVI, ... } from './utils/constants.js';
```

**After:**
```typescript
import { 
  // Console utilities
  prContinue, prMessage, prTitle,
  
  // KERI utilities
  initializeSignify, initializeAndConnectClient, createNewAID, addEndRoleForAID,
  generateOOBI, resolveOOBI, createCredentialRegistry, issueCredential,
  ipexGrantCredential, getCredentialState, waitForAndGetNotification,
  ipexAdmitGrant, markNotificationRead, acceptChallenge, createTimestamp,
  
  // General utilities
  DEFAULT_IDENTIFIER_ARGS, ROLE_AGENT, IPEX_GRANT_ROUTE, IPEX_ADMIT_ROUTE, 
  SCHEMA_SERVER_HOST, isServiceHealthy, sleep, verifyHeaders, IPEX_OFFER_ROUTE,
  
  // Setup utilities
  acceptCredentialNotification, createEntity, EntityResult, issueCredentials, 
  issueEdgeCredential, resolveAllOOBIs, resolveSchemas,
  
  // Credential presentation process
  verifyAskCredential, holderReceiveApplyRequest, holderFindMatchingCredential, 
  holderOfferCredential, verifierAgreeCredential, verifierReceiveOfferNotification,
  holderReceivePresentationFlow, verifierCheckAndApproveCredentialFlow, checkCredentialsChain,
  
  // Constants
  GLEIF, ACME_INC, CRIF, QVI, QVI_SCHEMA_URL, LE_SCHEMA_URL, ECR_AUTH_SCHEMA_URL, 
  ECR_SCHEMA_URL, OOR_AUTH_SCHEMA_URL, OOR_SCHEMA_URL, QVI_SCHEMA_SAID, LE_SCHEMA_SAID,
  ECR_AUTH_SCHEMA_SAID, RISKLENS_BADGE_SCHEMA_SAID, RISKLENS_BADGE_SCHEMA_URL,
  ESG_BADGE_SCHEMA_URL, CERTIFICATOR_SCHEMA_URL, CERTIFICATOR_SCHEMA_SAID, AMAZOFF,
  DEFAULT_RETRIES, IPEX_APPLY_ROUTE, DEFAULT_DELAY_MS
} from 'vlei-keria-library';
```

#### ✅ Local Utils Removed
- Deleted the entire `src/utils/` folder
- All functionality is now provided by the vlei-keria-library
- Build is cleaner and no longer contains utils compilation artifacts

### Project Structure

**Before:**
```
signify-console-app/
├── src/
│   ├── main.ts
│   └── utils/
│       ├── console.ts
│       ├── constants.ts
│       ├── credentialPresentationProcess.ts
│       ├── debug.ts
│       ├── keri.ts
│       ├── setup.ts
│       └── utils.ts
├── package.json
└── tsconfig.json
```

**After:**
```
signify-console-app/
├── src/
│   └── main.ts
├── package.json
└── tsconfig.json
```

### Benefits

1. **Code Reuse** - Utilities are now shared across multiple projects
2. **Maintainability** - Single source of truth for common VLEI/KERI operations
3. **Consistency** - All projects use the same tested implementations
4. **Cleaner Structure** - Reduced project complexity and file count

### Integration with Other Projects

This project now integrates seamlessly with:
- **vlei-keria-library** - Provides all utility functions
- **vlei-holder-credential-responder** - Uses the same library
- **vlei-credential-verifier-api** - Uses the same library

All three projects share the same battle-tested implementations of VLEI/KERI operations.

### Testing

✅ **Build Success** - Project compiles without errors
✅ **Dependencies Installed** - Library dependency resolved correctly  
✅ **Clean Structure** - No leftover utils artifacts
✅ **Import Resolution** - All imports work correctly

### Usage

The project usage remains exactly the same:

```bash
# Install dependencies (now includes vlei-keria-library)
npm install

# Build the project
npm run build

# Run the application
npm start

# Development mode
npm run dev
```

The main.ts functionality is identical - only the import source has changed from local files to the shared library.