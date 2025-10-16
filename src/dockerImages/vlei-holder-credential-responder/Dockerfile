# VLEI Holder Credential Responder Dockerfile
# Multi-stage build for Node.js TypeScript application
# Build context: solution root directory

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# First, copy and build the vlei-keria-common dependency
COPY vlei-keria-proxy/vlei-keria-common/ ./vlei-keria-common/
WORKDIR /app/vlei-keria-common
RUN npm install && npm run build

# Set up the main application
WORKDIR /app/holder-responder

# Copy package files for the holder responder
COPY vlei-keria-proxy/vlei-holder-credential-responder/package.docker.json ./package.json
COPY vlei-keria-proxy/vlei-holder-credential-responder/package-lock.json ./

# Copy source code
COPY vlei-keria-proxy/vlei-holder-credential-responder/ .

# Install dependencies including dev dependencies for build
# The local dependency will be resolved correctly now
RUN npm install --legacy-peer-deps

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# First set up vlei-keria-common dependency
COPY --from=build /app/vlei-keria-common ./vlei-keria-common/

# Set up main application
# Copy package files and install production dependencies only
COPY vlei-keria-proxy/vlei-holder-credential-responder/package.docker.json ./package.json
COPY vlei-keria-proxy/vlei-holder-credential-responder/package-lock.json ./

RUN npm install --production --legacy-peer-deps && npm cache clean --force

RUN npm list --production

# Copy built application from build stage
COPY --from=build /app/holder-responder/dist ./dist

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data

# Set NODE_ENV to production
ENV NODE_ENV=production

# Health check - check if the process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD pgrep -f "node.*main.js" || exit 1

# Expose port (if the daemon exposes any monitoring endpoint)
EXPOSE 3001

# Set entry point
ENTRYPOINT ["node", "dist/main.js"]