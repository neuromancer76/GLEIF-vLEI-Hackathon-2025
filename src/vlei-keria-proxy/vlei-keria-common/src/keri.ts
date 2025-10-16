import signify from 'signify-ts';
import {
    randomPasscode,
    ready,
    Tier,
    CreateIdentiferArgs,
    Operation,
    Salter,
    Serder
} from 'signify-ts';


import {
    DEFAULT_ADMIN_URL,
    DEFAULT_BOOT_URL,
    DEFAULT_DELAY_MS,
    DEFAULT_RETRIES,
    DEFAULT_IDENTIFIER_ARGS
} from './constants.js';

/**
 * Initializes the Signify-ts library.
 */
export async function initializeSignify() {
    await ready();
    console.log('Signify-ts library initialized.');
}

/**
 * Creates a new SignifyClient instance, boots it, and connects to the KERIA agent.
 *
 * @returns {Promise<{ client: any; bran: string; clientState: State }>}
 * The initialized client, its bran, and state. 
 */
export async function initializeAndConnectClient(
    bran: string,
    adminUrl: string = DEFAULT_ADMIN_URL,
    bootUrl: string = DEFAULT_BOOT_URL,
    tier: Tier = Tier.low
): Promise<{ client: any; clientState: any }> {

    console.log(`Using Passcode (bran): ${bran}`);

    const client = new (signify as any).SignifyClient(adminUrl, bran, tier, bootUrl);

    try {
        await client.boot();
        console.log('Client boot process initiated with KERIA agent.');

        await client.connect();
    const clientState: any = await client.state();

    console.log('  Client AID Prefix: ', clientState?.controller?.state?.i);
    console.log('  Agent AID Prefix:  ', clientState?.agent?.i);

        return { client, clientState };
    } catch (error) {
        console.error('Failed to initialize or connect client:', error);
        throw error;
    }
}

/**
 * Creates a new AID using the provided client.
 *
 * @param {SignifyClient} client - The initialized SignifyClient.
 * @param {string} alias - A human-readable alias for the AID.
 * @param {CreateIdentiferArgs} [identifierArgs=DEFAULT_IDENTIFIER_ARGS] - Configuration for the new AID.
 * @returns {Promise<{ aid: any; operation: Operation<T> }>} The created AID's inception event and the operation details.
 */
export async function createNewAID(
    client: any,
    alias: string,
    identifierArgs: CreateIdentiferArgs = DEFAULT_IDENTIFIER_ARGS
): Promise<{ aid: any; operation: Operation<any> }> {
    console.log(`Initiating AID inception for alias: ${alias}`);
    try {
        const inceptionResult = await client.identifiers().create(alias, identifierArgs as any);
        const operationDetails = await inceptionResult.op();

        const completedOperation: any = await client
            .operations()
            .wait(operationDetails);

        if (completedOperation.error) {
            throw new Error(`AID creation failed: ${JSON.stringify(completedOperation.error)}`);
        }

    const newAidInceptionEvent: any = completedOperation.response || {};
        console.log(`Successfully created AID with prefix: ${newAidInceptionEvent?.i}`);

        await client.operations().delete(completedOperation.name);

        return { aid: newAidInceptionEvent, operation: completedOperation };
    } catch (error) {
        console.error(`Failed to create AID for alias "${alias}":`, error);
        throw error;
    }
}

/**
 * Assigns an end role for a given AID to the client's KERIA Agent AID.
 *
 * @returns {Promise<{ operation: Operation<T> }>} The operation details.
 */
export async function addEndRoleForAID(
    client: any,
    aidAlias: string,
    role: string
): Promise<{ operation: Operation<any> }> {
    if (!client.agent?.pre) {
        throw new Error('Client agent prefix is not available.');
    }
    const agentAIDPrefix = client.agent.pre;

    console.log(`Assigning '${role}' role to KERIA Agent ${agentAIDPrefix} for AID alias ${aidAlias}`);
    try {
        const addRoleResult = await client
            .identifiers()
            .addEndRole(aidAlias, role, agentAIDPrefix);

        const operationDetails = await addRoleResult.op();

        const completedOperation: any = await client
            .operations()
            .wait(operationDetails);

        console.log(`Successfully assigned '${role}' role for AID alias ${aidAlias}.`);

        await client.operations().delete(completedOperation.name);

        return { operation: completedOperation };
    } catch (error) {
        console.error(`Failed to add end role for AID alias "${aidAlias}":`, error);
        throw error;
    }
}

/**
 * Assigns agent role to a client's KERIA Agent AID for a specific entity alias.
 * This is a convenience function that wraps the addEndRole operation.
 * It gracefully handles cases where the role is already assigned.
 *
 * @param {any} clientEntity - The client entity object containing the SignifyClient.
 * @param {string} entityAlias - The alias of the entity to assign the agent role for.
 * @param {string} [role='agent'] - The role to assign (defaults to 'agent').
 * @returns {Promise<{ response: any; alreadyAssigned?: boolean }>} The operation response.
 */
export async function assignAgentRole(
    clientEntity: { client: any },
    entityAlias: string,
    role: string = 'agent'
): Promise<{ response: any; alreadyAssigned?: boolean }> {
    console.log(`\n=== Assigning '${role}' role for ${entityAlias} ===`);
    
    if (!clientEntity.client.agent?.pre) {
        throw new Error(`Client agent prefix is not available for ${entityAlias}.`);
    }

    try {
       const response = await addEndRoleForAID(clientEntity.client, entityAlias, role);
       const issuerOOBI = await generateOOBI(clientEntity.client, entityAlias, role);
       console.log(`${entityAlias} generated OOBI for aidA: ${issuerOOBI}`);

        return { response };
    } catch (error: any) {
        // Check if the error is due to role already being assigned
        if (error.message && error.message.includes('unable to verify end role reply message')) {
            console.log(`'${role}' role for ${entityAlias} is already assigned - skipping.`);
            return { response: null, alreadyAssigned: true };
        }
        
        console.error(`Failed to assign '${role}' role for ${entityAlias}:`, error);
        throw error;
    }
}

