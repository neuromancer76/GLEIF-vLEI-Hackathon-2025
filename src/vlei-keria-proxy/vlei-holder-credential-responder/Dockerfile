# VLEI Holder Credential Responder Dockerfile
# Multi-stage build for Node.js TypeScript application

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.docker.json ./package.json
COPY package-lock.json ./
COPY ../vlei-keria-common ./vlei-keria-common

RUN ls

# Install dependencies including dev dependencies for build
RUN npm install --legacy-peer-deps || npm install --force || npm install --no-optional

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --production --legacy-peer-deps && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

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