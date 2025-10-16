import 'dotenv/config';
import { SignifyClient } from 'signify-ts';
import {
    initializeSignify,
    initializeAndConnectClient,
    prTitle,
    prMessage,
    prAlert,
    DEFAULT_DELAY_MS as LIB_DEFAULT_DELAY_MS,
    DEFAULT_RETRIES,
    IPEX_GRANT_ROUTE,
    ipexAdmitGrant,
    markNotificationRead
} from 'vlei-keria-common';

import { createEntity } from 'vlei-keria-common';

// Daemon-specific configuration
const DAEMON_CHECK_INTERVAL_MS = parseInt(process.env.DAEMON_CHECK_INTERVAL_MS || '5000');
const HOLDER_CONFIGS_RAW = process.env.HOLDER_CONFIGS || 'holder:DefaultHolderBran123';
const MAX_NOTIFICATIONS_PER_BATCH = parseInt(process.env.MAX_NOTIFICATIONS_PER_BATCH || '10');
const NOTIFICATION_RETRY_ATTEMPTS = parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3');
const NOTIFICATION_RETRY_DELAY_MS = parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS || '2000');
const BFF_API_URL = process.env.BFF_API_URL || 'http://localhost:5178';

interface HolderConfig {
    alias: string;
    bran: string;
}

interface DaemonConfig {
    holderConfigs: HolderConfig[];
    checkInterval: number;
    maxNotificationsPerBatch: number;
    retryAttempts: number;
    retryDelay: number;
}

/**
 * Parse holder configurations from environment variable
 */
function parseHolderConfigs(configString: string): HolderConfig[] {
    return configString.split(',').map(config => {
        const [alias, bran] = config.split(':');
        if (!alias || !bran) {
            throw new Error(`Invalid holder config format: ${config}. Expected format: alias:bran`);
        }
        return { alias: alias.trim(), bran: bran.trim() };
    });
}

interface HolderInstance {
    config: HolderConfig;
    clientWrapper: { client: any; clientState: any };
    entity: any;
}

class VleiHolderDaemon {
    private holders: HolderInstance[] = [];
    private config: DaemonConfig;
    private isRunning: boolean = false;

    constructor(config: DaemonConfig) {
        this.config = config;
    }

    /**
     * Initialize the daemon with all holder clients and entities
     */
    async initialize(): Promise<void> {
        try {
            prTitle('🚀 Initializing VLEI Holder Credential Responder Daemon');
            
            // Initialize Signify
            await initializeSignify();
            
            // Initialize all holder configurations
            for (const holderConfig of this.config.holderConfigs) {
                prMessage(`🔧 Initializing holder: ${holderConfig.alias}`);
                
                // Initialize and connect holder client
                prMessage(`   Connecting client with BRAN: ${holderConfig.bran}`);
                const clientWrapper = await initializeAndConnectClient(holderConfig.bran);
                
                // Create or get holder entity
                prMessage(`   Setting up entity...`);
                const entity = await createEntity(clientWrapper.client, holderConfig.bran, holderConfig.alias);
                
                // Store holder instance
                this.holders.push({
                    config: holderConfig,
                    clientWrapper,
                    entity
                });
                
                prMessage(`✅ Holder "${holderConfig.alias}" initialized successfully!`);
                prMessage(`   - Prefix: ${entity.prefix}`);
                prMessage(`   - Alias: ${entity.alias}`);
            }
            
            prMessage(`🎉 All ${this.holders.length} holder(s) initialized successfully!`);
            
        } catch (error) {
            prAlert(`❌ Failed to initialize daemon: ${error}`);
            throw error;
        }
    }

    /**
     * Start the daemon loop
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            prAlert('⚠️ Daemon is already running');
            return;
        }

        this.isRunning = true;
        prTitle('🔄 Starting VLEI Holder Daemon...');
        prMessage(`Checking for credential requests every ${this.config.checkInterval}ms`);

        // Main daemon loop
        while (this.isRunning) {
            try {
                await this.processCredentialRequests();
                await this.sleep(this.config.checkInterval);
            } catch (error) {
                prAlert(`❌ Error in daemon loop: ${error}`);
                // Continue running even if there's an error in one iteration
                await this.sleep(this.config.checkInterval);
            }
        }
    }

    /**
     * Stop the daemon
     */
    stop(): void {
        prMessage('🛑 Stopping VLEI Holder Daemon...');
        this.isRunning = false;
    }