/**
 * Creates an Establishment Credential Registry (ECR) for a Legal Entity.
 * This is a convenience function for creating additional credential registries.
 *
 * @param {any} clientEntity - The client entity object containing the SignifyClient.
 * @param {string} entityAlias - The alias of the entity to create the ECR for.
 * @param {string} [registryName] - Optional custom name for the registry (defaults to "{entityAlias}ECR").
 * @returns {Promise<{ registrySaid: string; registryName: string }>} The registry SAID and name.
 */
export async function createECRRegistry(
    clientEntity: { client: any },
    entityAlias: string,
    registryName?: string
): Promise<{ registrySaid: string; registryName: string }> {
    const ecrRegistryName = registryName || `${entityAlias}ECR`;
    
    console.log(`\n=== Creating ECR Registry for ${entityAlias} ===`);
    
    try {
        // Check if registry already exists
        const existingRegistries = await clientEntity.client.registries().list(entityAlias);
        const existingECR = existingRegistries.find((reg: any) => reg.name === ecrRegistryName);
        
        if (existingECR) {
            console.log(`ECR Registry "${ecrRegistryName}" already exists with SAID: ${existingECR.regk}`);
            return { registrySaid: existingECR.regk, registryName: ecrRegistryName };
        }
        
        // Create new ECR registry
        const { registrySaid } = await createCredentialRegistry(
            clientEntity.client, 
            entityAlias, 
            ecrRegistryName
        );
        
        console.log(`Successfully created ECR Registry "${ecrRegistryName}" with SAID: ${registrySaid}`);
        
        return { registrySaid, registryName: ecrRegistryName };
    } catch (error) {
        console.error(`Failed to create ECR Registry for ${entityAlias}:`, error);
        throw error;
    }
}

/**
 * Generates an OOBI URL for a given AID and role.
 * The arguments for client.oobis().get() are passed directly.
 *
 * @returns {Promise<string>} The generated OOBI URL.
 */
export async function generateOOBI(
    client: any,
    aidAlias: string,
    role: string = 'agent'
): Promise<string> {
    console.log(`Generating OOBI for AID alias ${aidAlias} with role ${role}`);
    try {
        const oobiResult = await client.oobis().get(aidAlias, role);
        if (!oobiResult?.oobis?.length) {
            throw new Error(`No OOBI URL returned from KERIA agent for AID alias ${aidAlias} with role ${role}.`);
        }
        const oobiUrl = oobiResult.oobis[0];
        console.log(`Generated OOBI URL: ${oobiUrl}`);
        return oobiUrl;
    } catch (error) {
        console.error(`Failed to generate OOBI for AID alias "${aidAlias}":`, error);
        throw error;
    }
}

/**
 * Resolves an OOBI URL
 *
 * @returns {Promise<{ operation: Operation<T>; contacts?: Contact[] }>} The operation details and the resolved contact.
 */
