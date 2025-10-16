import signify, { Authenticater, Cigar, designature, Signer, Verfer } from "signify-ts";
import { resolveOOBI } from "./keri.js";


/**
 * Verifies HTTP headers using KERI signature authentication.
 *
 * This method performs cryptographic verification of HTTP request headers that have been
 * signed using the Signify/KERI protocol. It resolves the issuer's identity, extracts
 * their public key, and verifies the signature against the provided headers and request details.
 *
 * @param {any} client - The Signify client instance used for KERI operations
 * @param {string} issuerOOBI - Out-Of-Band Introduction (OOBI) URL of the issuer for identity resolution
 * @param {string} issuerAlias - Human-readable alias for the issuer's AID (Autonomic Identifier)
 * @param {globalThis.Headers} headers - HTTP headers object containing the signature to verify
 * @param {string} method - HTTP method (GET, POST, etc.) used in the original request
 * @param {string} path - Full URL path that was signed (will be parsed to extract pathname)
 *
 * @returns {Promise<boolean>} Promise that resolves to true if signature verification succeeds, false otherwise
 *
 * @description
 * The verification process involves:
 * 1. Resolving the issuer's OOBI to establish contact and get their AID prefix
 * 2. Retrieving the issuer's current key state and extracting their public key
 * 3. Extracting the signature from the 'signature' header using designature()
 * 4. Creating a verifier from the issuer's public key
 * 5. Extracting the 'signify' marker from the signature data
 * 6. Creating an authenticator with the signer and verifier
 * 7. Verifying the headers against the HTTP method and URL pathname
 *
 * @throws {Error} If OOBI resolution fails, key state retrieval fails, or signature parsing fails
 *
 * @example
 * ```typescript
 * const isValid = await verifyHeaders(
 *   client,
 *   'http://example.com/oobi/issuer',
 *   'issuer-alias',
 *   requestHeaders,
 *   'GET',
 *   'https://api.example.com/data'
 * );
 * ```
 */
export async function verifyHeaders(
    client: any,
    issuerOOBI: string,
    issuerAlias: string,
    headers: globalThis.Headers,
    method: string,
    path: string) {
    // Resolve the OOBI to get the issuer's contact information
    const { operation: resolveOperation, contacts: resolvedContacts } = await resolveOOBI(client, issuerOOBI, issuerAlias);
    if (!resolvedContacts || resolvedContacts.length === 0) {
        throw new Error(`Failed to resolve issuer OOBI: ${issuerOOBI}`);
    }
    // Extract the issuer prefix from the resolved contacts
    const issuerPrefix = resolvedContacts?.[0]?.id;
    if (!issuerPrefix) {
        throw new Error(`Failed to extract issuer prefix from the resolved contacts: ${JSON.stringify(resolvedContacts)}`);
    }
    // Retrieve the issuer's public key from the resolved contacts
    const issuerKeyState = await client.keyStates().get(issuerPrefix as string);
    if (!issuerKeyState || issuerKeyState.length === 0) {
        throw new Error(`Failed to retrieve key state for issuer prefix: ${issuerPrefix}`);
    }
    // Extract the public key from the key state
    const issuerPublicKey = issuerKeyState?.[0]?.k[0];
    if (!issuerPublicKey) {
        throw new Error(`Issuer public key not found in key state for prefix: ${issuerPrefix}`);
    }
    // Create the verifier using the issuer's public key
    const verfer = new Verfer({
        qb64: issuerPublicKey
    });
    // Retrieve the signature from the headers
    const signatureHeader = headers.get('signature');
    if (!signatureHeader) {
        throw new Error('Signature header is missing');
    }
    const signage = designature(signatureHeader);
    // Extract the signature (cigar) from the signage
    const markers = signage[0].markers as Map<string, Signer | Cigar>;
    if (!markers || !markers.has('signify')) {
        throw new Error('No "signify" marker found in signature');
    }
    const cigar = markers.get('signify');
    // Create a signer object from the cigar
    const signer = new Signer({raw: cigar?.raw});
    // Create the authenticator using the signer and verifier
    const authn = new Authenticater(signer, verfer);
    // Extract the path from the URL
    const pathName = new URL(path).pathname;
    // Verify the headers
    const verificationResult = authn.verify(headers, method, pathName);

    return verificationResult;
}


// Helper function for sleeping
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to check the health of a container
export async function isServiceHealthy(healthCheckUrl: string): Promise<boolean> {
  
  console.log(`Checking health at: ${healthCheckUrl}`);

  try {
    const response = await fetch(healthCheckUrl);
    
    if (response.ok) {
        console.log(`Received status: ${response.status}. Service is healthy.`);
        return true;
    } else {
        console.warn(`Received a non-ok status: ${response.status}. Service is running but may be unhealthy.`);
        return false;
    }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Failed to connect to service. It may be down. Error:`, error.message);
        } else {
            console.error(`Failed to connect to service. It may be down. Unknown error.`);
        }
    return false;
  }
}


