import { randomPasscode, Saider, Serder, SignifyClient } from 'signify-ts';
import { writeFileSync } from 'fs';
import { join } from 'path';
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

    // Credential presentation process - removing non-existent functions
    // verifyAskCredential, holderReceiveApplyRequest, holderFindMatchingCredential, 
    // holderOfferCredential, verifierAgreeCredential, verifierReceiveOfferNotification,
    // holderReceivePresentationFlow, verifierCheckAndApproveCredentialFlow, checkCredentialsChain,

    // Constants
    GLEIF, ACME_INC, CRIF, QVI, SUPPLIERPORTA, QVI_SCHEMA_URL, LE_SCHEMA_URL, ECR_AUTH_SCHEMA_URL,
    ECR_SCHEMA_URL, OOR_AUTH_SCHEMA_URL, OOR_SCHEMA_URL, QVI_SCHEMA_SAID, LE_SCHEMA_SAID,
    ECR_AUTH_SCHEMA_SAID, RISKLENS_BADGE_SCHEMA_SAID, RISKLENS_BADGE_SCHEMA_URL,
    ESG_BADGE_SCHEMA_URL, CERTIFICATOR_SCHEMA_URL, CERTIFICATOR_SCHEMA_SAID, AMAZOFF,
    DEFAULT_RETRIES, IPEX_APPLY_ROUTE, DEFAULT_DELAY_MS,
    issueCredentialObject
} from 'vlei-keria-library';
import { verifyOutOfBandCredential } from './verifier.js';


console.log("Hello World!");
console.log("Welcome to the Signify Console Application");
console.log("🌍 This is a simple TypeScript hello world example");

// Simple function demonstration
function greetUser(name: string): string {
    return `Hello, ${name}! Welcome to KERI and Signify-ts!`;
}



