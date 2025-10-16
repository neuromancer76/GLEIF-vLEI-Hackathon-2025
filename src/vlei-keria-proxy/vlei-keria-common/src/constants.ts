import 'dotenv/config';

/**
 * VLEI KERIA Proxy Constants
 * 
 * This file centralizes all configuration constants used across the VLEI KERIA proxy services.
 * The proxy acts as a facade layer that simplifies complex VLEI credential operations by 
 * abstracting KERIA agent interactions and providing higher-level APIs for credential 
 * issuance, verification, and exchange workflows.
 * 
 * Architecture Decision: Using constants instead of runtime config allows for compile-time 
 * validation and better IDE support, while environment variables provide deployment flexibility.
 */

// =============================================================================
// KERIA Agent Connection Configuration
// =============================================================================

/**
 * Default KERIA admin URL - used for agent management operations like creating identifiers,
 * managing contacts, and administrative tasks. This is the primary control plane for KERIA.
 * Development default: http://localhost:3901
 */
export const DEFAULT_ADMIN_URL = process.env.DEFAULT_ADMIN_URL as string; 

/**
 * Default KERIA boot URL - used for initial agent bootstrapping and witness discovery.
 * This endpoint handles the initial KERI protocol setup and witness network connections.
 * Development default: http://localhost:3903
 */
export const DEFAULT_BOOT_URL = process.env.DEFAULT_BOOT_URL as string;  

/**
 * Operation timeout in milliseconds. VLEI operations can be complex multi-step processes
 * involving cryptographic operations, network calls, and consensus mechanisms.
 * 30 seconds provides sufficient time for complex credential issuance workflows.
 */
export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Default delay between retry attempts. KERI operations often require waiting for
 * network consensus and witness acknowledgments. 5 seconds balances responsiveness
 * with network stability.
 */
export const DEFAULT_DELAY_MS = 5000;

/**
 * Maximum retry attempts for KERI operations. The distributed nature of KERI means
 * operations may fail due to network partitions or witness unavailability.
 * 10 retries with 5-second delays provides 50 seconds total tolerance.
 */
export const DEFAULT_RETRIES = 10;

/**
 * KERI agent role identifier. In KERI, agents act on behalf of controllers.
 * This constant ensures consistent role identification across all operations.
 */
export const ROLE_AGENT = 'agent'

// =============================================================================
// IPEX (Issuance and Presentation EXchange) Protocol Routes
// =============================================================================

/**
 * IPEX Grant route - handles credential presentation grants from holders to verifiers.
 * This is where a credential holder grants permission for a verifier to access 
 * specific credential attributes during the VLEI verification process.
 */
export const IPEX_GRANT_ROUTE = '/exn/ipex/grant'

/**
 * IPEX Admit route - processes admission of credentials into holder's wallet.
 * This endpoint handles the final step where issued credentials are stored
 * and indexed in the holder's credential repository.
 */
export const IPEX_ADMIT_ROUTE = '/exn/ipex/admit'

/**
 * IPEX Apply route - manages credential application requests from potential holders.
 * This is where entities request specific VLEI credentials (like Legal Entity
 * credentials or ECR authorization credentials) from qualified issuers.
 */
export const IPEX_APPLY_ROUTE = '/exn/ipex/apply'

/**
 * IPEX Offer route - handles credential offers from issuers to potential holders.
 * Issuers use this endpoint to proactively offer credentials to entities,
 * typically after validation of eligibility requirements.
 */
export const IPEX_OFFER_ROUTE = '/exn/ipex/offer'

/**
 * VLEI Schema Server host - central registry for all VLEI credential schemas.
 * All schema lookups, OOBI resolutions, and credential template retrieval
 * operations connect to this server. Production: https://vlei-dev.gleif.org:7723
 */
export const SCHEMA_SERVER_HOST = process.env.SCHEMA_SERVER_HOST as string;
// =============================================================================
// VLEI Credential Schema Identifiers (SAIDs)
// =============================================================================

