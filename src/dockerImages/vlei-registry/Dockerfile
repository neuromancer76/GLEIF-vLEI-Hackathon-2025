# VLEI Registry Dockerfile
# Multi-stage build for .NET Core application
# Build context: solution root directory

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY vlei-registry/vlei-registry.csproj ./
RUN dotnet restore vlei-registry.csproj

# Copy source code and build
COPY vlei-registry/ .
RUN dotnet build vlei-registry.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish vlei-registry.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5136
ENV ASPNETCORE_HTTP_PORTS=5136

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5136/health || exit 1

# Expose port
EXPOSE 5136

# Set entry point
ENTRYPOINT ["dotnet", "vlei-registry.dll"]