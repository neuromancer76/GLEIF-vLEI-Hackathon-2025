# VLEI Holder Credential Responder Daemon

A daemon application that automatically responds to VLEI credential presentation requests using the KERI/IPEX protocol.

## Overview

This daemon continuously monitors for incoming credential requests (IPEX apply messages) and automatically responds by:

1. **Detecting Requests**: Monitors KERI notifications for IPEX apply messages
2. **Extracting Verifier Info**: Gets the verifier prefix from the `rp` field in the offer
3. **Finding Credentials**: Searches for matching credentials based on schema requirements
4. **Presenting Credentials**: Automatically offers matching credentials to the requesting verifier
5. **Handling Errors**: Implements retry logic for failed presentations

## Features

- ✅ **Automatic Response**: No manual intervention required
- ✅ **Multi-Schema Support**: Handles requests for any credential schema
- ✅ **Retry Logic**: Automatically retries failed presentations
- ✅ **Graceful Shutdown**: Handles SIGINT/SIGTERM for clean shutdown
- ✅ **Configurable**: Environment-based configuration
- ✅ **Logging**: Detailed console logging with colored output
- ✅ **Error Handling**: Robust error handling and recovery

## Architecture

```
┌─────────────────────┐
│   Verifier App      │ ──── IPEX Apply ──────┐
└─────────────────────┘                        │
                                               ▼
┌─────────────────────┐              ┌─────────────────────┐
│ KERIA Agent Network │ ◄─────────── │  Holder Daemon      │
└─────────────────────┘              │                     │
                                     │ • Monitor requests  │
                                     │ • Find credentials  │
                                     │ • Auto respond      │
                                     │ • Handle retries    │
                                     └─────────────────────┘
```

## Installation

1. **Clone and Setup**:
   ```bash
   cd C:\\_WA\\vlei-gleif\\vlei-solution\\vlei-environment\\vlei-holder-credential-responder
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# KERIA connection settings
DEFAULT_ADMIN_URL=http://localhost:3901
DEFAULT_BOOT_URL=http://localhost:3903
SCHEMA_SERVER_HOST=http://localhost:7723

# Daemon settings
DAEMON_CHECK_INTERVAL_MS=5000
DAEMON_LOG_LEVEL=info

# Holder entity settings
HOLDER_ALIAS=holder
HOLDER_BRAN=YourHolderBranHere

# Notification processing settings
MAX_NOTIFICATIONS_PER_BATCH=10
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY_MS=2000
```

### Key Configuration Options

- **`DAEMON_CHECK_INTERVAL_MS`**: How often to check for new requests (default: 5000ms)
- **`HOLDER_ALIAS`**: The alias for your holder entity
- **`HOLDER_BRAN`**: The BRAN (seed) for your holder entity
- **`MAX_NOTIFICATIONS_PER_BATCH`**: Max notifications to process per cycle
- **`NOTIFICATION_RETRY_ATTEMPTS`**: Max retry attempts for failed presentations

## Usage

### Basic Usage

```bash
# Start the daemon
npm start

# Development mode with auto-restart
npm run dev
```

### Programmatic Usage

```typescript
import { VleiHolderDaemon, DaemonConfig } from './main.js';

const config: DaemonConfig = {
    holderAlias: 'my-holder',
    holderBran: 'MySecretBran123',
    checkInterval: 5000,
    maxNotificationsPerBatch: 10,
    retryAttempts: 3,
    retryDelay: 2000
};

const daemon = new VleiHolderDaemon(config);
await daemon.initialize();
await daemon.start();
```

## How It Works

### 1. Request Detection
The daemon continuously polls for unread IPEX apply notifications:
```typescript
const applyNotifications = notifications.notes.filter(
    (n: any) => n.a.r === IPEX_APPLY_ROUTE && n.r === false
);
```

### 2. Verifier Identification
Extracts the verifier prefix from the request:
```typescript
const verifierPrefix = applyExchange.exn?.rp || applyExchange.exn?.i;
```

### 3. Automatic Response
Uses the library's `holderReceivePresentationFlow` to:
- Find matching credentials
- Prepare IPEX offer message  
- Submit offer to verifier
- Handle the complete presentation flow

### 4. Error Handling
Failed requests are queued for retry with exponential backoff.

## Integration with vlei-keria-library

This daemon depends on the `vlei-keria-library` for core functionality:

```typescript
import {
    initializeSignify,
    initializeAndConnectClient,
    createEntity,
    holderReceivePresentationFlow,
    // ... other imports
} from 'vlei-keria-library';
```

## Logging

The daemon provides detailed logging with color-coded output:

- 🚀 **Initialization messages** (Blue)
- 📥 **Request detection** (Blue) 
- 🎯 **Verifier identification** (Blue)
- ✅ **Successful presentations** (Green)
- ❌ **Errors and failures** (Red/Yellow)
- 🔄 **Retry attempts** (Blue)

## Error Handling

The daemon implements several layers of error handling:

1. **Request-level errors**: Individual requests that fail are queued for retry
2. **Loop-level errors**: Daemon continues running even if one iteration fails
3. **Initialization errors**: Fatal errors cause daemon shutdown
4. **Graceful shutdown**: Handles SIGINT/SIGTERM signals

## Development

### Scripts

- `npm run build`: Compile TypeScript
- `npm start`: Build and run daemon
- `npm run dev`: Development mode with watch
- `npm run clean`: Clean build directory

### Project Structure

```
src/
├── main.ts              # Main daemon implementation
├── types/               # TypeScript type definitions
└── utils/               # Utility functions (if needed)
```

## Dependencies

- **signify-ts**: KERI/KERIA client library
- **vlei-keria-library**: Common VLEI operations
- **dotenv**: Environment variable management
- **@types/node**: Node.js type definitions

## License

Apache-2.0

## Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify your `.env` configuration
3. Ensure KERIA agent is running and accessible
4. Check network connectivity to schema server