# Grant Structure Schema Documentation

This document outlines the grant structure schema for all entities created in the VLEI (Verifiable Legal Entity Identifier) system, as implemented in the `main.ts` file.

## Overview

The system implements a hierarchical trust chain where credentials are issued and granted between entities through KERI (Key Event Receipt Infrastructure) and IPEX (Issuance and Presentation Exchange) protocols.

---

## Entity Hierarchy

```
GLEIF (Global Legal Entity Identifier Foundation)
    ↓ issues vLEI credentials to
QVI (Qualified vLEI Issuer)
    ↓ issues Legal Entity credentials to
ACME_INC, CRIF, AMAZOFF
    ↓ CRIF issues specialized badges to
ACME_INC (RiskLens Badge)
```

---

## Entity Definitions

### 1. GLEIF (Global Legal Entity Identifier Foundation)
- **Name**: Global Legal Entity Identifier Foundation
- **Alias**: `gleif`
- **Bran**: `Dm8Tmz05CF6_JLX9sVlFe`
- **Role**: Root issuer of the vLEI ecosystem

### 2. QVI (Qualified vLEI Issuer)
- **Name**: Qualified vLEI Issuer
- **Alias**: `qvi`
- **Bran**: `xpm8L3FH4zdWTe5FEr8ZI`
- **Role**: Intermediary issuer for Legal Entity credentials

### 3. ACME_INC
- **Name**: ACME INC
- **Alias**: `acme_inc`
- **Bran**: `B9qx72My5X7lp-px5Gbtv`
- **Role**: Legal Entity credential holder and recipient

### 4. CRIF
- **Name**: CRIF
- **Alias**: `crif`
- **Bran**: `D6_wUYlRAsy01WrU_X_S7`
- **Role**: Certificator and specialized credential issuer

### 5. AMAZOFF
- **Name**: AMAZOFF
- **Alias**: `AMAZOFF`
- **Bran**: `AQLT6WK9dCzrtSu6iT88x`
- **Role**: Legal Entity credential holder and verifier

---

## Schema Definitions

### Schema SAIDs and URLs

| Schema Type | SAID | URL |
|-------------|------|-----|
| QVI Schema | `EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| Legal Entity (LE) Schema | `ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| ECR Auth Schema | `EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| RiskLens Badge Schema | `ENiOJlEz0_UMIN-olC06myHv8163njRNjFCnePFNKHZH` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| Certificator Schema | `EKB7JitBHWnBFzNVeeYeZ9mn93_l_5sR-100MXYxZYJu` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| ESG Badge Schema | `EAag5G3RpOTcIgmCJSkz6h_v4BkFhGDQFFYK2gMBVM7P` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| ECR Schema | `EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| OOR Auth Schema | `EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E` | `${SCHEMA_SERVER_HOST}/oobi/...` |
| OOR Schema | `EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy` | `${SCHEMA_SERVER_HOST}/oobi/...` |

---

## Grant Structure Schema

### 1. Basic Grant Structure

Each grant follows the IPEX protocol structure:

```json
{
  "issuer": {
    "client": "SignifyClient",
    "alias": "string",
    "prefix": "string",
    "registrySaid": "string"
  },
  "recipient": {
    "client": "SignifyClient", 
    "prefix": "string"
  },
  "credential": {
    "schemaSaid": "string",
    "credentialData": "object",
    "edges": "object (optional)",
    "rules": "object (optional)"
  }
}
```

### 2. Entity Structure

Each entity contains:

```typescript
interface EntityResult {
  bran: string;           // Entropy for key derivation
  alias: string;          // Human-readable identifier
  prefix: string;         // AID prefix (cryptographic identifier)
  oobi: string;           // Out-of-Band Introduction URL
  client: SignifyClient;  // KERI client instance
  registrySaid: string;   // Credential registry identifier
  AID: any;              // Autonomic Identifier object
}
```

---

## Credential Grant Flows

### 1. GLEIF → QVI (vLEI Credential)

**Issuer**: GLEIF  
**Recipient**: QVI  
**Schema**: QVI_SCHEMA_SAID  
**Credential Data**:
```json
{
  "LEI": "254900OPPU84GM83MG36"
}
```

**Grant Process**:
1. GLEIF issues credential using `issueCredentials()`
2. GLEIF grants credential via IPEX to QVI
3. QVI accepts credential notification via `acceptCredentialNotification()`

### 2. QVI → ACME_INC (Legal Entity Credential)

**Issuer**: QVI  
**Recipient**: ACME_INC  
**Schema**: LE_SCHEMA_SAID  
**Credential Data**:
```json
{
  "LEI": "875500ELOZEL05BVXV37"
}
```

**Edge Data** (Chain to QVI credential):
```json
{
  "d": "",
  "qvi": {
    "n": "<qvi_credential_said>",
    "s": "<qvi_credential_schema_said>"
  }
}
```

