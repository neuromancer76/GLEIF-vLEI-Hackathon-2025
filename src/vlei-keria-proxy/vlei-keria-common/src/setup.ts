import {
  initializeSignify,
  initializeAndConnectClient,
  createNewAID,
  addEndRoleForAID,
  generateOOBI,
  createCredentialRegistry,
  issueCredential,
  ipexGrantCredential,
  waitForAndGetNotification,
  ipexAdmitGrant,
  markNotificationRead,
  resolveOOBI
} from './keri';

import {
  prTitle,
  prMessage,
  prContinue,
  prSubTitle
} from './console';

import {
  DEFAULT_IDENTIFIER_ARGS,
  ROLE_AGENT,
  GLEIF,
  QVI,
  ACME_INC,
  CRIF
} from './constants';
import { IPEX_GRANT_ROUTE } from './constants';
import { Sign } from 'crypto';
import signify, { Saider } from 'signify-ts';
import { Console } from 'console';

export interface EntityResult {
  bran: string;
  alias: string;
  prefix: string;
  oobi: string;
  client: any;
  registrySaid: string;
  AID: any;
}

/**
 * Resolves OOBIs between all entities in the list.
 * Each entity resolves the OOBI of every other entity, creating mutual contacts.
 * 
 * @param entities - Array of EntityResult objects containing client info and OOBIs
 * @returns Promise<void>
 */
export async function resolveAllOOBIs(entities: EntityResult[]): Promise<void> {
    prTitle("Resolving OOBIs between all entities");
    
    const resolvePromises: Promise<void>[] = [];
    
    for (let i = 0; i < entities.length; i++) {
        const currentEntity = entities[i];
        
        // Use the client from the entity instead of creating a new connection
        const client = currentEntity.client;
        
        // Resolve OOBIs for all other entities
        for (let j = 0; j < entities.length; j++) {
            if (i !== j) { // Don't resolve OOBI with itself
                const targetEntity = entities[j];
                
                // Create a promise for each OOBI resolution
                const resolvePromise = resolveOOBI(
                    client, 
                    targetEntity.oobi, 
                    targetEntity.alias
                ).then(() => {
                    console.log(`✅ ${currentEntity.alias} resolved OOBI for ${targetEntity.alias}`);
                }).catch((error) => {
                    console.error(`❌ ${currentEntity.alias} failed to resolve OOBI for ${targetEntity.alias}:`, error);
                    throw error;
                });
                
                resolvePromises.push(resolvePromise);
            }
        }
    }
    
    // Wait for all OOBI resolutions to complete
    try {
        await Promise.all(resolvePromises);
        console.log(`🎉 Successfully resolved OOBIs between all ${entities.length} entities`);
    } catch (error) {
        console.error("❌ Failed to resolve all OOBIs:", error);
        throw error;
    }
}


export async function createEntity(client: any, bran: string, alias: string): Promise<EntityResult> {
  let prefix: string;
  let aid: any;
  
  try {
    aid = await client.identifiers().get(alias);
    prefix = aid.prefix;
    prMessage(`Reusing existing ${alias} AID`);
  } catch {
    prMessage(`Creating new ${alias} AID`);
    const { aid: newAid } = await createNewAID(client, alias, DEFAULT_IDENTIFIER_ARGS);
    await addEndRoleForAID(client, alias, ROLE_AGENT);
    prefix = newAid.i;
    aid = newAid;
  }
  
  const oobi = await generateOOBI(client, alias, ROLE_AGENT);
  prMessage(`${alias} Prefix: ${prefix}`);
  prMessage(`${alias} OOBI: ${oobi}`);
  

// GLEIF GEDA Registry
// uses try/catch to permit reusing existing GEDA upon re-run of this test file.
let createdRegistrySaid
try{
    const registries = await client.registries().list(alias);
    createdRegistrySaid = registries[0].regk
} catch {
    prMessage(`Creating ${alias} Registry`)
    const { registrySaid: newRegistrySaid } = await createCredentialRegistry(client, alias, alias + 'Registry')
    createdRegistrySaid = newRegistrySaid
}

  return {
    bran,
    alias,
    prefix,
    oobi,
    client,
    registrySaid: createdRegistrySaid,
    AID: aid
  };
}

