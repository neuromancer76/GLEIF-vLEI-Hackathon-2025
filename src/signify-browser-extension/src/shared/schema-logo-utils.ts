import browser from "webextension-polyfill";
import schemaLogosConfig from '../config/schema-logos.json';

export interface ISchemaLogo {
  logo: string;
  name: string;
}

export interface ISchemaLogosConfig {
  schemaLogos: Record<string, ISchemaLogo>;
  defaultLogo: string;
}

const config: ISchemaLogosConfig = schemaLogosConfig as ISchemaLogosConfig;

/**
 * Resolve the correct URL for an image path in the browser extension
 * @param imagePath The filename of the image in the public folder
 * @returns The resolved URL using browser.runtime.getURL()
 */
function resolveImagePath(imagePath: string): string {
  try {
    // Use browser.runtime.getURL to get the correct extension URL
    return browser.runtime.getURL(imagePath);
  } catch (error) {
    // Fallback for development/testing environments where browser API might not be available
    console.warn('browser.runtime.getURL not available, using fallback path:', imagePath);
    return `/${imagePath}`;
  }
}

/**
 * Get the logo configuration for a given schema ID
 * @param schemaId The schema ID to look up
 * @returns The logo configuration or default logo if not found
 */
export function getSchemaLogo(schemaId?: string): { logo: string; name?: string } {
  console.log('Getting logo for schema ID:', schemaId);
  if (!schemaId) {
    return { logo: resolveImagePath(config.defaultLogo) };
  }

  // First try exact match
  let schemaConfig = config.schemaLogos[schemaId];
  if (schemaConfig) {
    console.log('Found exact match for schema ID:', schemaId, schemaConfig);
    return {
      logo: resolveImagePath(schemaConfig.logo),
      name: schemaConfig.name
    };
  }

  // Try to match by schema type patterns (for VLEI schemas)
  console.log('Trying pattern matching for schema ID:', schemaId);
  if (schemaId.includes('LE') || schemaId.includes('legal-entity')) {
    schemaConfig = config.schemaLogos['LE'];
  } else if (schemaId.includes('OOR') || schemaId.includes('organizational-role')) {
    schemaConfig = config.schemaLogos['OOR'];
  } else if (schemaId.includes('QVI') || schemaId.includes('qualified-vLEI-issuer')) {
    schemaConfig = config.schemaLogos['QVI'];
  } else if (schemaId.includes('ECR') || schemaId.includes('engagement-context-role')) {
    schemaConfig = config.schemaLogos['ECR'];
  }

  if (schemaConfig) {
    console.log('Found pattern match for schema ID:', schemaId, schemaConfig);
    return {
      logo: resolveImagePath(schemaConfig.logo),
      name: schemaConfig.name
    };
  }

  console.log('No match found for schema ID, using default:', schemaId);
  return { logo: resolveImagePath(config.defaultLogo) };
}

/**
 * Check if a schema ID has a configured logo
 * @param schemaId The schema ID to check
 * @returns True if the schema has a configured logo
 */
export function hasSchemaLogo(schemaId?: string): boolean {
  return !!(schemaId && config.schemaLogos[schemaId]);
}