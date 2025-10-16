# Assign Credential to Application API

## Overview

A new API endpoint has been added to assign credentials to target applications identified by their AID (Agent Identifier).

## Endpoint Details

### POST `/api/v1/credentials/assign-to-application`

Assigns an existing credential to a target application.

#### Request Body

```json
{
  "targetAid": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI"
}
```

**Parameters:**
- `targetAid` (string, required): The AID of the target application to assign the credential to

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "credentialId": "EZ8R1G0Yv5p4q7x9Wh2s3d5f6g7h8j9k0l1m2n3o4p",
    "said": "EZ8R1G0Yv5p4q7x9Wh2s3d5f6g7h8j9k0l1m2n3o4p",
    "targetAid": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI",
    "assignedAt": "2025-10-08T12:00:00.000Z"
  },
  "timestamp": "2025-10-08T12:00:00.000Z"
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "msg": "Target AID (Agent Identifier) is required",
        "param": "targetAid",
        "location": "body"
      }
    ]
  },
  "timestamp": "2025-10-08T12:00:00.000Z"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": {
    "code": "CREDENTIAL_ASSIGNMENT_ERROR",
    "message": "Failed to assign credential: No credentials found to assign"
  },
  "timestamp": "2025-10-08T12:00:00.000Z"
}
```

## Implementation Details

### Files Modified

1. **src/types/credentials.ts**
   - Added `AssignCredentialRequest` interface
   - Updated `CredentialResponse` to include `assignedAt` and `targetAid` fields

2. **src/services/credential.service.ts**
   - Added `assignCredentialToApplication()` method
   - Added `validateAssignCredentialRequest()` private validation method
   - Implemented credential lookup and assignment logic

3. **src/controllers/credential.controller.ts**
   - Added `assignCredentialToApplication()` controller method
   - Handles request validation and service invocation

4. **src/middleware/validation.ts**
   - Added `validateAssignCredential` middleware
   - Validates `targetAid` parameter

5. **src/routes/credentials.ts**
   - Added POST route for `/assign-to-application`
   - Integrated validation middleware

6. **src/docs/openapi.yaml**
   - Added endpoint documentation
   - Added `AssignCredentialRequest` schema
   - Updated `CredentialData` schema with new fields

7. **src/app.ts**
   - Updated welcome message with new endpoint

## Usage Examples

### cURL

```bash
curl -X POST http://localhost:3000/api/v1/credentials/assign-to-application \
  -H "Content-Type: application/json" \
  -d '{
    "targetAid": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/v1/credentials/assign-to-application', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    targetAid: 'EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI'
  })
});

const result = await response.json();
console.log(result);
```

### PowerShell

```powershell
$body = @{
    targetAid = "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/credentials/assign-to-application" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## Current Implementation Status

### ✅ Completed
- API endpoint structure
- Request validation
- Type definitions
- OpenAPI documentation
- Controller and route setup
- Response formatting

### 🔄 Pending Implementation
The current implementation includes placeholder logic. To complete the feature:

1. **Implement IPEX Grant Flow**
   ```typescript
   // Import grant functionality
   const { ipexGrantCredential } = await import('vlei-keria-library/dist/keri');
   
   // Send grant to target AID
   await ipexGrantCredential(
     certificatorEntity.client,
     certificatorEntity.alias,
     request.targetAid,
     credentialToAssign
   );
   ```

2. **Add Credential Selection Logic**
   - Currently selects the first Risk Lens credential found
   - Could be enhanced to:
     - Accept credential SAID as optional parameter
     - Filter by credential type
     - Select based on specific criteria

3. **Add Acknowledgment Handling**
   - Wait for grant acceptance from target application
   - Handle grant rejection scenarios
   - Store assignment state

## Validation Rules

- `targetAid` must be a non-empty string
- `targetAid` must be at least 1 character long
- Request body must be valid JSON
- Content-Type must be `application/json`

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request parameters |
| `CREDENTIAL_ASSIGNMENT_ERROR` | Failed to assign credential |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

## Environment Variables

The service uses the following environment variables for credential assignment:

- `CERTIFICATOR_BRAN`: Certificator entity bran (default: "crif")
- `CERTIFICATOR_ALIAS`: Certificator entity alias (default: "")

## Security Considerations

1. **Authentication**: Currently the endpoint is public. Add authentication as needed.
2. **Authorization**: Verify the requester has permission to assign credentials.
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse.
4. **Input Sanitization**: All inputs are validated but consider additional sanitization for production.

## Testing

Build the project:
```bash
npm run build
```

Start the server:
```bash
npm start
```

Access the API documentation:
```
http://localhost:3000/api-docs
```

Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/v1/credentials/assign-to-application \
  -H "Content-Type: application/json" \
  -d '{"targetAid": "test-aid-123"}'
```