export async function resolveOOBI(
    client: any,
    oobiUrl: string,
    contactAlias?: string
): Promise<{ operation: Operation<any>; contacts?: any[] }> { 
    console.log(`Resolving OOBI URL: ${oobiUrl} with alias ${contactAlias}`);
    try {
        const resolveOperationDetails = await client.oobis().resolve(oobiUrl, contactAlias);
        const completedOperation: any = await client
            .operations()
            .wait(resolveOperationDetails);

        if (completedOperation.error) {
            throw new Error(`OOBI resolution failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully resolved OOBI URL. Response:`, completedOperation.response ? "OK" : "No response data");

    const contacts: any = await client.contacts().list(undefined, 'alias', contactAlias);

        if (contacts) {
            console.log(`Contact "${contactAlias}" added/updated.`);
        } else {
            console.warn(`Contact "${contactAlias}" not found after OOBI resolution.`);
        }

        await client.operations().delete(completedOperation.name);
        
        return { operation: completedOperation, contacts };
    } catch (error) {
        console.error(`Failed to resolve OOBI URL "${oobiUrl}":`, error);
        throw error;
    }
}

/**
 * Resolves schema OOBIs for multiple clients from a schema server.
 * This is a convenience function that resolves multiple schemas for multiple clients.
 *
 * @param {Array<{client: any}>} clientEntities - Array of client entities containing SignifyClients.
 * @param {Array<{schemaSaid: string, schemaOOBI?: string}>} schemas - Array of schema objects with SAID and optional OOBI URL.
 * @param {string} [schemaServerHost] - The schema server host URL (defaults to SCHEMA_SERVER_HOST from constants).
 * @param {string} [contactAliasPrefix='schemaContact'] - Prefix for contact aliases (will append schema index).
 * @returns {Promise<void>}
 */
export async function resolveSchemaOOBIs(
    clientEntities: Array<{ client: any }>,
    schemas: Array<{ schemaSaid: string; schemaOOBI?: string }>,
    schemaServerHost?: string,
    contactAliasPrefix: string = 'schemaContact'
): Promise<void> {
    console.log(`\n=== Resolving Schema OOBIs ===`);
    console.log(`Resolving ${schemas.length} schema(s) for ${clientEntities.length} client(s)...`);
    
    // Import the schema server host from constants if not provided
    const { SCHEMA_SERVER_HOST } = await import('./constants.js');
    const serverHost = schemaServerHost || SCHEMA_SERVER_HOST;
    
    try {
        for (let schemaIndex = 0; schemaIndex < schemas.length; schemaIndex++) {
            const schema = schemas[schemaIndex];
            const schemaContactAlias = schemas.length > 1 
                ? `${contactAliasPrefix}${schemaIndex + 1}` 
                : contactAliasPrefix;
            
            // Generate OOBI URL if not provided
            const schemaOOBI = schema.schemaOOBI || `${serverHost}/oobi/${schema.schemaSaid}`;
            
            console.log(`\n--- Resolving Schema ${schemaIndex + 1}/${schemas.length} ---`);
            console.log(`Schema SAID: ${schema.schemaSaid}`);
            console.log(`Schema OOBI: ${schemaOOBI}`);
            console.log(`Contact Alias: ${schemaContactAlias}`);
            
            // Resolve the schema OOBI for each client
            for (let clientIndex = 0; clientIndex < clientEntities.length; clientIndex++) {
                const clientEntity = clientEntities[clientIndex];
                
                console.log(`  Resolving for client ${clientIndex + 1}/${clientEntities.length}...`);
                
                try {
                    await resolveOOBI(clientEntity.client, schemaOOBI, schemaContactAlias);
                    console.log(`  ✅ Successfully resolved for client ${clientIndex + 1}`);
                } catch (error) {
                    console.error(`  ❌ Failed to resolve for client ${clientIndex + 1}:`, error);
                    // Continue with other clients even if one fails
                }
            }
        }
        
        console.log(`\n✅ Schema OOBI resolution completed for all clients and schemas.`);
        
    } catch (error) {
        console.error('Failed to resolve schema OOBIs:', error);
        throw error;
    }
}

/**
 * Performs mutual OOBI resolution between two entities.
 * Entity A resolves Entity B's OOBI, and Entity B resolves Entity A's OOBI.
 *
 * @param {any} clientEntityA - The first client entity object containing SignifyClient.
 * @param {any} clientEntityB - The second client entity object containing SignifyClient.
 * @param {any} entityA - The first entity data object containing alias and oobi.
 * @param {any} entityB - The second entity data object containing alias and oobi.
 * @returns {Promise<void>}
 */
export async function resolveMutualOOBIs(
    clientEntityA: { client: any },
    clientEntityB: { client: any },
    entityA: { alias: string; oobi: string },
    entityB: { alias: string; oobi: string }
): Promise<void> {
    console.log(`\n=== Mutual OOBI Resolution ===`);
    console.log(`Establishing mutual contact between ${entityA.alias} and ${entityB.alias}...`);
    
    try {
        // Entity A resolves Entity B's OOBI
        const holderContactAlias = `${entityB.alias}ContactFor${entityA.alias}`;
        console.log(`${entityA.alias} resolving ${entityB.alias}'s OOBI...`);
        await resolveOOBI(clientEntityA.client, entityB.oobi, holderContactAlias);
        
        // Entity B resolves Entity A's OOBI  
        const issuerContactAlias = `${entityA.alias}ContactFor${entityB.alias}`;
        console.log(`${entityB.alias} resolving ${entityA.alias}'s OOBI...`);
        await resolveOOBI(clientEntityB.client, entityA.oobi, issuerContactAlias);
        
        console.log(`✅ Mutual OOBI resolution completed between ${entityA.alias} and ${entityB.alias}.`);
        
    } catch (error) {
        console.error(`Failed to perform mutual OOBI resolution between ${entityA.alias} and ${entityB.alias}:`, error);
        throw error;
    }
}

/**
 * Generates challenge words for authentication.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {number} [strength=128] - The bit strength for the challenge (e.g., 128, 256).
 * @returns {Promise<string[]>} A promise that resolves to an array of challenge words.
 */
export async function generateChallengeWords(
    client: any,
    strength: number = 128
): Promise<string[]> {
    console.log(`Generating ${strength}-bit challenge words...`);
    try {
        const challenge = await client.challenges().generate(strength);
        console.log('Generated challenge words:', challenge.words);
        return challenge.words;
    } catch (error) {
        console.error('Failed to generate challenge words:', error);
        throw error;
    }
}

/**
 * Responds to a challenge by signing the words and sending them to the challenger.
 * @param {SignifyClient} client - The SignifyClient instance of the responder.
 * @param {string} sourceAidAlias - The alias of the AID that is responding (signing).
 * @param {string} recipientAidPrefix - The AID prefix of the challenger (to whom the response is sent).
 * @param {string[]} challengeWords - The array of challenge words to sign.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export async function respondToChallenge(
    client: any,
    sourceAidAlias: string,
    recipientAidPrefix: string,
    challengeWords: string[]
): Promise<void> {
    console.log(`AID alias '${sourceAidAlias}' responding to challenge from AID '${recipientAidPrefix}'...`);
    try {
        await client.challenges().respond(sourceAidAlias, recipientAidPrefix, challengeWords);
        console.log('Challenge response sent.');
    } catch (error) {
        console.error('Failed to respond to challenge:', error);
        throw error;
    }
}

/**
 * Verifies a challenge response received from another AID.
 * @param {SignifyClient} client - The SignifyClient instance of the verifier.
 * @param {string} allegedSenderAidPrefix - The AID prefix of the AID that allegedly sent the response.
 * @param {string[]} originalChallengeWords - The original challenge words that were sent.
 * @returns {Promise<{ verified: boolean; said?: string; operation: Operation<T> }>}
 * A promise that resolves to an object indicating if verification was successful,
 * the SAID of the signed exchange message, and the operation details.
 */
export async function verifyChallengeResponse(
    client: any,
    allegedSenderAidPrefix: string,
    originalChallengeWords: string[]
): Promise<{ verified: boolean; said?: string; operation: Operation<any> }> {
    console.log(`Verifying challenge response from AID '${allegedSenderAidPrefix}'...`);
    try {
        const verifyOperation = await client.challenges().verify(allegedSenderAidPrefix, originalChallengeWords);
        const completedOperation: any = await client
            .operations()
            .wait(verifyOperation);

        if (completedOperation.error) {
            console.error('Challenge verification failed:', completedOperation.error);
            await client.operations().delete(completedOperation.name);
            return { verified: false, operation: completedOperation };
        }

    const said = completedOperation.response?.exn?.d;
        console.log(`Challenge response verified successfully. SAID of exn: ${said}`);
        
        await client.operations().delete(completedOperation.name);

        return { verified: true, said: said, operation: completedOperation };
    } catch (error) {
        console.error('Failed to verify challenge response:', error);
        throw error;
    }
}

/**
 * Marks a challenge for a contact as authenticated.
 * This is done after successful verification of a challenge response.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} contactAidPrefix - The AID prefix of the contact to mark as authenticated.
 * @param {string} signedChallengeSaid - The SAID of the signed challenge exchange message (exn).
 * @returns {Promise<void>} A promise that resolves when the contact is marked.
 */
export async function markChallengeAuthenticated(
    client: any,
    contactAidPrefix: string,
    signedChallengeSaid: string
): Promise<void> {
    console.log(`Marking challenge for contact AID '${contactAidPrefix}' as authenticated with SAID '${signedChallengeSaid}'...`);
    try {
        await client.challenges().responded(contactAidPrefix, signedChallengeSaid);
        console.log(`Contact AID '${contactAidPrefix}' marked as authenticated.`);
    } catch (error) {
        console.error(`Failed to mark challenge as authenticated for contact AID '${contactAidPrefix}':`, error);
        throw error;
    }
}

export function createTimestamp() {
    return new Date().toISOString().replace('Z', '000+00:00');
}

/**
 * Creates a new credential registry for an AID.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} aidAlias - The alias of the AID creating the registry.
 * @param {string} registryName - A human-readable name for the registry.
 * @returns {Promise<{ registry: any; operation: Operation<any> }>} The created registry details and operation.
 */
export async function createCredentialRegistry(
    client: any,
    aidAlias: string,
    registryName: string
): Promise<{ registrySaid: any; operation: Operation<any> }> {
    console.log(`Creating credential registry "${registryName}" for AID alias "${aidAlias}"...`);
    try {
        const createRegistryResult = await client
            .registries()
            .create({ name: aidAlias, registryName: registryName });

        const operationDetails = await createRegistryResult.op();
        const completedOperation: any = await client
            .operations()
            .wait(operationDetails);

        if (completedOperation.error) {
            throw new Error(`Credential registry creation failed: ${JSON.stringify(completedOperation.error)}`);
        }

    const registrySaid = completedOperation?.response?.anchor?.i;
        console.log(`Successfully created credential registry: ${registrySaid}`);
        
        await client.operations().delete(completedOperation.name);
        return { registrySaid, operation: completedOperation };
    } catch (error) {
        console.error(`Failed to create credential registry "${registryName}":`, error);
        throw error;
    }
}

/**
 * Retrieves a schema by its SAID.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} schemaSaid - The SAID of the schema to retrieve.
 * @returns {Promise<any>} The schema object.
 */
export async function getSchema(
    client: any,
    schemaSaid: string
): Promise<any> {
    console.log(`Retrieving schema with SAID: ${schemaSaid}...`);
    try {
        const schema = await client.schemas().get(schemaSaid);
        console.log(`Successfully retrieved schema: ${schemaSaid}`);
        return schema;
    } catch (error) {
        console.error(`Failed to retrieve schema "${schemaSaid}":`, error);
        throw error;
    }
}

/**
 * Issues a new credential.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} issuerAidAlias - The alias of the issuing AID.
 * @param {string} registryIdentifier - The identifier (regk) of the registry.
 * @param {string} schemaSaid - The SAID of the credential's schema.
 * @param {string} holderAidPrefix - The prefix of the AID to whom the credential will be issued.
 * @param {any} credentialClaims - The claims/attributes of the credential.
 * @returns {Promise<{ credentialSad: any; credentialSaid: string; operation: Operation<any> }>} The issued credential's SAD, SAID, and operation.
 */
export async function issueCredential(
    client: any,
    issuerAidAlias: string,
    registryIdentifier: string,
    schemaSaid: string,
    holderAidPrefix: string,
    credentialClaims: any,
    edges?: any,
    rules?: any,
    salt = false
): Promise<{ credentialSaid: string; operation: Operation<any> }> {
    console.log(`Issuing credential from AID "${issuerAidAlias}" to AID "${holderAidPrefix}"...`);
    try {
        
        const issueResult = await client
            .credentials()
            .issue(
                issuerAidAlias,
                {
                    ri: registryIdentifier,
                    s: schemaSaid,
                    u: salt ? new Salter({}).qb64 : undefined,
                    a: {
                        i: holderAidPrefix,
                        ...credentialClaims
                    },
                    e: edges,
                    r: rules
                });

        const operationDetails = issueResult.op;
        const completedOperation: any = await client
            .operations()
            .wait(operationDetails);

        if (completedOperation.error) {
            throw new Error(`Credential issuance failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(completedOperation) // ************
    const credentialSad: any = completedOperation.response || {}; // The full Self-Addressing Data (SAD) of the credential
    const credentialSaid = credentialSad?.ced?.d; // The SAID of the credential
        console.log(`Successfully issued credential with SAID: ${credentialSaid}`);

        await client.operations().delete(completedOperation.name);
        return { credentialSaid, operation: completedOperation };
    } catch (error) {
        console.error('Failed to issue credential:', error);
        throw error;
    }
}


/**
 * Issues a new credential.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} issuerAidAlias - The alias of the issuing AID.
 * @param {string} registryIdentifier - The identifier (regk) of the registry.
 * @param {string} schemaSaid - The SAID of the credential's schema.
 * @param {string} holderAidPrefix - The prefix of the AID to whom the credential will be issued.
 * @param {any} credentialClaims - The claims/attributes of the credential.
 * @returns {Promise<{ credentialSad: any; credentialSaid: string; operation: Operation<any> }>} The issued credential's SAD, SAID, and operation.
 */
export async function issueCredentialObject(
    client: any,
    issuerAidAlias: string,
    recipiendAidPrefix: string,
    credentialClaims: any
) {
    
    try {
          const grantResponse = await ipexGrantCredential(
            client,
            issuerAidAlias, 
            recipiendAidPrefix,
            credentialClaims
        );   

    } catch (error) {
        console.error('Failed to issue credential:', error);
        throw error;
    }
}


/**
 * Submits an IPEX grant for a credential.
 * @param {SignifyClient} client - The SignifyClient instance of the issuer.
 * @param {string} senderAidAlias - The alias of the AID granting the credential.
 * @param {string} recipientAidPrefix - The AID prefix of the recipient (holder).
 * @param {any} acdc - The ACDC (credential).
 * @returns {Promise<{ operation: Operation<any> }>} The operation details.
 */
export async function ipexGrantCredential(
    client: any,
    senderAidAlias: string,
    recipientAidPrefix: string,
    acdc: any
): Promise<{ operation: Operation<any> }> {
    console.log(`AID "${senderAidAlias}" granting credential to AID "${recipientAidPrefix}" via IPEX...`);
    try {
       
        const [grant, gsigs, gend] = await client.ipex().grant({
            senderName: senderAidAlias,
            acdc: new Serder(acdc?.sad),
            iss: new Serder(acdc?.iss),
            anc: new Serder(acdc?.anc),
            ancAttachment: acdc.ancatc,
            recipient: recipientAidPrefix,
            datetime: createTimestamp(),
        });

        const submitGrantOperationDetails = await client
            .ipex()
            .submitGrant(senderAidAlias, grant, gsigs, gend, [recipientAidPrefix]);
        
        const completedOperation: any = await client
            .operations()
            .wait(submitGrantOperationDetails);

        if (completedOperation.error) {
            throw new Error(`IPEX grant submission failed: ${JSON.stringify(completedOperation.error)}`);
        }

        console.log(`Successfully submitted IPEX grant from "${senderAidAlias}" to "${recipientAidPrefix}".`);
        await client.operations().delete(completedOperation.name);
        return { operation: completedOperation };
    } catch (error) {
        console.error('Failed to submit IPEX grant:', error);
        throw error;
    }
}

/**
 * Retrieves the state of a credential.
 * Includes retry logic as this might be called before the information has propagated.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} registryIdentifier - The registry identifier (regk).
 * @param {string} credentialSaid - The SAID of the credential.
 * @param {number} [retries=DEFAULT_RETRIES] - Number of retry attempts.
 * @param {number} [delayMs=DEFAULT_DELAY_MS] - Delay between retries in milliseconds.
 * @returns {Promise<any>} The credential state.
 */
export async function getCredentialState(
    client: any,
    registryIdentifier: string,
    credentialSaid: string,
    retries: number = DEFAULT_RETRIES,
    delayMs: number = DEFAULT_DELAY_MS
): Promise<any> {
    console.log(`Querying credential state for SAID "${credentialSaid}" in registry "${registryIdentifier}"...`);
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const credentialState = await client.credentials().state(registryIdentifier, credentialSaid);
            console.log('Successfully retrieved credential state.');
            return credentialState;
        } catch (error: any) {
            console.warn(`[Attempt ${attempt}/${retries}] Failed to get credential state: ${error.message}`);
            if (attempt === retries) {
                console.error(`Max retries (${retries}) reached for getting credential state.`);
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    // Should not be reached if retries > 0
    throw new Error('Failed to get credential state after all retries.');
}

/**
 * Waits for and retrieves a specific notification.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} expectedRoute - The expected route in the notification attributes (e.g., IPEX_GRANT_ROUTE).
 * @param {number} [retries=DEFAULT_RETRIES] - Number of retry attempts.
 * @param {number} [delayMs=DEFAULT_DELAY_MS] - Delay between retries in milliseconds.
 * @returns {Promise<any>} The first matching unread notification.
 */
export async function waitForAndGetNotification(
    client: any,
    expectedRoute: string,
    retries: number = DEFAULT_RETRIES,
    delayMs: number = DEFAULT_DELAY_MS
): Promise<any> {
    console.log(`Waiting for notification with route "${expectedRoute}"...`);
    
    let notifications;
    
    // Retry loop to fetch notifications.
    for (let attempt = 1; attempt <= DEFAULT_RETRIES ; attempt++) {
        try{
            // List notifications, filtering for unread IPEX_GRANT_ROUTE messages.
            let allNotifications = await client.notifications().list()
            notifications = allNotifications.notes.filter(
                (n: any) => n.a.r === expectedRoute && n.r === false // n.r is 'read' status
            );
            if(notifications.length === 0){ 
                throw new Error("Notification not found yet."); // Throw error to trigger retry
            }
            return notifications;     
        }
        catch (error){    
             console.log(`[Retry] Grant notification not found on attempt #${attempt} of ${DEFAULT_RETRIES}`);
             if (attempt === DEFAULT_RETRIES) {
                 console.error(`[Retry] Max retries (${DEFAULT_RETRIES}) reached for grant notification.`);
                 throw error; 
             }
             console.log(`[Retry] Waiting ${DEFAULT_DELAY_MS}ms before next attempt...`);
             await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY_MS));
        }
    }
}

