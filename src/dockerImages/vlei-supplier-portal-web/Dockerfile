# VLEI Supplier Portal Web Dockerfile
# Multi-stage build for React/Vite application
# Build context: solution root directory

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY vlei-supplier-porta-web/supplier-portal/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY vlei-supplier-porta-web/supplier-portal/ .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY dockerImages/vlei-supplier-portal-web/nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for logs
RUN mkdir -p /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health.html || exit 1

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]