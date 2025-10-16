/**
 * Enhanced credential schema matching utility
 * Provides flexible schema matching for credential filtering
 */

/**
 * Checks if a credential matches the required schema
 * @param credentialSchema - The required schema (can be string or object)
 * @param signinCredentialSchema - The credential's schema to check against
 * @returns boolean - true if the credential matches the schema requirement
 */
export function matchesCredentialSchema(credentialSchema: any, signinCredentialSchema: any): boolean {
  if (!credentialSchema || !signinCredentialSchema) {
    return !credentialSchema; // If no schema required, all credentials match
  }

  // If credentialSchema is a string, treat it as schema.id
  if (typeof credentialSchema == 'string') {
    console.log("String ID Match:", signinCredentialSchema.id, credentialSchema);
    return signinCredentialSchema.id == credentialSchema;
  }

  // If credentialSchema is an object, check multiple fields with priority
  if (typeof credentialSchema == 'object') {
    // Check exact schema.id match (highest priority)
    if (credentialSchema.id && signinCredentialSchema.$id) {
      console.log("Exact ID Match:", signinCredentialSchema.$id, credentialSchema.id);
      return signinCredentialSchema.$id == credentialSchema.id;
    }
    
    // Check credentialType match (medium priority)
    if (credentialSchema.credentialType && signinCredentialSchema.credentialType) {
      console.log("Credential Type Match:", signinCredentialSchema.credentialType, credentialSchema.credentialType);
      return signinCredentialSchema.credentialType == credentialSchema.credentialType;
    }
    
    // Check title match (lower priority, fallback)
    if (credentialSchema.title && signinCredentialSchema.title) {
      console.log("Title Match:", signinCredentialSchema.title, credentialSchema.title);
      return signinCredentialSchema.title == credentialSchema.title;
    }
    
    // Flexible matching: Check if any field matches
    console.log("Flexible Match Check:", { credentialSchema, signinCredentialSchema });
    return (
      (credentialSchema.id && signinCredentialSchema.$id == credentialSchema.id) ||
      (credentialSchema.credentialType && signinCredentialSchema.credentialType == credentialSchema.credentialType) ||
      (credentialSchema.title && signinCredentialSchema.title == credentialSchema.title)
    );
  }

  return false;
}

/**
 * Filters an array of credentials based on schema requirements
 * @param credentials - Array of credentials to filter
 * @param schemaRequirement - The schema requirement to match against
 * @returns Array of matching credentials
 */
export function filterCredentialsBySchema(credentials: any[], schemaRequirement: any): any[] {
  if (!schemaRequirement) {
    return credentials; // No filtering if no schema requirement
  }

  return credentials.filter(credential => 
    credential.schema && matchesCredentialSchema(schemaRequirement, credential.schema)
  );
}

/**
 * Logs schema matching for debugging purposes
 * @param requiredSchema - The required schema
 * @param credentialSchema - The credential's schema
 * @param result - The matching result
 */
export function logSchemaMatching(requiredSchema: any, credentialSchema: any, result: boolean): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Schema matching:', {
      required: requiredSchema,
      credential: credentialSchema,
      matches: result
    });
  }
}