/**
 * Submits an IPEX admit (accepts a grant).
 * @param {SignifyClient} client - The SignifyClient instance of the holder.
 * @param {string} senderAidAlias - The alias of the AID admitting the grant.
 * @param {string} recipientAidPrefix - The AID prefix of the original grantor.
 * @param {string} grantSaid - The SAID of the grant being admitted.
 * @param {string} [message=''] - Optional message for the admit.
 * @returns {Promise<{ operation: Operation<any> }>} The operation details.
 */
export async function ipexAdmitGrant(
    client: any,
    senderAidAlias: string,
    recipientAidPrefix: string,
    grantSaid: string,
    message: string = ''
): Promise<{ operation: Operation<any> }> {
    console.log(`AID "${senderAidAlias}" admitting IPEX grant "${grantSaid}" from AID "${recipientAidPrefix}"...`);
    try {
        const [admit, sigs, aend] = await client.ipex().admit({
            senderName: senderAidAlias,
            message: message,
            grantSaid: grantSaid,
            recipient: recipientAidPrefix,
            datetime: createTimestamp(),
        });

        const admitOperationDetails = await client
            .ipex()
            .submitAdmit(senderAidAlias, admit, sigs, aend, [recipientAidPrefix]);
        
        const completedOperation: any = await client
            .operations()
            .wait(admitOperationDetails);

        if (completedOperation.error) {
            throw new Error(`IPEX admit submission failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully submitted IPEX admit for grant "${grantSaid}".`);
        await client.operations().delete(completedOperation.name);
        return { operation: completedOperation };
    } catch (error) {
        console.error('Failed to submit IPEX admit:', error);
        throw error;
    }
}

/**
 * Marks a notification as read.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} notificationId - The ID of the notification to mark.
 * @returns {Promise<void>}
 */
export async function markNotificationRead(
    client: any,
    notificationId: string
): Promise<void> {
    console.log(`Marking notification "${notificationId}" as read...`);
    try {
        await client.notifications().mark(notificationId);
        console.log(`Notification "${notificationId}" marked as read.`);
    } catch (error) {
        console.error(`Failed to mark notification "${notificationId}" as read:`, error);
        throw error;
    }
}

/**
 * Deletes a notification.
 * @param {SignifyClient} client - The SignifyClient instance.
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<void>}
 */
export async function deleteNotification(
    client: any,
    notificationId: string
): Promise<void> {
    console.log(`Deleting notification "${notificationId}"...`);
    try {
        await client.notifications().delete(notificationId);
        console.log(`Notification "${notificationId}" deleted.`);
    } catch (error) {
        console.error(`Failed to delete notification "${notificationId}":`, error);
        throw error;
    }
}


//--------------------------------------------------------------------------------

// --- Credential Presentation Functions ---

/**
 * Submits an IPEX apply (presentation request).
 * @param {SignifyClient} client - The SignifyClient instance of the verifier.
 * @param {string} senderAidAlias - The alias of the AID applying for presentation.
 * @param {string} recipientAidPrefix - The AID prefix of the holder.
 * @param {string} schemaSaid - The SAID of the schema being requested.
 * @param {any} attributes - The attributes being requested for the credential.
 * @param {string} datetime - The timestamp for the apply.
 * @returns {Promise<{ operation: Operation<any>; applySaid: string }>} The operation details and SAID of the apply exn.
 */
export async function ipexApplyForCredential(
    client: any,
    senderAidAlias: string,
    recipientAidPrefix: string,
    schemaSaid: string,
    attributes: any,
    datetime: string
): Promise<{ operation: Operation<any>; applySaid: string }> {
    console.log(`AID "${senderAidAlias}" applying for credential presentation from AID "${recipientAidPrefix}"...`);
    try {
        const [apply, sigs, _] = await client.ipex().apply({
            senderName: senderAidAlias,
            schemaSaid: schemaSaid,
            attributes: attributes,
            recipient: recipientAidPrefix,
            datetime: datetime,
        });
        
    const applySerder: any = new Serder(apply as any);
    const applySaid = applySerder.said || applySerder.ked?.d; // attempt to derive SAID

        const applyOperationDetails = await client
            .ipex()
            .submitApply(senderAidAlias, apply, sigs, [recipientAidPrefix]);

        const completedOperation: any = await client
            .operations()
            .wait(applyOperationDetails);

        if (completedOperation.error) {
            throw new Error(`IPEX apply submission failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully submitted IPEX apply with SAID "${applySaid}".`);
        await client.operations().delete(completedOperation.name);
        return { operation: completedOperation, applySaid };
    } catch (error) {
        console.error('Failed to submit IPEX apply:', error);
        throw error;
    }
}

/**
 * Finds matching credentials based on a filter.
 * @param {SignifyClient} client - The SignifyClient instance of the holder.
 * @param {any} filter - The filter object to apply (e.g., { '-s': schemaSaid, '-a-attributeName': value }).
 * @returns {Promise<any[]>} An array of matching credentials.
 */
export async function findMatchingCredentials(
    client: any,
    filter: any
): Promise<any[]> {
    console.log('Finding matching credentials with filter:', filter);
    try {
        const matchingCredentials = await client.credentials().list({ filter });
        console.log(`Found ${matchingCredentials.length} matching credentials.`);
        return matchingCredentials;
    } catch (error) {
        console.error('Failed to find matching credentials:', error);
        throw error;
    }
}

/**
 * Submits an IPEX offer (presents a credential).
 * @param {SignifyClient} client - The SignifyClient instance of the holder.
 * @param {string} senderAidAlias - The alias of the AID offering the credential.
 * @param {string} recipientAidPrefix - The AID prefix of the verifier.
 * @param {any} acdcSad - The Self-Addressing Data (SAD) of the ACDC being offered.
 * @param {string} applySaid - The SAID of the IPEX apply message this offer is responding to.
 * @param {string} datetime - The timestamp for the offer.
 * @returns {Promise<{ operation: Operation<any> }>} The operation details.
 */
export async function ipexOfferCredential(
    client: any,
    senderAidAlias: string,
    recipientAidPrefix: string,
    acdcSad: any, // This is the SAD of the credential to be offered
    applySaid: string,
    datetime: string
): Promise<{ operation: Operation<any> }> {
    console.log(`AID "${senderAidAlias}" offering credential to AID "${recipientAidPrefix}" in response to apply "${applySaid}"...`);
    try {
        const [offer, sigs, end] = await client.ipex().offer({
            senderName: senderAidAlias,
            recipient: recipientAidPrefix,
            acdc: new Serder(acdcSad), // The credential SAD needs to be wrapped in Serder
            applySaid: applySaid,
            datetime: datetime,
        });

        const offerOperationDetails = await client
            .ipex()
            .submitOffer(senderAidAlias, offer, sigs, end, [recipientAidPrefix]);
        
        const completedOperation: any = await client
            .operations()
            .wait(offerOperationDetails);

        if (completedOperation.error) {
            throw new Error(`IPEX offer submission failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully submitted IPEX offer in response to apply "${applySaid}".`);
        await client.operations().delete(completedOperation.name);
        return { operation: completedOperation };
    } catch (error) {
        console.error('Failed to submit IPEX offer:', error);
        throw error;
    }
}

/**
 * Submits an IPEX agree (verifier agrees to the offered credential).
 * @param {SignifyClient} client - The SignifyClient instance of the verifier.
 * @param {string} senderAidAlias - The alias of the AID agreeing to the offer.
 * @param {string} recipientAidPrefix - The AID prefix of the holder who made the offer.
 * @param {string} offerSaid - The SAID of the IPEX offer message being agreed to.
 * @param {string} datetime - The timestamp for the agree.
 * @returns {Promise<{ operation: Operation<any> }>} The operation details.
 */
export async function ipexAgreeToOffer(
    client: any,
    senderAidAlias: string,
    recipientAidPrefix: string,
    offerSaid: string,
    datetime: string
): Promise<{ operation: Operation<any> }> {
    console.log(`AID "${senderAidAlias}" agreeing to IPEX offer "${offerSaid}" from AID "${recipientAidPrefix}"...`);
    try {
        const [agree, sigs, _] = await client.ipex().agree({
            senderName: senderAidAlias,
            recipient: recipientAidPrefix,
            offerSaid: offerSaid,
            datetime: datetime,
        });

        const agreeOperationDetails = await client
            .ipex()
            .submitAgree(senderAidAlias, agree, sigs, [recipientAidPrefix]);

        const completedOperation: any = await client
            .operations()
            .wait(agreeOperationDetails);

        if (completedOperation.error) {
            throw new Error(`IPEX agree submission failed: ${JSON.stringify(completedOperation.error)}`);
        }
        console.log(`Successfully submitted IPEX agree for offer "${offerSaid}".`);
        await client.operations().delete(completedOperation.name);
        return { operation: completedOperation };
    } catch (error) {
        console.error('Failed to submit IPEX agree:', error);
        throw error;
    }
}

/**
 * Micro-step 1: Login - One entity challenges another by generating challenge words
 * @param {string} challengerBran - The bran (passcode) of the entity issuing the challenge
 * @param {string} challengerAlias - The alias of the challenging entity
 * @param {string} responderPrefix - The AID prefix of the entity being challenged
 * @param {string} responderOOBI - The OOBI URL of the entity being challenged
 * @param {string} responderAlias - The alias of the entity being challenged
 * @returns {Promise<string[]>} The generated challenge words
 */
export async function loginChallenge(
    challengerBran: string,
    challengerAlias: string,
    responderPrefix: string,
    responderOOBI: string,
    responderAlias: string
): Promise<string[]> {
    console.log(`\n--- ${challengerAlias} challenges ${responderPrefix} ---`);
    
    // Initialize challenger client
    const { client: challengerClient } = await initializeAndConnectClient(challengerBran);
    
    // Resolve responder's OOBI to establish contact
    const contactAlias = `${responderAlias}sContactFor${challengerAlias}`;
    console.log(`Resolving ${responderAlias}'s OOBI...`);
    await resolveOOBI(challengerClient, responderOOBI, contactAlias);
    
    // Generate challenge words
    const challengeWords = await generateChallengeWords(challengerClient);
    
    console.log(`Challenge generated by ${challengerAlias} for ${responderPrefix}`);
    return challengeWords;
}

/**
 * Micro-step 2: Accept Challenge - The challenged entity responds to the challenge
 * @param {string} responderBran - The bran (passcode) of the entity responding to the challenge
 * @param {string} responderAlias - The alias of the responding entity
 * @param {string} challengerPrefix - The AID prefix of the entity that issued the challenge
 * @param {string} challengerOOBI - The OOBI URL of the entity that issued the challenge
 * @param {string} challengerAlias - The alias of the entity that issued the challenge
 * @param {string[]} challengeWords - The challenge words to respond to
 * @returns {Promise<void>}
 */
export async function acceptChallenge(
    responderBran: string,
    responderAlias: string,
    challengerPrefix: string,
    challengerOOBI: string,
    challengerAlias: string,
    challengeWords: string[]
): Promise<void> {
    console.log(`\n${responderAlias} responding to ${challengerPrefix}'s challenge...`);
    
    // Initialize responder client
    const { client: responderClient } = await initializeAndConnectClient(responderBran);
    
    // Resolve challenger's OOBI to establish contact
    const contactAlias = `${challengerAlias}sContactFor${responderAlias}`;
    console.log(`Resolving ${challengerAlias}'s OOBI...`);
    await resolveOOBI(responderClient, challengerOOBI, contactAlias);
    
    await respondToChallenge(responderClient, responderAlias, challengerPrefix, challengeWords);
    console.log(`Challenge response sent by ${responderAlias}`);
}

/**
 * Micro-step 3: Verify Challenge - The challenger verifies the response and marks authentication
 * @param {string} challengerBran - The bran (passcode) of the entity that issued the challenge
 * @param {string} challengerAlias - The alias of the challenging entity
 * @param {string} responderPrefix - The AID prefix of the entity that responded
 * @param {string[]} originalChallengeWords - The original challenge words that were sent
 * @returns {Promise<boolean>} True if verification succeeded, false otherwise
 */
export async function verifyChallenge(
    challengerBran: string,
    challengerAlias: string,
    responderPrefix: string,
    originalChallengeWords: string[]
): Promise<boolean> {
    console.log(`\n${challengerAlias} verifying ${responderPrefix}'s response...`);
    
    // Initialize challenger client
    const { client: challengerClient } = await initializeAndConnectClient(challengerBran);
    
    const verification = await verifyChallengeResponse(challengerClient, responderPrefix, originalChallengeWords);
    
    if (verification.verified && verification.said) {
        await markChallengeAuthenticated(challengerClient, responderPrefix, verification.said);
        console.log(`${challengerAlias} has successfully authenticated ${responderPrefix}.`);
        return true;
    } else {
        console.error(`${challengerAlias} failed to authenticate ${responderPrefix}.`);
        return false;
    }
}

/**
 * Mutual Authentication with Challenge-Response.
 * @param {string} branA - The passcode (bran) for the first client.
 * @param {string} aidAAlias - The alias of the first client agent AID.
 * @param {string} aidAOOBI - The OOBI of the first client agent AID.
 * @param {string} aidAPrefix - The prefix of the first client agent AID.
 * @param {string} branB - The passcode (bran) for the second client.
 * @param {string} aidBAlias - The alias of the second client agent AID.
 * @param {string} aidBOOBI - The OOBI of the second client agent AID.
 * @param {string} aidBPrefix - The prefix of the second client agent AID.
 */
export async function mutualAuthentication(
    branA: string,
    aidAAlias: string,
    aidAOOBI: string,
    aidAPrefix: string,
    branB: string,
    aidBAlias: string,
    aidBOOBI: string,
    aidBPrefix: string
) {
    try {
        // Initialize clients (no longer needed for OOBI resolution as micro-steps handle it)
        // const { client: clientA } = await initializeAndConnectClient(branA);
        // const { client: clientB } = await initializeAndConnectClient(branB);

        console.log("\n\n--- MUTUAL AUTHENTICATION ---");

        // === MACRO-STEP 1: A authenticates B ===
        console.log("\n=== MACRO-STEP 1: A authenticates B ===");
        
        // Micro-step 1: A challenges B
        const challengeWordsAtoB = await loginChallenge(branA, aidAAlias, aidBPrefix, aidBOOBI, aidBAlias);
        
        // Micro-step 2: B accepts A's challenge
        await acceptChallenge(branB, aidBAlias, aidAPrefix, aidAOOBI, aidAAlias, challengeWordsAtoB);
        
        // Micro-step 3: A verifies B's response
        const authenticationAtoB = await verifyChallenge(branA, aidAAlias, aidBPrefix, challengeWordsAtoB);

        // === MACRO-STEP 2: B authenticates A ===
        console.log("\n=== MACRO-STEP 2: B authenticates A ===");
        
        // Micro-step 1: B challenges A
        const challengeWordsBtoA = await loginChallenge(branB, aidBAlias, aidAPrefix, aidAOOBI, aidAAlias);
        
        // Micro-step 2: A accepts B's challenge
        await acceptChallenge(branA, aidAAlias, aidBPrefix, aidBOOBI, aidBAlias, challengeWordsBtoA);
        
        // Micro-step 3: B verifies A's response
        const authenticationBtoA = await verifyChallenge(branB, aidBAlias, aidAPrefix, challengeWordsBtoA);

        // Summary
        console.log("\n=== MUTUAL AUTHENTICATION SUMMARY ===");
        console.log(`A → B Authentication: ${authenticationAtoB ? 'SUCCESS' : 'FAILED'}`);
        console.log(`B → A Authentication: ${authenticationBtoA ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Mutual Authentication: ${authenticationAtoB && authenticationBtoA ? 'SUCCESS' : 'FAILED'}`);
        
    } catch (error) {
        console.error('\n--- An error occurred during mutual authentication: ---', error);
    }
}
