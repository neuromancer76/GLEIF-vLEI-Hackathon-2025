# VLEI Keria Common

A TypeScript base library providing common types and utilities for VLEI Keria applications.

## Installation

```bash
npm install vlei-keria-common
```

## Usage

```typescript
import { Test, isTest } from 'vlei-keria-common';

// Create a Test object
const testObject: Test = {
  id: 'test-123',
  name: 'My Test',
  value: { some: 'data' },
  timestamp: new Date()
};

// Use the type guard
if (isTest(someUnknownObject)) {
  // TypeScript now knows someUnknownObject is of type Test
  console.log(someUnknownObject.name);
}
```

## Types

### Test

The main `Test` type includes:
- `id`: string - Unique identifier
- `name`: string - Human-readable name
- `value`: unknown - Any value
- `timestamp`: Date - Creation timestamp

## Building

```bash
npm run build
```

## Development

```bash
npm run build:watch
```

This will watch for changes and rebuild automatically.