/**
 * These SAIDs (Self-Addressing Identifiers) uniquely identify VLEI credential schemas
 * in the global KERI namespace. Each schema defines the structure, validation rules,
 * and semantic meaning of specific credential types in the VLEI ecosystem.
 * 
 * Architecture Note: SAIDs are cryptographically bound to schema content, ensuring
 * schema integrity and preventing tampering. Any schema modification results in a
 * new SAID, maintaining immutable schema versioning.
 */

/**
 * Qualified vLEI Issuer (QVI) Schema - Defines credentials for entities authorized
 * to issue Legal Entity vLEI credentials. QVIs are qualified by GLEIF and act as
 * the trust anchors for the entire VLEI credential chain.
 */
export const QVI_SCHEMA_SAID = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';

/**
 * Legal Entity (LE) vLEI Schema - The foundational credential type that establishes
 * the legal identity of organizations. Contains LEI, legal name, jurisdiction,
 * and other core business identity information.
 */
export const LE_SCHEMA_SAID = 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY';

/**
 * Engagement Context Role (ECR) Authorization Schema - Authorizes specific individuals
 * within an organization to act in defined business contexts (e.g., procurement officer,
 * financial representative). This enables person-to-business credential binding.
 */
export const ECR_AUTH_SCHEMA_SAID = 'EH6ekLjSr8V32WyFbGe1zXjTzFs9PkTYmupJ9H65O14g';

/**
 * Risk Assessment Badge Schema - Third-party risk assessment credentials that provide
 * standardized risk ratings and compliance information. Used in supplier evaluation
 * and due diligence workflows within procurement systems.
 */
export const RISKLENS_BADGE_SCHEMA_SAID = 'ENiOJlEz0_UMIN-olC06myHv8163njRNjFCnePFNKHZH';

/**
 * Certificator Schema - Defines credentials for entities authorized to issue
 * specialized attestation badges (risk, ESG, compliance). Certificators are
 * third-party validators that extend the VLEI trust framework.
 */
export const CERTIFICATOR_SCHEMA_SAID = 'EKB7JitBHWnBFzNVeeYeZ9mn93_l_5sR-100MXYxZYJu';

/**
 * Environmental, Social, Governance (ESG) Badge Schema - Sustainability and
 * governance credentials that certify an organization's ESG compliance and
 * performance metrics. Critical for modern procurement and investment decisions.
 */
export const ESG_BADGE_SCHEMA_SAID = 'EAag5G3RpOTcIgmCJSkz6h_v4BkFhGDQFFYK2gMBVM7P';

/**
 * Engagement Context Role (ECR) Schema - The actual role-based credentials that
 * bind individuals to specific organizational functions. Enables granular
 * authorization for business processes and digital signatures.
 */
export const ECR_SCHEMA_SAID = 'EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw';

/**
 * Official Organizational Role (OOR) Authorization Schema - Authorizes the issuance
 * of official organizational role credentials, typically used for legal representatives
 * and executive-level authorization chains.
 */
export const OOR_AUTH_SCHEMA_SAID = 'EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E';

/**
 * Official Organizational Role (OOR) Schema - High-level organizational role
 * credentials for executives, legal representatives, and other official positions
 * that require the highest level of organizational authority verification.
 */
export const OOR_SCHEMA_SAID = 'EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy';

// =============================================================================
// OOBI (Out-Of-Band Introduction) URLs for Schema Discovery
// =============================================================================

/**
 * OOBI URLs combine the schema server host with schema SAIDs to create resolvable
 * endpoints for schema discovery and validation. OOBI is the KERI mechanism for
 * introducing cryptographic identifiers and their associated metadata to new participants.
 * 
 * Architecture Benefit: These URLs enable automatic schema discovery and validation
 * without requiring pre-shared configuration between VLEI participants.
 */