export async function issueCredentials(
  client: any,
  alias: string,
  registrySaid: string,
  schemaSaid: string,
  targetPrefix: string,
  targetCredentialData: any
): Promise<any> {
  // ---------------------------------
  // API 1 : grant credential
  // ---------------------------------
  // GLEIF - Issue credential
  prSubTitle("Issuing Credential");
  
  if (!targetPrefix) {
    throw new Error('targetPrefix is undefined; cannot issue credential');
  }
  
  const { credentialSaid } = await issueCredential(
    client, 
    alias, 
    registrySaid, 
    schemaSaid, 
    targetPrefix, 
    targetCredentialData
  );

  // Get credential
  const credential = await client.credentials().get(credentialSaid);

  // Ipex grant
  prSubTitle(`${alias} --> Granting Credential`);
  const grantResponse = await ipexGrantCredential(
    client, 
    alias, 
    targetPrefix, 
    credential
  );

  return credential;
}

export async function acceptCredentialNotification(
  client: any,
  alias: string,
  ipexGrantRoute: string,
  issuerPrefix: string
): Promise<void> {
  // ---------------------------------
  // DEMON 2 : Accept credential
  // ---------------------------------
  
  // Wait for grant notification
  const grantNotifications = await waitForAndGetNotification(client, ipexGrantRoute);
  const grantNotification = grantNotifications[0];

  
  // Admit Grant
  prSubTitle(`${alias} --> Admitting Grant`);
  const admitResponse = await ipexAdmitGrant(
    client, 
    alias,
    issuerPrefix, 
    grantNotification.a.d
  );

  prSubTitle(`${alias} --> Mark notification`);
  // Mark notification as read
  await markNotificationRead(client, grantNotification.i);
}

export async function waitForAdmitNotification(
  client: any,
  alias: string,
  ipexAdmitRoute: string
): Promise<void> {
  // ---------------------------------
  // DEMON 3 : WAIT FOR Admit credential
  // ---------------------------------
  
  // Wait for admit notification
  const admitNotifications = await waitForAndGetNotification(client, ipexAdmitRoute);
  const admitNotification = admitNotifications[0];

  // Mark notification as read
  prSubTitle(`${alias} --> Mark notification`);
  await markNotificationRead(client, admitNotification.i);
}

/**
 * Resolves schema OOBIs for all provided clients.
 * Each client resolves all schema URLs, creating schema contacts for credential operations.
 * 
 * @param schemaUrls - Array of schema OOBI URLs to resolve
 * @param clients - Array of any instances that will resolve the schema OOBIs
 * @returns Promise<void>
 */
export async function resolveSchemas(schemaUrls: string[], clients: any[]): Promise<void> {
    prSubTitle("Resolving Schema OOBIs for all clients");
    
    if (!schemaUrls.length) {
        prMessage("No schema URLs provided");
        return;
    }
    
    if (!clients.length) {
        prMessage("No clients provided");
        return;
    }
    
    const resolvePromises: Promise<void>[] = [];
    
    // For each client, resolve all schema URLs
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        
        // For each schema URL, create a resolution promise
        for (let j = 0; j < schemaUrls.length; j++) {
            const schemaUrl = schemaUrls[j];
            const schemaAlias = `schema-${j + 1}`;  // Create alias like "schema-1", "schema-2", etc.
            
            const resolvePromise = resolveOOBI(client, schemaUrl, schemaAlias)
                .then(() => {
                    console.log(`✅ Client ${i + 1} resolved schema OOBI: ${schemaUrl} with alias: ${schemaAlias}`);
                })
                .catch((error) => {
                    console.error(`❌ Client ${i + 1} failed to resolve schema OOBI ${schemaUrl} with alias ${schemaAlias}:`, error);
                    throw error;
                });
            
            resolvePromises.push(resolvePromise);
        }
    }
    
    // Wait for all schema OOBI resolutions to complete
    try {
        await Promise.all(resolvePromises);
        console.log(`🎉 Successfully resolved ${schemaUrls.length} schema(s) for ${clients.length} client(s)`);
        prMessage(`Total operations: ${schemaUrls.length * clients.length} schema OOBI resolutions completed`);
    } catch (error) {
        console.error("❌ Failed to resolve all schema OOBIs:", error);
        throw error;
    }
}

/**
 * Alternative version with custom schema aliases
 * Resolves schema OOBIs for all provided clients with custom aliases.
 * 
 * @param schemaConfigs - Array of objects containing {url: string, alias: string}
 * @param clients - Array of any instances that will resolve the schema OOBIs
 * @returns Promise<void>
 */
