// Test file to verify logo resolution
// This can be run in the browser extension context to test the functionality

import { getSchemaLogo, hasSchemaLogo } from './schema-logo-utils';

console.log('Testing Schema Logo Resolution:');

// Test existing schema IDs
console.log('ACME Corporation Logo:', getSchemaLogo('EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zSdAiN0oBHLVvksBv'));
console.log('Legal Entity Logo:', getSchemaLogo('LE'));
console.log('Non-existent Schema (should use default):', getSchemaLogo('non-existent-schema'));
console.log('No schema ID (should use default):', getSchemaLogo());

// Test logo existence checks
console.log('Has ACME logo:', hasSchemaLogo('EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zSdAiN0oBHLVvksBv'));
console.log('Has non-existent logo:', hasSchemaLogo('non-existent-schema'));

// Expected outputs (when running in extension context):
// ACME Corporation Logo: { logo: "chrome-extension://[id]/acme-logo.png", name: "ACME Corporation" }
// Legal Entity Logo: { logo: "chrome-extension://[id]/128_keri_logo.png", name: "Legal Entity Credential" }
// Non-existent Schema: { logo: "chrome-extension://[id]/128_keri_logo.png" }
// No schema ID: { logo: "chrome-extension://[id]/128_keri_logo.png" }
// Has ACME logo: true
// Has non-existent logo: false