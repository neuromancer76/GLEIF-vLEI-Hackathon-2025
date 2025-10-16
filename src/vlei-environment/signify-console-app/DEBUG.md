# Debugging Guide for Signify Console Application

This guide explains how to debug the Signify Console Application effectively using the enhanced debugging setup.

## Quick Start

### 1. VS Code Debugging (Recommended)

**Option A: Press F5 or use "Run and Debug" panel**
- Select "Debug Signify App" configuration
- This will automatically build and start debugging with breakpoints

**Option B: Using Command Palette**
- `Ctrl+Shift+P` → "Debug: Start Debugging"
- Choose "Debug Signify App"

### 2. Command Line Debugging

```bash
# Build and run with Node.js debugger
npm run debug

# Then attach VS Code debugger using "Debug Signify App (Attach)" configuration
```

### 3. Enhanced Logging

Enable debug logging by setting environment variables:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set:
DEBUG_VERBOSE=true
DEBUG_TIMESTAMPS=true  
DEBUG_TRACE=true
```

## Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Build and run normally |
| `npm run dev` | Build and run (same as start) |
| `npm run debug` | Build and run with Node.js debugger |
| `npm run build` | Compile TypeScript only |
| `npm run watch` | Watch TypeScript files for changes |
| `npm run clean` | Remove dist folder |

## VS Code Debug Configurations

### "Debug Signify App"
- **Purpose**: Main debugging configuration
- **Features**: 
  - Automatic build before debugging
  - Full source map support
  - Integrated terminal output
  - Breakpoint support in TypeScript files

### "Debug Signify App (Attach)"
- **Purpose**: Attach to an already running debug session
- **Usage**: Run `npm run debug` first, then use this config

### "Debug Current TypeScript File"
- **Purpose**: Debug individual TypeScript files
- **Usage**: Open any .ts file and press F5

## Debug Features

### 1. Enhanced Logging
- **Section headers**: Clear visual separation of application phases
- **Structured logging**: Different log levels (DEBUG, INFO, WARN, ERROR)
- **Data inspection**: Automatic JSON formatting of complex objects
- **Timestamps**: Optional timestamp prefixes
- **Function tracing**: Track function entry/exit

### 2. Breakpoint-Friendly Code
- Clear separation of logical steps
- Meaningful variable names
- Strategic async/await breakpoints
- Error handling with detailed context

### 3. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG_VERBOSE` | Enable detailed debug logs | `false` |
| `DEBUG_TIMESTAMPS` | Add timestamps to logs | `true` |
| `DEBUG_TRACE` | Enable function call tracing | `false` |
| `NODE_ENV` | Node environment | `development` |

## Debugging Workflow

### 1. **Set Breakpoints**
- Click in the gutter next to line numbers in VS Code
- Red dots indicate active breakpoints

### 2. **Start Debugging** 
- Press F5 or use "Run and Debug" panel
- Choose "Debug Signify App"

### 3. **Inspect Variables**
- Hover over variables to see values
- Use "Variables" panel in Debug view
- Use "Watch" panel to monitor specific expressions

### 4. **Step Through Code**
- **F10**: Step over (next line)
- **F11**: Step into (enter functions)
- **Shift+F11**: Step out (exit function)
- **F5**: Continue execution

### 5. **Examine Output**
- Check "Debug Console" for debug output
- Use "Terminal" for application logs
- Monitor "Problems" panel for TypeScript errors

## Common Debugging Scenarios

### Client Connection Issues
1. Set breakpoint in `initializeAndConnectClient` function
2. Inspect connection parameters
3. Check KERIA agent URLs in environment

### OOBI Resolution Problems  
1. Set breakpoint before `resolveOOBI` calls
2. Inspect OOBI URLs and client states
3. Check network connectivity to agents

### Credential Issuance Issues
1. Set breakpoint before credential operations
2. Inspect registry and schema states
3. Check AID permissions and roles

### Async Operation Debugging
1. Use breakpoints on `await` statements
2. Inspect promise states in Variables panel
3. Check operation responses and error handling

## Tips for Effective Debugging

1. **Use conditional breakpoints**: Right-click breakpoint → "Edit Breakpoint"
2. **Log points**: Add logging without modifying code
3. **Call stack inspection**: See the execution path in Call Stack panel
4. **Variable watching**: Add expressions to Watch panel
5. **Console evaluation**: Use Debug Console to run code at breakpoints

## Troubleshooting

### Debug Not Starting
- Ensure TypeScript compiles without errors: `npm run build`
- Check that .vscode/launch.json exists
- Verify Node.js version compatibility

### Breakpoints Not Hit
- Ensure source maps are enabled in tsconfig.json
- Check that files are compiled to dist/ folder
- Verify breakpoints are in executable code paths

### Performance Issues
- Disable verbose logging in production: `DEBUG_VERBOSE=false`
- Use selective breakpoints instead of stepping through everything
- Consider using log points instead of stopping execution

## Advanced Debugging

### Memory Inspection
```javascript
// In Debug Console, inspect memory usage
process.memoryUsage()
```

### Network Request Debugging
```javascript
// Add to Debug Console to trace HTTP requests
// (if using HTTP debugging libraries)
```

### Custom Debug Commands
```javascript
// In Debug Console, access application state
// Example: inspect client state
issuerClient.state()
```

## Integration with External Tools

### Chrome DevTools
```bash
# Run with Chrome DevTools support
node --inspect-brk dist/main.js
# Then open chrome://inspect in Chrome
```

### Logging Integration
- Logs are structured for easy parsing
- Compatible with log aggregation tools
- JSON format available for structured logging

---

**Remember**: Effective debugging is about understanding the flow of your application. Use these tools to gain insights into the KERI identity management workflow and credential operations.