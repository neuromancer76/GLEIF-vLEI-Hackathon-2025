# Enhanced Credential Schema Filtering Implementation

## Overview

This document outlines the enhanced credential schema filtering implementation for the Signify browser extension. The extension now provides robust filtering of selectable credentials based on the schema of the credential object when handling "/signify/authorize/credential" messages.

## Key Features

### 1. Enhanced Schema Matching Logic

The implementation provides flexible credential schema matching with the following priority:

1. **Exact Schema ID Match** (Highest Priority)
   - Direct comparison of `schema.id` fields
   - Most precise matching method

2. **Credential Type Match** (Medium Priority)
   - Comparison of `schema.credentialType` fields
   - Useful for categorical filtering

3. **Title Match** (Lower Priority)
   - Comparison of `schema.title` fields
   - Fallback option for less structured schemas

4. **Flexible Matching**
   - Supports any of the above fields matching
   - Handles both string and object schema requirements

### 2. Implementation Components

#### Core Utility (`src/shared/credential-utils.ts`)
- `matchesCredentialSchema()`: Main schema matching function
- `filterCredentialsBySchema()`: Utility for filtering credential arrays
- `logSchemaMatching()`: Debug logging utility

#### Content Script Enhancement (`src/pages/content/index.tsx`)
- Enhanced `getFilteredSignins()` function
- Session storage of schema requirements for UI access
- Improved filtering logic for credential selection

#### Background Handlers (`src/pages/background/handlers/resource.ts`)
- Enhanced `handleCreateSignin()` with better schema matching
- New handlers for storing/retrieving schema requirements:
  - `handleStoreCredentialSchemaRequirement()`
  - `handleFetchCredentialSchemaRequirement()`

#### UI Components (`src/components/selectCredential.tsx`)
- Schema-aware credential filtering in the selection UI
- Automatic retrieval and application of schema requirements
- Real-time filtering based on stored schema requirements

### 3. Message Flow

1. **Web Page Request**: Sends "/signify/authorize/credential" with schema parameter
2. **Content Script**: 
   - Stores schema requirement in session storage
   - Filters available signins based on schema
   - Displays filtered credentials in dialog
3. **UI Components**: 
   - Retrieves schema requirements from session storage
   - Applies additional filtering in credential selection UI
4. **Background Handler**: Uses enhanced schema matching for signin creation

### 4. Schema Format Support

The implementation supports multiple schema format inputs:

#### String Format
```javascript
// Treated as schema.id
"EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zfkS3fD_XP"
```

#### Object Format
```javascript
{
  "id": "EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zfkS3fD_XP",
  "credentialType": "VerifiableCredential",
  "title": "Education Certificate"
}
```

### 5. Event Types Added

#### CS_EVENTS (Content Script)
- `store_credential_schema_requirement`: Stores schema requirements

#### UI_EVENTS (User Interface)
- `fetch_credential_schema_requirement`: Retrieves schema requirements

## Usage Examples

### Basic Schema Filtering (String ID)
```javascript
// Web page sends
{
  type: "/signify/authorize/credential",
  payload: {
    schema: "EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zfkS3fD_XP"
  }
}
```

### Advanced Schema Filtering (Object)
```javascript
// Web page sends
{
  type: "/signify/authorize/credential",
  payload: {
    schema: {
      credentialType: "EducationCredential",
      title: "University Degree"
    }
  }
}
```

### Multiple Field Matching
```javascript
// Web page sends
{
  type: "/signify/authorize/credential",  
  payload: {
    schema: {
      id: "EBfdlu8R27Fbx-ehrqwImnK-8Qjy0zfkS3fD_XP",
      credentialType: "VerifiableCredential",
      title: "Professional Certificate"
    }
  }
}
```

## Benefits

1. **Precision**: More accurate credential matching based on schema
2. **Flexibility**: Supports multiple schema formats and matching strategies
3. **User Experience**: Users only see relevant credentials for selection
4. **Security**: Reduces chance of incorrect credential selection
5. **Maintainability**: Centralized schema matching logic in shared utilities

## Backward Compatibility

The implementation maintains full backward compatibility:
- No schema requirement: All credentials are shown
- Legacy string-based schema matching: Continues to work
- Existing credential selection flow: Unchanged for users

## Testing Considerations

1. Test with various schema formats (string, object)
2. Verify filtering works in both content script and UI components
3. Test session storage persistence across page navigation
4. Validate fallback behavior when no schema is specified
5. Ensure backward compatibility with existing implementations

## Future Enhancements

Potential areas for future improvement:
1. Regular expression support for flexible pattern matching
2. Schema validation against JSON Schema definitions
3. Fuzzy matching for similar but not exact schema fields
4. User preference storage for preferred credential types
5. Schema-based credential sorting and prioritization