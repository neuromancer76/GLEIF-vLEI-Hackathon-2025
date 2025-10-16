# VLEI KERIA API

A TypeScript-based REST API for managing VLEI (Verifiable Legal Entity Identifier) risk lens credentials using the KERIA library.

## Features

- **Issue Risk Lens Credentials**: Create new risk assessment credentials with risk indicators and credit limits
- **Revoke Credentials**: Revoke existing credentials using their SAID (Self-Addressing Identifier)
- **Input Validation**: Comprehensive request validation for all endpoints
- **Error Handling**: Structured error responses with detailed error information
- **TypeScript**: Full TypeScript support with type safety
- **Security**: Built-in security middleware (Helmet, CORS)
- **Interactive Docs**: Auto-generated Swagger UI available for exploration

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "VLEI KERIA API",
    "version": "1.0.0",
    "timestamp": "2025-10-08T10:00:00.000Z"
  },
  "timestamp": "2025-10-08T10:00:00.000Z"
}
```

### Issue Risk Lens Credentials
```http
POST /credentials/issue-risk-lens
Content-Type: application/json
```

**Request Body:**
```json
{
  "riskIndicator": {
    "score": 75.5,
    "category": "medium-risk",
    "metadata": {
      "assessmentDate": "2025-10-08",
      "assessor": "risk-engine-v1"
    }
  },
  "creditLimit": {
    "amount": 100000,
    "currency": "USD",
    "type": "revolving"
  },
  "aid": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "credentialId": "cred_1728385200000_abc123def",
    "said": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI",
    "issuedAt": "2025-10-08T10:00:00.000Z"
  },
  "timestamp": "2025-10-08T10:00:00.000Z"
}
```

### Revoke Credential
```http
DELETE /credentials/revoke
Content-Type: application/json
```

**Request Body:**
```json
{
  "said": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "said": "EKYLUMmNPuoqfVjLVbpkRAEldY3z7F8xzLJhRU7V89eI",
    "revokedAt": "2025-10-08T10:00:00.000Z"
  },
  "timestamp": "2025-10-08T10:00:00.000Z"
}
```

## API Documentation

- Swagger UI: `http://localhost:3000/api-docs`
- Raw OpenAPI spec: `http://localhost:3000/api-docs.json`

The base path can be customized with the `SWAGGER_PATH` environment variable.

## Request Validation

### Risk Lens Credential Request Validation
- `riskIndicator.score`: Must be a number
- `riskIndicator.category`: Must be a non-empty string
- `creditLimit.amount`: Must be a non-negative number
- `creditLimit.currency`: Must be a 3-letter currency code
- `aid`: Must be a non-empty string (Agent Identifier)

### Revoke Credential Request Validation
- `said`: Must be a non-empty string (Self-Addressing Identifier)

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)"
  },
  "timestamp": "2025-10-08T10:00:00.000Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `CREDENTIAL_ISSUANCE_ERROR`: Failed to issue credential
- `CREDENTIAL_REVOCATION_ERROR`: Failed to revoke credential
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `NOT_FOUND`: Endpoint not found

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `KERIA_LIBRARY_PATH` | Optional override for VLEI KERIA library path | `./node_modules/vlei-keria-library` |
| `API_VERSION` | API version | `v1` |
| `API_PREFIX` | API prefix | `/api` |
| `LOG_LEVEL` | Logging level | `info` |
| `SWAGGER_PATH` | Base path for Swagger UI | `/api-docs` |

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── credential.controller.ts
│   └── index.ts
├── middleware/           # Custom middleware
│   ├── validation.ts
│   └── index.ts
├── routes/              # Route definitions
│   ├── credentials.ts
│   └── index.ts
├── services/            # Business logic
│   ├── credential.service.ts
│   └── index.ts
├── types/               # TypeScript type definitions
│   ├── credentials.ts
│   └── index.ts
├── app.ts               # Express app configuration
└── index.ts             # Application entry point
```

## Development

### Available Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm run clean`: Clean build directory

### Adding VLEI KERIA Library Integration

The service layer (`src/services/credential.service.ts`) is prepared for integration with the actual VLEI KERIA library. To integrate:

1. Import the KERIA library in the service
2. Initialize the KERIA client in the `initializeKeriaClient()` method
3. Replace the mock implementation with actual KERIA library calls

Example integration:
```typescript
private async initializeKeriaClient(): Promise<any> {
  const { KeriaClient } = require(path.join(this.keriaLibraryPath, 'index'));
  return new KeriaClient({
    // KERIA client configuration
  });
}
```

## Security Considerations

- Enable authentication/authorization as needed
- Configure CORS for production environments
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting
- Add logging and monitoring

## License

This project is licensed under the ISC License.