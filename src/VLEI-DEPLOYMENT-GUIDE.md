# VLEI Solution - Complete Setup & Deployment Guide

This comprehensive guide covers building, configuring, and deploying the complete VLEI (Verifiable LEI) ecosystem including all microservices and infrastructure components.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Docker Infrastructure](#docker-infrastructure)
5. [Building Docker Images](#building-docker-images)
6. [Starting the Complete Solution](#starting-the-complete-solution)
7. [Testing & Validation](#testing--validation)
8. [Service Architecture](#service-architecture)
9. [Troubleshooting](#troubleshooting)
10. [Development Workflow](#development-workflow)

## 🔧 Prerequisites

### Required Software
- **Docker Desktop** (v4.0+) with Docker Compose
- **PowerShell** (Core 7.0+ recommended)
- **Git** for version control
- **Visual Studio Code** (recommended) or preferred IDE

### System Requirements
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Storage**: 10GB available disk space
- **Network**: Internet access for pulling dependencies and Azure services

### Azure Services (Optional but Recommended)
- **Azure OpenAI Service** account and API key
- **Application Insights** (for monitoring)
- **Azure Container Registry** (for image distribution)

## 🚀 Quick Start

### 1. Clone and Setup
```powershell
# Clone the repository
git clone <repository-url>
cd vlei-solution

# Copy environment template
Copy-Item ".env.example" ".env"

# Edit .env with your configuration
code .env
```

### 2. Build All Images
```powershell
# Build all Docker images with comprehensive rebuild script
.\rebuild-docker-images.ps1

# Alternative: Build specific service
.\rebuild-docker-images.ps1 build

# Clean rebuild (removes old images)
.\rebuild-docker-images.ps1 clean-build
```

### 3. Start Infrastructure
```powershell
# Start KERIA infrastructure first
cd vlei-environment/infrastructure-setup
docker-compose up -d

# Return to solution root
cd ../..
```

### 4. Start Application Services
```powershell
# Start all VLEI application services
docker-compose up -d

# View startup progress
docker-compose logs -f
```

### 5. Test Deployment
```powershell
# Run comprehensive tests
.\test-deployment.ps1

# Quick health check only  
.\test-deployment.ps1 quick
```

### 6. Access Application
- **VLEI Supplier Portal**: http://localhost:3000
- **API Documentation**: http://localhost:5184/swagger

## ⚙️ Environment Configuration

### .env File Configuration

Create and configure your `.env` file with the following settings:

```env
# Azure OpenAI Configuration (Required for AI features)
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_MODEL_NAME=gpt-4o

# Application Configuration
ENVIRONMENT=Development
LOG_LEVEL=Information

# Service Ports (modify if needed)
VLEI_REGISTRY_PORT=5136
VLEI_CHATBOT_PORT=5184
VLEI_SUPPLIER_BFF_PORT=5178
VLEI_WEB_PORT=3000
VLEI_HOLDER_PORT=3001

# KERIA Infrastructure Ports
KERIA_ADMIN_PORT=3901
KERIA_AGENT_PORT=3902
VLEI_SCHEMA_PORT=7723

# Database Configuration (if using external databases)
# CONNECTION_STRINGS__DefaultConnection=...

# Monitoring (Optional)
# APPLICATIONINSIGHTS_CONNECTION_STRING=...
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI service endpoint | Yes (for AI features) |
| `AZURE_OPENAI_API_KEY` | API key for Azure OpenAI | Yes (for AI features) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Model deployment name | Yes (for AI features) |
| `ENVIRONMENT` | Application environment (Development/Production) | No |

## 🐳 Docker Infrastructure

### Centralized Docker Structure

The solution uses a centralized Docker image structure for better organization:

```
vlei-solution/
├── dockerImages/                    # All Dockerfiles centralized here
│   ├── vlei-registry/
│   │   └── Dockerfile
│   ├── vlei-chatbot-api/
│   │   └── Dockerfile
│   ├── vlei-supplier-portal-bff/
│   │   └── Dockerfile
│   ├── vlei-supplier-portal-web/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── vlei-holder-credential-responder/
│       ├── Dockerfile
│       └── .dockerignore
├── docker-compose.yml              # Main orchestration
└── rebuild-docker-images.ps1       # Build automation
```

### Service Architecture Overview

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| **vlei-registry** | .NET 9.0 | 5136 | Trust registry and application discovery |
| **vlei-chatbot-api** | .NET 9.0 | 5184 | AI assistant using Azure OpenAI |
| **vlei-supplier-portal-bff** | .NET 9.0 | 5178 | Backend-for-frontend service |
| **vlei-supplier-portal-web** | React+Nginx | 3000 | User interface frontend |
| **vlei-holder-credential-responder** | Node.js+TS | 3001 | Automated credential responses |

## 🏗️ Building Docker Images

### Using the Rebuild Script

The `rebuild-docker-images.ps1` script provides comprehensive Docker image management:

```powershell
# Show help and options
.\rebuild-docker-images.ps1 -help

# Standard rebuild (recommended)
.\rebuild-docker-images.ps1 rebuild

# Build without Docker cache (slower but ensures fresh build)
.\rebuild-docker-images.ps1 rebuild -NoCache

# Clean rebuild (removes old images first)
.\rebuild-docker-images.ps1 clean-build

# Parallel build (faster on multi-core systems)
.\rebuild-docker-images.ps1 rebuild -Parallel

# Test built images only
.\rebuild-docker-images.ps1 test
```

### Manual Docker Commands

If you prefer manual control:

```powershell
# Build all services
docker-compose build

# Build specific service
docker-compose build vlei-registry

# Build without cache
docker-compose build --no-cache

# View built images
docker images | Select-String "vlei-"
```

### Build Process Details

The build process includes:
1. **Prerequisites validation** (Docker, environment files)
2. **Dependency order handling** (independent services first)
3. **Multi-stage Docker builds** for optimized image sizes
4. **Health check integration** for all services
5. **Build time tracking** and comprehensive reporting

## 🌐 Starting the Complete Solution

### Step-by-Step Startup

#### 1. Infrastructure First
```powershell
# Start KERIA infrastructure (required for VLEI operations)
cd vlei-environment/infrastructure-setup
docker-compose up -d

# Verify infrastructure is running
docker-compose ps

# Check KERIA health
curl http://localhost:3901/ping
curl http://localhost:3902/ping
```

#### 2. Application Services
```powershell
# Return to solution root
cd ../..

# Start all VLEI application services
docker-compose up -d

# Monitor startup logs
docker-compose logs -f

# Check service status
docker-compose ps
```

#### 3. Service Startup Order

Services start in dependency order:
1. **vlei-registry** (independent, starts first)
2. **vlei-holder-credential-responder** (independent)  
3. **vlei-supplier-portal-bff** (depends on registry)
4. **vlei-chatbot-api** (depends on registry and BFF)
5. **vlei-supplier-portal-web** (depends on chatbot and BFF)

### Service Management Commands

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart vlei-chatbot-api

# View service logs
docker-compose logs vlei-registry

# Follow logs in real-time
docker-compose logs -f vlei-chatbot-api

# Scale service (if supported)
docker-compose up -d --scale vlei-registry=2
```

## 🧪 Testing & Validation

### Comprehensive Testing Script

The `test-deployment.ps1` script provides multiple testing levels:

```powershell
# Full test suite (recommended)
.\test-deployment.ps1 full

# Quick health checks only
.\test-deployment.ps1 quick

# Health endpoint tests
.\test-deployment.ps1 health

# Integration tests between services
.\test-deployment.ps1 integration

# Show service logs during testing
.\test-deployment.ps1 full -ShowLogs

# Custom timeout for slow networks
.\test-deployment.ps1 full -TimeoutSeconds 180

# Skip infrastructure checks
.\test-deployment.ps1 full -SkipInfrastructure
```

### Manual Testing

#### Health Endpoints
```powershell
# Test individual service health
Invoke-RestMethod http://localhost:5136/health  # Registry
Invoke-RestMethod http://localhost:5184/health  # Chatbot API  
Invoke-RestMethod http://localhost:5178/health  # Supplier BFF
Invoke-WebRequest http://localhost:3000/health.html  # Web Frontend
```

#### API Endpoints
```powershell
# Test Registry API
Invoke-RestMethod http://localhost:5136/api/applications

# Test Supplier BFF API
Invoke-RestMethod http://localhost:5178/api/grants

# Test Chatbot API (POST request)
$body = @{
    message = "Hello"
    conversationId = "test-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5184/api/chat `
                  -Method Post `
                  -ContentType "application/json" `
                  -Body $body
```

### Expected Test Results

A successful deployment should show:
- ✅ All 5 services running and healthy
- ✅ Infrastructure services accessible (KERIA, schemas)
- ✅ API endpoints responding correctly  
- ✅ Frontend serving React application
- ✅ Integration tests passing

## 🏛️ Service Architecture

### Component Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Frontend  │◄──►│ Supplier BFF API │◄──►│  Registry API   │
│  (React+Nginx)  │    │   (.NET Core)    │    │  (.NET Core)    │
│   Port: 3000    │    │   Port: 5178     │    │   Port: 5136    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                         ┌──────────────────┐
                         │   Chatbot API    │
                         │   (.NET Core)    │
                         │   Port: 5184     │
                         └──────────────────┘
                                  │
                         ┌──────────────────┐
                         │ Azure OpenAI API │
                         │  (External SaaS) │
                         └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    KERIA Infrastructure                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ KERIA Agent │  │ KERIA Admin │  │   Credential Responder  │ │  
│  │ Port: 3901  │  │ Port: 3902  │  │      (Node.js)          │ │
│  └─────────────┘  └─────────────┘  │      Port: 3001         │ │
│                                    └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Service Dependencies

- **vlei-registry**: Independent service (starts first)
- **vlei-supplier-portal-bff**: Depends on vlei-registry
- **vlei-chatbot-api**: Depends on vlei-registry, vlei-supplier-portal-bff
- **vlei-supplier-portal-web**: Depends on vlei-chatbot-api, vlei-supplier-portal-bff
- **vlei-holder-credential-responder**: Independent service

### Data Flow

1. **User Request**: Browser → React Frontend (port 3000)
2. **API Proxy**: Frontend → Nginx → Backend services
3. **Service Discovery**: BFF → Registry API (port 5136) 
4. **AI Processing**: Chatbot → Azure OpenAI Service
5. **Credential Operations**: Services → KERIA Infrastructure

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Docker Issues

**Issue**: Services fail to start
```powershell
# Check Docker daemon is running
docker version

# Check available resources
docker system df

# Clean up unused resources
docker system prune -f

# Restart Docker Desktop
Restart-Service docker  # (if running as service)
```

**Issue**: Port conflicts
```powershell
# Check what's using a port
netstat -ano | findstr :3000

# Kill process using port
taskkill /PID <process-id> /F

# Or modify ports in .env file
```

#### Build Issues

**Issue**: Docker build fails
```powershell
# Clean rebuild without cache
.\rebuild-docker-images.ps1 clean-build

# Build specific service with detailed output
docker-compose build --no-cache vlei-registry

# Check Dockerfile syntax
docker build -f dockerImages/vlei-registry/Dockerfile .
```

**Issue**: Node.js dependency errors (vlei-holder-credential-responder)
```powershell
# Check package.json for local dependencies
cat vlei-holder-credential-responder/package.json

# Verify vlei-keria-library is accessible
ls vlei-keria-library/

# Rebuild with npm cache clean
docker-compose build --no-cache vlei-holder-credential-responder
```

#### Runtime Issues

**Issue**: Service health checks fail
```powershell
# Check service logs
docker-compose logs vlei-chatbot-api

# Test health endpoint directly
curl http://localhost:5184/health

# Restart specific service
docker-compose restart vlei-chatbot-api

# Check environment variables
docker-compose exec vlei-chatbot-api env | grep AZURE
```

**Issue**: Azure OpenAI connection fails
```powershell
# Verify environment variables are set
cat .env | grep AZURE_OPENAI

# Test API key manually
curl -H "api-key: $AZURE_OPENAI_API_KEY" $AZURE_OPENAI_ENDPOINT

# Check service logs for authentication errors
docker-compose logs vlei-chatbot-api | grep -i "auth\|api"
```

#### Network Issues

**Issue**: Services can't communicate with each other
```powershell
# Check Docker network
docker network ls
docker network inspect vlei-solution_default

# Test service-to-service communication
docker-compose exec vlei-chatbot-api curl http://vlei-registry:5136/health

# Verify keri_network connection
docker network inspect keri_network
```

### Debug Commands

```powershell
# Service status overview
.\test-deployment.ps1 quick

# View all container logs
docker-compose logs

# Interactive troubleshooting
docker-compose exec vlei-registry /bin/bash

# Check resource usage
docker stats

# Network diagnostics
docker-compose exec vlei-chatbot-api nslookup vlei-registry
```

## 👩‍💻 Development Workflow

### Hot Reload Development

For active development, you can run services individually:

```powershell
# Stop specific service in Docker
docker-compose stop vlei-chatbot-api

# Run service locally for development
cd vlei-ecosystem-agent/vlei-chatbot-api
dotnet run

# Or use Visual Studio/VS Code debugging
```

### Code Changes and Rebuilds

```powershell
# After code changes, rebuild specific service
docker-compose build vlei-chatbot-api

# Restart service with new image
docker-compose up -d vlei-chatbot-api

# Or use rebuild script for comprehensive rebuild
.\rebuild-docker-images.ps1 rebuild
```

### Testing Individual Components

```powershell
# Test specific service health
.\test-deployment.ps1 health

# Test integration between specific services
Invoke-RestMethod http://localhost:5178/api/supplier

# View logs for debugging
docker-compose logs -f vlei-supplier-portal-bff
```

### Environment Switching

```powershell
# Development environment
$ENV:ASPNETCORE_ENVIRONMENT="Development"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production environment  
$ENV:ASPNETCORE_ENVIRONMENT="Production"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring & Logs

### Log Management

```powershell
# View logs for all services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific time range
docker-compose logs --since="1h" vlei-chatbot-api

# Export logs for analysis
docker-compose logs > vlei-deployment-logs.txt
```

### Health Monitoring

```powershell
# Continuous health monitoring
while ($true) {
    .\test-deployment.ps1 quick
    Start-Sleep -Seconds 30
}

# Monitor resource usage
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🚀 Next Steps

After successful deployment:

1. **Configure Business Logic**: Add your specific VLEI credential schemas and rules
2. **Customize UI**: Modify the React frontend for your organization's branding
3. **Add Authentication**: Implement proper user authentication and authorization
4. **Set up Monitoring**: Configure Application Insights or your preferred monitoring solution
5. **Deploy to Production**: Use Azure Container Instances, AKS, or your preferred container platform

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs [service-name]`
3. Run diagnostic tests: `.\test-deployment.ps1 full -ShowLogs`
4. Check the project repository for known issues and updates

---

*Last updated: October 2025*
*VLEI Solution v1.0*