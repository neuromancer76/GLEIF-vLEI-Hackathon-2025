/**
 * KERIA Client Service
 * Handles initialization and management of KERIA entities
 * This module provides helper functions to set up entity clients for credential operations
 */

// @ts-ignore - signify-ts is a transitive dependency via vlei-keria-library
import { initializeAndConnectClient } from 'vlei-keria-library';

/**
 * Entity configuration interface
 */
export interface EntityConfig {
  name: string;
  alias: string;
  bran: string;
}

/**
 * Entity result interface matching the vlei-keria-library EntityResult
 */
export interface EntityClient {
  bran: string;
  alias: string;
  prefix: string;
  oobi: string;
  client: any;
  registrySaid: string;
  AID: any;
}

/**
 * Initializes a KERIA client entity
 * This is a simplified wrapper around the library's initialization
 * 
 * @param config - Entity configuration
 * @returns Promise<EntityClient> - Initialized entity client
 */
export async function initializeEntity(config: EntityConfig): Promise<any> {
  try {
    console.log(`Initializing entity: ${config.alias}`);
    
    // Initialize and connect client using the library
    const { client, clientState } = await initializeAndConnectClient(
      config.bran
    );
    
    // Return a simplified entity structure
    // Note: Full entity setup would require createEntity from setup.ts
    return {
      bran: config.bran,
      alias: config.alias,
      client: client,
      // Additional properties would be populated by createEntity
    };
  } catch (error) {
    console.error(`Failed to initialize entity ${config.alias}:`, error);
    throw error;
  }
}

/**
 * Example entity configurations
 * These should be moved to environment variables or configuration files
 */
export const ENTITY_CONFIGS = {
  CRIF: {
    name: 'CRIF',
    alias: 'crif',
    bran: process.env.CRIF_BRAN || 'D6_wUYlRAsy01WrU_X_S7'
  },
  ACME: {
    name: 'ACME INC',
    alias: 'acme_inc',
    bran: process.env.ACME_BRAN || 'B9qx72My5X7lp-px5Gbtv'
  }
};
