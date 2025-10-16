import { Ilks, Saider, SignifyClient } from "signify-ts";

export async function verifyOutOfBandCredential(
    verifierClient: SignifyClient,
    credentialData: any
): Promise<boolean> {
    
    console.log('=== Starting Out-of-Band Credential Verification ===\n');
    
    // Extract credential details
    const credSAID = credentialData.sad.d;
    const issuerPrefix = credentialData.sad.i;
    const registryId = credentialData.sad.ri;
    const holderPrefix = credentialData.sad.a.i; // Subject of credential
    
    console.log('Credential SAID:', credSAID);
    console.log('Issuer Prefix:', issuerPrefix);
    console.log('Registry ID:', registryId);
    console.log('Holder (Subject):', holderPrefix);
    console.log('');

    // ========================================
    // STEP 1: Verify SAID Integrity
    // ========================================
    // The SAID proves the credential data hasn't been tampered with
    console.log('Step 1: Verifying SAID integrity...');
    
    const saider = new Saider({ qb64: credSAID });
    const isValidSAID = saider.verify(credentialData.sad);
    
    if (!isValidSAID) {
        console.error('✗ SAID verification failed - credential data may be tampered');
        return false;
    }
    console.log('✓ SAID integrity verified - credential data is authentic\n');

    // ========================================
    // STEP 2: Query Credential State
    // ========================================
    // Check if the credential exists in the registry and get its status
    console.log('Step 2: Querying credential state from registry...');
    
    try {
        const credentialState = await verifierClient
            .credentials()
            .state(registryId, credSAID);
        
        console.log('✓ Credential found in registry');
        console.log('  Credential ID:', credentialState.i);
        console.log('  Registry ID:', credentialState.ri);
        console.log('  Event Type:', credentialState.et);
        console.log('  Status:', credentialState.s === '0' ? 'Issued' : 'Revoked');
        console.log('');
        
        // Verify it's an issuance event
        if (credentialState.et !== Ilks.iss && credentialState.et !== 'iss') {
            console.error('✗ Not an issuance event');
            return false;
        }
        
        // Check if revoked
        if (credentialState.s === '1') {
            console.warn('⚠ Credential is REVOKED\n');
            return false;
        }
        
    } catch (error) {
        console.error('✗ Credential not found in registry or error querying state');       
        return false;
    }

    // ========================================
    // STEP 3: Verify Issuer's KEL
    // ========================================
    // This is the CRITICAL step - verify the credential issuance
    // is actually recorded in the issuer's Key Event Log (KEL)
    console.log('Step 3: Verifying credential in issuer\'s KEL...');
    
    try {
        const issuerKeyEvents = await verifierClient
            .keyEvents()
            .get(issuerPrefix);
        
        console.log(`✓ Retrieved ${issuerKeyEvents.length} events from issuer's KEL`);
        
        // Look for the issuance event in the KEL
        let issuanceFound = false;
        let issuanceEventDetails = null;
        
        for (const event of issuerKeyEvents) {
            const eventData = event.ked;
            
            // Look for interaction (ixn) events that anchor credentials
            if (eventData.t === 'ixn' && eventData.a && Array.isArray(eventData.a)) {
                for (const anchor of eventData.a) {
                    // The issuance is recorded as an anchor with:
                    // - i: credential SAID
                    // - s: sequence number ('0' for issuance)
                    if (anchor.i === credSAID && anchor.s === '0') {
                        issuanceFound = true;
                        issuanceEventDetails = {
                            eventSeqNum: eventData.s,
                            eventDigest: eventData.d,
                            anchor: anchor
                        };
                        break;
                    }
                }
            }
            
            if (issuanceFound) break;
        }
        
        if (!issuanceFound) {
            console.error('✗ Credential issuance NOT found in issuer\'s KEL');
            console.error('  This credential was not properly issued!');
            return false;
        }
        
        console.log('✓ Issuance event found in issuer\'s KEL');
        //console.log('  Event Sequence:', issuanceEventDetails.eventSeqNum);
        //console.log('  Event Digest:', issuanceEventDetails.eventDigest);
        console.log('');
        
    } catch (error) {
        console.error('✗ Error retrieving issuer\'s KEL');
        //console.error('  Error:', error.message);
        return false;
    }

    // ========================================
    // STEP 4: Verify Issuer's Key State
    // ========================================
    // Ensure the issuer's identifier is in a valid state
    console.log('Step 4: Verifying issuer\'s current key state...');
    
    try {
        const issuerKeyState = await verifierClient
            .keyStates()
            .get(issuerPrefix);
        
        if (!issuerKeyState || issuerKeyState.length === 0) {
            console.error('✗ Invalid issuer key state');
            return false;
        }
        
        console.log('✓ Issuer key state is valid');
        console.log('  Current sequence number:', issuerKeyState[0].s);
        console.log('  Current digest:', issuerKeyState[0].d);
        console.log('');
        
    } catch (error) {
        console.error('✗ Error retrieving issuer key state');
        //console.error('  Error:', error.message);
        return false;
    }

    // ========================================
    // STEP 5: Final Verification Summary
    // ========================================
    console.log('=== VERIFICATION SUCCESSFUL ===');
    console.log('The credential has been verified as:');
    console.log('  ✓ SAID integrity confirmed (not tampered)');
    console.log('  ✓ Exists in registry');
    console.log('  ✓ Currently in ISSUED state (not revoked)');
    console.log('  ✓ Issuance recorded in issuer\'s KEL');
    console.log('  ✓ Issued by valid issuer');
    console.log('  ✓ Issued to:', holderPrefix);
    console.log('');
    
    return true;
}