export const CERTIFICATOR_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${CERTIFICATOR_SCHEMA_SAID}`;
export const ESG_BADGE_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${ESG_BADGE_SCHEMA_SAID}`;
export const RISKLENS_BADGE_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${RISKLENS_BADGE_SCHEMA_SAID}`;
export const QVI_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${QVI_SCHEMA_SAID}`;
export const LE_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${LE_SCHEMA_SAID}`;
export const ECR_AUTH_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${ECR_AUTH_SCHEMA_SAID}`;
export const ECR_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${ECR_SCHEMA_SAID}`;
export const OOR_AUTH_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${OOR_AUTH_SCHEMA_SAID}`;
export const OOR_SCHEMA_URL = `${SCHEMA_SERVER_HOST}/oobi/${OOR_SCHEMA_SAID}`;

// =============================================================================
// KERI Identifier Configuration
// =============================================================================

/**
 * Default identifier creation arguments for development environments.
 * 
 * In KERI, identifiers can be protected by witnesses that provide additional
 * security and availability guarantees. For development and testing, we use
 * simplified configuration with no witness requirements.
 * 
 * Production environments should configure appropriate witness thresholds
 * and witness pools for production-grade security and availability.
 */
export const DEFAULT_IDENTIFIER_ARGS = {
    toad: 0,  // Threshold Of Acceptable Duplicity - set to 0 for development (no witnesses required)
    wits: []  // Witness list - empty array for development (production should specify witness AIDs)
};

// =============================================================================
// VLEI Ecosystem Participant Configurations
// =============================================================================

/**
 * Pre-configured identities for VLEI ecosystem participants. These configurations
 * include human-readable names, system aliases, and KERI branch identifiers (bran)
 * that enable deterministic key generation and identity recovery.
 * 
 * Architecture Decision: Using pre-configured identities simplifies development
 * and testing while maintaining cryptographic security through KERI's deterministic
 * key derivation. Each 'bran' (branch) value seeds the key generation process.
 */

/**
 * GLEIF (Global Legal Entity Identifier Foundation) - The root trust authority
 * for the entire VLEI ecosystem. GLEIF issues QVI credentials and maintains
 * the foundational trust framework for Legal Entity Identifiers.
 */
export const GLEIF = {
    name:   'Global Legal Entity Identifier Foundation',
    alias:  'gleif',
    bran:   'Dm8Tmz05CF6_JLX9sVlFe'  // Deterministic key generation seed
}

/**
 * QVI (Qualified vLEI Issuer) - An entity authorized by GLEIF to issue
 * Legal Entity vLEI credentials. QVIs act as intermediate certificate
 * authorities in the VLEI trust hierarchy.
 */
export const QVI = {
    name:   'Qualified vLEI Issuer',
    alias:  'qvi',
    bran:   'xpm8L3FH4zdWTe5FEr8ZI'
}

/**
 * ACME INC - Example legal entity for demonstration and testing purposes.
 * Represents a typical corporation participating in VLEI-enabled business
 * processes like procurement and supply chain verification.
 */
export const ACME_INC = {
    name:   'ACME INC',
    alias:  'acme_inc',
    bran:   'B9qx72My5X7lp-px5Gbtv'
}

/**
 * AMAZOFF - Example marketplace/platform entity demonstrating how large
 * e-commerce platforms can integrate VLEI credentials for supplier
 * verification and trusted marketplace operations.
 */
export const AMAZOFF  = {
    name:   'AMAZOFF',
    alias:  'AMAZOFF',
    bran:   'AQLT6WK9dCzrtSu6iT88x'
}

/**
 * CRIF - Credit rating and risk assessment provider that issues risk
 * assessment badges and compliance credentials. Demonstrates third-party
 * attestation services in the VLEI ecosystem.
 */
export const CRIF = {
    name:   'CRIF',
    alias:  'crif',
    bran:   'D6_wUYlRAsy01WrU_X_S7'
}

/**
 * SUPPLIERPORTAL - The supplier discovery and procurement platform
 * identity. Acts as a trusted intermediary facilitating VLEI-based
 * supplier verification and procurement workflows.
 */
export const SUPPLIERPORTA = {
    name:   'SUPPLIERPORTAL',
    alias:  'supplierportal',
    bran:   'A_X4BiJExGudQLwZShO1A'
}