// Async function demonstration
async function main(skipCredentialIssuance: boolean = true): Promise<void> {
    console.log("\n=== Starting Main Function ===");

    try {
        await initializeSignify();

        //#region Create all clients at the beginning
        prTitle('Creating SignifyClients for all entities');

        const gleifClient = await initializeAndConnectClient(GLEIF.bran);
        const qviClient = await initializeAndConnectClient(QVI.bran);
        const acmeClient = await initializeAndConnectClient(ACME_INC.bran);
        const crifClient = await initializeAndConnectClient(CRIF.bran);
        const amazoffClient = await initializeAndConnectClient(AMAZOFF.bran);
        const supplierPortalClient = await initializeAndConnectClient(SUPPLIERPORTA.bran);

        prMessage('✅ All SignifyClients created successfully');
        //#endregion

        //#region initial setup
        prTitle('Start creating Entities');

        prTitle('Initializing GLEIF');
        const gleifEntity = await createEntity(gleifClient.client, GLEIF.bran, GLEIF.alias);

        prTitle('Initializing Qualified vLEI Issuer');
        const qviEntity = await createEntity(qviClient.client, QVI.bran, QVI.alias);

        prTitle('Initializing ACME INC');
        const acmeEntity = await createEntity(acmeClient.client, ACME_INC.bran, ACME_INC.alias);

        prTitle('Initializing CRIF');
        const crifEntity = await createEntity(crifClient.client, CRIF.bran, CRIF.alias);

        prTitle('Initializing AMAZOFF');
        const amazoffEntity = await createEntity(amazoffClient.client, AMAZOFF.bran, AMAZOFF.alias);

        prTitle('Initializing SUPPLIERPORTAL');
        const supplierportalEntity = await createEntity(supplierPortalClient.client, SUPPLIERPORTA.bran, SUPPLIERPORTA.alias);


        // Create array of all entities
        const allEntities: EntityResult[] = [
            gleifEntity,
            qviEntity,
            acmeEntity,
            crifEntity,
            amazoffEntity,
            supplierportalEntity
        ];

        // Use the new resolveAllOOBIs function to resolve OOBIs between all entities
        await resolveAllOOBIs(allEntities);

        // Resolve all schema URLs for all clients
        prTitle('Resolving Schema OOBIs');

        // Get all clients from entities (no need to create new connections)
        const allClients = [
            gleifEntity.client,
            acmeEntity.client,
            qviEntity.client,
            crifEntity.client,
            amazoffEntity.client,
            supplierportalEntity.client];

        // Define all schema URLs from constants
        const allSchemaUrls = [
            RISKLENS_BADGE_SCHEMA_URL,
            ESG_BADGE_SCHEMA_URL,
            CERTIFICATOR_SCHEMA_URL,
            QVI_SCHEMA_URL,
            LE_SCHEMA_URL,
            ECR_AUTH_SCHEMA_URL,
            ECR_SCHEMA_URL,
            OOR_AUTH_SCHEMA_URL,
            OOR_SCHEMA_URL,
        ];

        // Resolve all schemas for all clients
        await resolveSchemas(allSchemaUrls, allClients);
        //#endregion

        // Conditional execution - skip credential issuance if parameter is true
        if (!skipCredentialIssuance) {
            //#region Gleif issues vLEI to QVI
            prTitle('--- Gleif issues vLEI to QVI ---');


            // QVI LEI (Arbitrary value)
            const qviData = {
                LEI: '254900OPPU84GM83MG36',
            };


            const qviCredential = await issueCredentials(gleifEntity.client, gleifEntity.alias, gleifEntity.registrySaid, QVI_SCHEMA_SAID, qviEntity.prefix, qviData);
            await acceptCredentialNotification(qviEntity.client, qviEntity.alias, IPEX_GRANT_ROUTE, gleifEntity.prefix);

            //#endregion

            //#region QVI  issues vLEI to ACME INC
            prTitle('--- QVI  issues vLEI to ACME INC ---');
            // QVI issues LE to ACME INC
            // Credential Data
            const acmeData = {
                LEI: '875500ELOZEL05BVXV37',
            };



            const qwiEdgeData = Saider.saidify({
                d: '',
                qvi: {
                    n: qviCredential.sad.d,
                    s: qviCredential.sad.s,
                },
            })[1];

            const acmeRules = Saider.saidify({
                d: '',
                usageDisclaimer: {
                    l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                },
                issuanceDisclaimer: {
                    l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                },
            })[1];


            const acmeCredential = await issueEdgeCredential(
                qviEntity.client,
                qviEntity.alias,
                qviEntity.registrySaid,
                LE_SCHEMA_SAID,
                acmeEntity.client,
                acmeEntity.prefix,
                acmeData,
                qwiEdgeData,
                acmeRules);
            await acceptCredentialNotification(acmeEntity.client, acmeEntity.alias, IPEX_GRANT_ROUTE, qviEntity.prefix);


            prTitle('--- CREDENTIAL ISSUANCE:ECR ---');


            const ecrEdge = Saider.saidify({
                d: '',
                le: {
                    n: qviCredential.sad.d,
                    s: qviCredential.sad.s,
                },
            })[1];
            //#endregion

            //#region QVI  issues LE to CRIF
            prTitle('--- QVI  issues LE to CRIF ---');
            // QVI issues LE to CRIF
            // Credential Data
            const crifData = {
                LEI: '875500ELOZEL05B0000',
            };

            const crifRules = Saider.saidify({
                d: '',
                usageDisclaimer: {
                    l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                },
                issuanceDisclaimer: {
                    l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                },
            })[1];

            const qwiBEdgeData = Saider.saidify({
                d: '',
                qvi: {
                    n: qviCredential.sad.d,
                    s: qviCredential.sad.s,
                },
            })[1];


            const resultCrif = await issueEdgeCredential(
                qviEntity.client,
                qviEntity.alias,
                qviEntity.registrySaid,
                LE_SCHEMA_SAID,
                crifEntity.client,
                crifEntity.prefix,
                crifData,
                qwiBEdgeData,
                crifRules);
            await acceptCredentialNotification(crifEntity.client, crifEntity.alias, IPEX_GRANT_ROUTE, qviEntity.prefix);


            prTitle('--- CREDENTIAL ISSUANCE:ECR ---');



            //#endregion

            //#region QVI  issues LE to AMAZOFF
            prTitle('--- QVI  issues LE to AMAZOFF ---');
            // QVI issues LE to AMAZOFF
            // Credential Data
            const amazoffData = {
                LEI: '875500ELOZEL05B0000',
            };

            const amazoffRules = Saider.saidify({
                d: '',
                usageDisclaimer: {
                    l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                },
                issuanceDisclaimer: {
                    l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                },
            })[1];


            const resultAmazoff = await issueEdgeCredential(
                qviEntity.client,
                qviEntity.alias,
                qviEntity.registrySaid,
                LE_SCHEMA_SAID,
                amazoffEntity.client,
                amazoffEntity.prefix,
                amazoffData,
                qwiBEdgeData,
                amazoffRules);
            await acceptCredentialNotification(amazoffEntity.client, amazoffEntity.alias, IPEX_GRANT_ROUTE, qviEntity.prefix);


            prTitle('--- CREDENTIAL ISSUANCE:ECR ---');



            //#endregion

            //#region QVI  issues Certificator badge to CRIF
            prTitle('--- QVI  issues Certificator badge to CRIF ---');
            // QVI issues Certificator badge to CRIF
            // Credential Data
            const crifCertificatorData = {
                certificationType: 'Risk, Esg, Insurance',
            };

            const crifCertificatorRules = Saider.saidify({
                d: '',
                usageDisclaimer: {
                    l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                },
                issuanceDisclaimer: {
                    l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                }
            })[1];

            const resultCertificatorCrif = await issueEdgeCredential(
                qviEntity.client,
                qviEntity.alias,
                qviEntity.registrySaid,
                CERTIFICATOR_SCHEMA_SAID,
                crifEntity.client,
                crifEntity.prefix,
                crifCertificatorData,
                qwiBEdgeData,
                crifCertificatorRules);
            await acceptCredentialNotification(crifEntity.client, crifEntity.alias, IPEX_GRANT_ROUTE, qviEntity.prefix);


            prTitle('--- CREDENTIAL ISSUANCE:ECR ---');



            //#endregion

            //#region CRIF  issues RiskLens badge to ACME INC 
            prTitle('--- CRIF  issues RISKLENS_BADGE to ACME INC ---');
            // CRIF issues ECR to ACME INC
            // Credential Data
            // Credential Data
            const riskLensBadgeAuthData = {
                AID: '',
                riskIndicator: "A",
                creditLimit: 10000
            };

            const riskLensBadgeEdge = Saider.saidify({
                d: '',
                certificator: {
                    n: resultCertificatorCrif.credential.sad.d,
                    s: resultCertificatorCrif.credential.sad.s,
                },
            })[1];

            const riskLensBadgeRules = Saider.saidify({
                d: '',
                usageDisclaimer: {
                    l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                },
                issuanceDisclaimer: {
                    l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                },
                privacyDisclaimer: {
                    l: 'Privacy Considerations are applicable to QVI ECR AUTH vLEI Credentials.  It is the sole responsibility of QVIs as Issuees of QVI ECR AUTH vLEI Credentials to present these Credentials in a privacy-preserving manner using the mechanisms provided in the Issuance and Presentation Exchange (IPEX) protocol specification and the Authentic Chained Data Container (ACDC) specification.  https://github.com/WebOfTrust/IETF-IPEX and https://github.com/trustoverip/tswg-acdc-specification.',
                },
            })[1];

            const resultAcmeEcr = await issueEdgeCredential(
                crifEntity.client,
                crifEntity.alias,
                crifEntity.registrySaid,
                RISKLENS_BADGE_SCHEMA_SAID,
                acmeEntity.client,
                acmeEntity.prefix,
                riskLensBadgeAuthData,
                riskLensBadgeEdge,
                riskLensBadgeRules);
            await acceptCredentialNotification(acmeEntity.client, acmeEntity.alias, IPEX_GRANT_ROUTE, crifEntity.prefix);

            // Print the JSON representation of the resultAcmeEcr.credential object
            console.log('\n=== resultAcmeEcr.credential JSON ===');
            console.log(JSON.stringify(resultAcmeEcr.credential, null, 2));
            console.log('=== END resultAcmeEcr.credential JSON ===\n');


            console.log("\n\n✅ Verifier IPEX Grant notification processing complete.")

            //#endregion

        } else {
            prMessage('🚀 Skipping credential issuance workflow (skipCredentialIssuance = true)');
        }

        // Create entities object and save to JSON file
        prTitle('=== Entity AIDs Summary ===');
        const entitiesData = {
            GLEIF: gleifEntity.AID,
            QVI: qviEntity.AID,
            ACME_INC: acmeEntity.AID,
            CRIF: crifEntity.AID,
            AMAZOFF: amazoffEntity.AID
        };

        let filter: { [x: string]: any } = { '-s': RISKLENS_BADGE_SCHEMA_SAID }; // Filter by schema SAID   

        const localPath = process.env.LOCAL_PATH as string; 

        // Holder lists credentials matching the filter.
        const matchingCredentials = await acmeEntity.client.credentials().list({ filter });
        const entitiesFilePath1 = join(localPath, 'entities.json');
        writeFileSync(entitiesFilePath1, JSON.stringify(matchingCredentials[0], null, 2), 'utf8');


        var result = await issueCredentialObject(acmeEntity.client, acmeEntity.alias, amazoffEntity.prefix, matchingCredentials[0]);
        await acceptCredentialNotification(amazoffEntity.client, amazoffEntity.alias, IPEX_GRANT_ROUTE, acmeEntity.prefix);
        const assignedCredentials = await amazoffEntity.client.credentials().list({ filter });
        const entitiesFilePath = join(localPath, 'assigned.json');
        writeFileSync(entitiesFilePath, JSON.stringify(assignedCredentials, null, 2), 'utf8');


        // Issuer revokes the credential.
        // This creates a revocation event in the credential's TEL within the Issuer's registry.
        const crifFoundCredentials = await acmeEntity.client.credentials().list({ filter });
        const entitiesFilePath2 = join(localPath, 'crifFoundCredentials.json');
        writeFileSync(entitiesFilePath2, JSON.stringify(crifFoundCredentials[0], null, 2), 'utf8');
        const revokeResult = await crifEntity.client.credentials().revoke(crifEntity.alias, matchingCredentials[0].sad.d); // Changed from revokeOperation to revokeResult to get .op
        const revokeOperation = revokeResult.op; // Get the operation from the result

        // Wait for the revocation operation to complete.
        const revokeResponse = await crifEntity.client
            .operations()
            .wait(revokeOperation); // Used revokeOperation directly

        // Log the credential status after revocation.
        // Note the 'et: "rev"' indicating it's now revoked, and the sequence number 's' has incremented.
        const statusAfter = (await crifEntity.client.credentials().get(matchingCredentials[0].sad.d));
        console.log("✅ Credential status after revocation:", statusAfter);

        // Save entities to JSON file
        const entitiesFilePathrevoked = join(localPath, 'revoked.json');
        writeFileSync(entitiesFilePathrevoked, JSON.stringify(statusAfter, null, 2), 'utf8');



        console.log("Completed");

    } catch (error) {
        console.error("❌ Error in main function:", error);
        throw error;
    }
}

// Execute the main function with skip parameter set to true
main(false).catch(error => {
    console.error("❌ Error in main function:", error);
    process.exit(1);
});

export { greetUser };