**Rules Data** (Usage and Issuance Disclaimers):
```json
{
  "d": "",
  "usageDisclaimer": {
    "l": "Usage of a valid, unexpired, and non-revoked vLEI Credential..."
  },
  "issuanceDisclaimer": {
    "l": "All information in a valid, unexpired, and non-revoked vLEI Credential..."
  }
}
```

### 3. QVI → CRIF (Legal Entity Credential)

**Issuer**: QVI  
**Recipient**: CRIF  
**Schema**: LE_SCHEMA_SAID  
**Credential Data**:
```json
{
  "LEI": "875500ELOZEL05B0000"
}
```

Similar edge and rules structure as ACME_INC credential.

### 4. QVI → AMAZOFF (Legal Entity Credential)

**Issuer**: QVI  
**Recipient**: AMAZOFF  
**Schema**: LE_SCHEMA_SAID  
**Credential Data**:
```json
{
  "LEI": "875500ELOZEL05B0000"
}
```

Similar edge and rules structure as other Legal Entity credentials.

### 5. QVI → CRIF (Certificator Badge)

**Issuer**: QVI  
**Recipient**: CRIF  
**Schema**: CERTIFICATOR_SCHEMA_SAID  
**Credential Data**:
```json
{
  "certificationType": "Risk, Esg, Insurance"
}
```

**Edge Data** (Chain to QVI credential):
```json
{
  "d": "",
  "qvi": {
    "n": "<qvi_credential_said>",
    "s": "<qvi_credential_schema_said>"
  }
}
```

### 6. CRIF → ACME_INC (RiskLens Badge)

**Issuer**: CRIF  
**Recipient**: ACME_INC  
**Schema**: RISKLENS_BADGE_SCHEMA_SAID  
**Credential Data**:
```json
{
  "AID": "",
  "riskIndicator": "A",
  "creditLimit": 10000
}
```

**Edge Data** (Chain to Certificator credential):
```json
{
  "d": "",
  "certificator": {
    "n": "<certificator_credential_said>",
    "s": "<certificator_credential_schema_said>"
  }
}
```

**Rules Data** (Includes privacy disclaimer):
```json
{
  "d": "",
  "usageDisclaimer": {
    "l": "Usage of a valid, unexpired, and non-revoked vLEI Credential..."
  },
  "issuanceDisclaimer": {
    "l": "All information in a valid, unexpired, and non-revoked vLEI Credential..."
  },
  "privacyDisclaimer": {
    "l": "Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials..."
  }
}
```

---

## Edge Credential Structure

Edge credentials create cryptographic chains between credentials using the following pattern:

```json
{
  "d": "",
  "<parent_type>": {
    "n": "<parent_credential_said>",
    "s": "<parent_credential_schema_said>"
  }
}
```

Where:
- `d`: SAID (Self-Addressing Identifier) of the edge
- `n`: SAID of the parent credential
- `s`: Schema SAID of the parent credential

---

## Rules Structure

Rules provide legal disclaimers and usage terms:

```json
{
  "d": "",
  "usageDisclaimer": {
    "l": "<usage_terms>"
  },
  "issuanceDisclaimer": {
    "l": "<issuance_terms>"
  },
  "privacyDisclaimer": {
    "l": "<privacy_terms>"
  }
}
```

---

## IPEX Protocol Routes

The system uses the following IPEX routes for credential exchange:

- **Grant Route**: `/exn/ipex/grant` - For issuing credentials
- **Admit Route**: `/exn/ipex/admit` - For accepting credentials  
- **Apply Route**: `/exn/ipex/apply` - For requesting credentials
- **Offer Route**: `/exn/ipex/offer` - For offering credentials

---

## Verification and Presentation Flow

The system includes a credential presentation flow:

1. **AMAZOFF** (Verifier) asks **ACME_INC** (Holder) for credentials via `verifyAskCredential()`
2. **ACME_INC** receives the apply request via `holderReceiveApplyRequest()`
3. **ACME_INC** finds matching credentials via `holderFindMatchingCredential()`
4. **ACME_INC** offers the credential to **AMAZOFF** via `holderOfferCredential()`
5. **AMAZOFF** receives the offer notification and can verify the credential

---

## Configuration Constants

### Default Parameters
- **Timeout**: 30 seconds
- **Retry Delay**: 5 seconds  
- **Max Retries**: 5
- **Identifier Args**: `{toad: 0, wits: []}` (development mode)

### Environment Variables
- `DEFAULT_ADMIN_URL`: KERIA admin endpoint
- `DEFAULT_BOOT_URL`: KERIA boot endpoint
- `SCHEMA_SERVER_HOST`: Schema server host for OOBI resolution

---

## Security and Trust Model

The grant structure implements a hierarchical trust model:

1. **GLEIF** is the root of trust
2. **QVI** is authorized by GLEIF to issue Legal Entity credentials
3. **Legal Entities** (ACME_INC, CRIF, AMAZOFF) receive credentials from QVI
4. **Specialized Issuers** (CRIF) can issue domain-specific credentials with proper authorization chains

Each credential includes cryptographic proof of the issuing chain through edge data, ensuring verifiable provenance and preventing unauthorized credential issuance.