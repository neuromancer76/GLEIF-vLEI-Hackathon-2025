# VLEI Docker Images

This directory contains all the centralized Dockerfiles for the VLEI ecosystem services. Each service has its own subdirectory with its Dockerfile and related configuration files.

## Structure

```
dockerImages/
├── vlei-chatbot-api/          # AI-powered chatbot service
│   └── Dockerfile
├── vlei-holder-credential-responder/  # Automated credential response daemon
│   ├── Dockerfile
│   └── .dockerignore
├── vlei-registry/             # Trust registry and application discovery
│   └── Dockerfile
├── vlei-supplier-portal-bff/  # Backend-for-frontend service
│   └── Dockerfile
└── vlei-supplier-portal-web/  # React frontend with Nginx
    ├── Dockerfile
    └── nginx.conf
```

## Build Context

All Dockerfiles are designed to be built from the **solution root directory** (the parent of this dockerImages folder) to have access to all source code and dependencies.

### Example Build Commands

```bash
# Build individual services
docker build -f dockerImages/vlei-registry/Dockerfile -t vlei-registry:latest .
docker build -f dockerImages/vlei-chatbot-api/Dockerfile -t vlei-chatbot-api:latest .

# Build using docker-compose (recommended)
docker-compose build vlei-registry
docker-compose build vlei-chatbot-api

# Build all services
docker-compose build
```

## Service Descriptions

### vlei-chatbot-api
- **Technology**: .NET 9.0 ASP.NET Core
- **Purpose**: AI-powered assistant using Azure OpenAI
- **Port**: 5184
- **Dependencies**: Azure OpenAI, VLEI services

### vlei-registry  
- **Technology**: .NET 9.0 ASP.NET Core
- **Purpose**: Trust registry and application discovery service
- **Port**: 5136
- **Dependencies**: None (standalone service)

### vlei-supplier-portal-bff
- **Technology**: .NET 9.0 ASP.NET Core  
- **Purpose**: Backend-for-frontend service for supplier portal
- **Port**: 5178
- **Dependencies**: VLEI Registry, KERIA, GLEIF API

### vlei-supplier-portal-web
- **Technology**: React + Vite + Nginx
- **Purpose**: Frontend web application
- **Port**: 3000
- **Dependencies**: Backend services via API proxy

### vlei-holder-credential-responder
- **Technology**: Node.js + TypeScript
- **Purpose**: Daemon for automated credential presentations
- **Port**: 3001
- **Dependencies**: KERIA services, VLEI schemas

## Multi-Stage Builds

All Dockerfiles use multi-stage builds for optimized production images:

1. **Build Stage**: Installs dependencies and compiles code
2. **Runtime Stage**: Contains only runtime dependencies and compiled application

## Health Checks

All services include health check endpoints:
- .NET services: `/health` endpoint
- React frontend: `/health.html` endpoint  
- Node.js service: Process monitoring

## Environment Variables

Services are configured via environment variables defined in:
- `docker-compose.yml` - Service-specific configuration
- `.env` file - User-specific settings (Azure OpenAI, etc.)

## Networking

Services communicate via Docker networks:
- `keri_network` (external) - Connects to VLEI infrastructure
- `vlei_app_network` (internal) - Inter-service communication

## Usage with Docker Compose

The `docker-compose.yml` in the solution root references these Dockerfiles:

```yaml
services:
  vlei-registry:
    build:
      context: .
      dockerfile: ./dockerImages/vlei-registry/Dockerfile
```

This ensures all services can access the complete source code tree during build.