export async function resolveSchemasWithAliases(
    schemaConfigs: Array<{url: string, alias: string}>, 
    clients: any[]
): Promise<void> {
    prSubTitle("Resolving Schema OOBIs with custom aliases for all clients");
    
    if (!schemaConfigs.length) {
        prMessage("No schema configurations provided");
        return;
    }
    
    if (!clients.length) {
        prMessage("No clients provided");
        return;
    }
    
    const resolvePromises: Promise<void>[] = [];
    
    // For each client, resolve all schema URLs
    for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        
        // For each schema configuration, create a resolution promise
        for (const schemaConfig of schemaConfigs) {
            const resolvePromise = resolveOOBI(client, schemaConfig.url, schemaConfig.alias)
                .then(() => {
                    console.log(`✅ Client ${i + 1} resolved schema '${schemaConfig.alias}': ${schemaConfig.url}`);
                })
                .catch((error) => {
                    console.error(`❌ Client ${i + 1} failed to resolve schema '${schemaConfig.alias}' ${schemaConfig.url}:`, error);
                    throw error;
                });
            
            resolvePromises.push(resolvePromise);
        }
    }
    
    // Wait for all schema OOBI resolutions to complete
    try {
        await Promise.all(resolvePromises);
        console.log(`🎉 Successfully resolved ${schemaConfigs.length} schema(s) for ${clients.length} client(s)`);
        prMessage(`Total operations: ${schemaConfigs.length * clients.length} schema OOBI resolutions completed`);
    } catch (error) {
        console.error("❌ Failed to resolve all schema OOBIs:", error);
        throw error;
    }
}

/**
 * Issues an edge credential with edge and rules data, then grants it to the target entity.
 * This is a complete workflow that includes credential issuance, granting, and notification waiting.
 * 
 * @param issuerClient - any of the issuing entity
 * @param issuerAlias - Alias of the issuing entity
 * @param issuerRegistrySaid - Registry SAID of the issuing entity
 * @param schemaSaid - Schema SAID for the credential
 * @param targetClient - any of the target entity (recipient)
 * @param targetPrefix - Prefix of the target entity
 * @param credentialData - The main credential data object
 * @param edgeData - The edge data object (pre-computed)
 * @param rules - The rules data object (pre-computed)
 * @returns Promise containing the credential SAID, grant notification, and full credential object
 */
export async function issueEdgeCredential(
    issuerClient: any,
    issuerAlias: string,
    issuerRegistrySaid: string,
    schemaSaid: string,
    targetClient: any,
    targetPrefix: string,
    credentialData: any,
    edgeData: any,
    rules: any
): Promise<{credentialSaid: string, credential: any}> {

    // Issue credential
    prSubTitle("Issuing Edge Credential");
    const { credentialSaid } = await issueCredential(
        issuerClient, 
        issuerAlias, 
        issuerRegistrySaid, 
        schemaSaid, 
        targetPrefix,
        credentialData, 
        edgeData, 
        rules
    );

    // Get credential with all its data
    prSubTitle("Granting Edge Credential");
    const issuedCredential = await issuerClient.credentials().get(credentialSaid);

    // Grant credential via IPEX
    const grantResponse = await ipexGrantCredential(
        issuerClient, 
        issuerAlias, 
        targetPrefix, 
        issuedCredential
    );  
    
    return {
        credentialSaid,
        credential: issuedCredential
    };
}
 
export async function Setup() {
  try {
    await initializeSignify();  
    
    prTitle('Setup Script Starting');
    
    // Create all clients first
    const gleifClient = await initializeAndConnectClient(GLEIF.bran);
    const qviClient = await initializeAndConnectClient(QVI.bran);
    const acmeClient = await initializeAndConnectClient(ACME_INC.bran);
    const crifClient = await initializeAndConnectClient(CRIF.bran);
  
    prSubTitle('Initializing GLEIF');
    const gleifEntity = await createEntity(gleifClient.client, GLEIF.bran, GLEIF.alias);
  
    prSubTitle('Initializing Qualified vLEI Issuer');  
    const qviEntity = await createEntity(qviClient.client, QVI.bran, QVI.alias);
  
    prSubTitle('Initializing ACME INC');  
    const acmeEntity = await createEntity(acmeClient.client, ACME_INC.bran, ACME_INC.alias);
    
    prSubTitle('Initializing CRIF');  
    const crifEntity = await createEntity(crifClient.client, CRIF.bran, CRIF.alias);
  
    prContinue();
  }
  catch(err) {
    console.error('Fatal error running setup.ts:', err);
  }
}