    /**
     * Process incoming credential requests for all holders
     */
    private async processCredentialRequests(): Promise<void> {
        try {
            let totalNotifications = 0;
            
            // Process notifications for each holder
            for (const holder of this.holders) {
                prMessage(`🔍 Checking notifications for holder: ${holder.config.alias}`);
                
                // Get unread IPEX apply notifications for this holder
                const notifications = await holder.clientWrapper.client.notifications().list();
                const applyNotifications = notifications.notes.filter(
                    (n: any) => n.a.r === IPEX_GRANT_ROUTE && n.r === false
                );

                if (applyNotifications.length > 0) {
                    prMessage(`📥 Found ${applyNotifications.length} new credential request(s) for ${holder.config.alias}`);
                    totalNotifications += applyNotifications.length;

                    // Process batch of notifications for this holder
                    const batch = applyNotifications.slice(0, this.config.maxNotificationsPerBatch);
                    
                    for (const notification of batch) {
                        await this.handleCredentialRequest(notification, holder);
                    }
                }
            }

            if (totalNotifications === 0) {
                prMessage(`📥 No credentials to be processed across all holders`);                
                // Wait 5 seconds before returning to avoid excessive polling
                await this.sleep(5000);
                return;
            }

        } catch (error) {
            prAlert(`❌ Error processing credential requests: ${error}`);
        }
    }

    /**
     * Handle a single credential request for a specific holder
     */
    private async handleCredentialRequest(notification: any, holder: HolderInstance): Promise<void> {
        try {
            prMessage(`🔍 Processing request from notification: ${notification.i} for holder: ${holder.config.alias}`);
            
            // Get the apply exchange details
            const applyExchange = await holder.clientWrapper.client.exchanges().get(notification.a.d);
            prMessage(`🎯 ApplyExchanger: ${JSON.stringify(applyExchange)}`);
            // Extract verifier prefix from the apply exchange
            // The 'rp' field should contain the verifier's prefix that raised the question
            const verifierPrefix = applyExchange.exn?.i;
            
            prMessage(`🎯 Request from verifier: ${verifierPrefix}`);
            prMessage(`📋 Requested schema: ${applyExchange.exn?.e?.acdc?.s || 'Unknown'}`);           

            const admitResponse = await ipexAdmitGrant(
                holder.clientWrapper.client,
                holder.config.alias,
                verifierPrefix, 
                notification.a.d
            );
            
            prMessage(`✅ Admitted grant for notification ${notification.i}: ${JSON.stringify(admitResponse)}`);

            prMessage(`🔗 Accepting credential notification...`);
            // Accept the credential notification
            await markNotificationRead(
                holder.clientWrapper.client,
                notification.i
            );
            
            // Call the bff hook method
            try {
                prMessage(`🔗 Notifying BFF API about grant confirmation...`);
                
                // Build query parameters for the API call
                const params = new URLSearchParams({
                    entityAid: applyExchange.exn?.e?.acdc?.a?.i || '',
                    credentialSchemaAid: applyExchange.exn?.e?.acdc?.s || '',
                    vlei: applyExchange.exn?.e?.acdc?.a?.LEI,
                    validatedCredential: JSON.stringify(applyExchange.exn?.e?.acdc)
                });
                
                const apiUrl = `${BFF_API_URL}/api/Supplier/confirm-grant?${params.toString()}`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    prMessage(`✅ BFF API notified successfully: ${JSON.stringify(result)}`);
                } else {
                    const errorText = await response.text();
                    prAlert(`⚠️ BFF API returned error ${response.status}: ${errorText}`);
                }
            } catch (apiError) {
                prAlert(`❌ Failed to notify BFF API: ${apiError}`);
                // Continue processing even if BFF notification fails
            }


        } catch (error) {
            prAlert(`❌ Error handling credential request ${notification.i} for holder ${holder.config.alias}: ${error}`);
            // Simply log the error without retry logic
        }
    }

    /**
     * Utility method for sleeping
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get daemon status information
     */
    getStatus(): any {
        return {
            isRunning: this.isRunning,
            totalHolders: this.holders.length,
            holders: this.holders.map(h => ({
                alias: h.entity?.alias,
                prefix: h.entity?.prefix,
                bran: h.config.bran
            })),
            config: this.config
        };
    }
}

/**
 * Main function to start the daemon
 */
async function main(): Promise<void> {
    const holderConfigs = parseHolderConfigs(HOLDER_CONFIGS_RAW);
    
    const config: DaemonConfig = {
        holderConfigs,
        checkInterval: DAEMON_CHECK_INTERVAL_MS,
        maxNotificationsPerBatch: MAX_NOTIFICATIONS_PER_BATCH,
        retryAttempts: NOTIFICATION_RETRY_ATTEMPTS,
        retryDelay: NOTIFICATION_RETRY_DELAY_MS
    };

    const daemon = new VleiHolderDaemon(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        prMessage('📡 Received SIGINT, shutting down gracefully...');
        daemon.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        prMessage('📡 Received SIGTERM, shutting down gracefully...');
        daemon.stop();
        process.exit(0);
    });

    try {
        await daemon.initialize();
        await daemon.start();
    } catch (error) {
        prAlert(`💥 Fatal error: ${error}`);
        process.exit(1);
    }
}

main().catch(error => {
        console.error('💥 Fatal error starting daemon:', error);
        process.exit(1);
    });

export { VleiHolderDaemon };
export type { DaemonConfig, HolderConfig, HolderInstance };