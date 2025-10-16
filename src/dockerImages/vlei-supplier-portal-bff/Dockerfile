# VLEI Supplier Portal BFF Dockerfile
# Multi-stage build for .NET Core application
# Build context: solution root directory

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy all project files for restore
COPY vlei-supplier-portal-common/vlei-supplier-portal-common/vlei-supplier-portal-common.csproj ./vlei-supplier-portal-common/vlei-supplier-portal-common/
COPY vlei-supplier-portal-bff/supplier-bff/supplier-bff.csproj ./vlei-supplier-portal-bff/supplier-bff/

# Restore dependencies for both projects
WORKDIR /src/vlei-supplier-portal-bff/supplier-bff
RUN dotnet restore supplier-bff.csproj

# Copy all source files
WORKDIR /src
COPY vlei-supplier-portal-common/vlei-supplier-portal-common/ ./vlei-supplier-portal-common/vlei-supplier-portal-common/
COPY vlei-supplier-portal-bff/supplier-bff/ ./vlei-supplier-portal-bff/supplier-bff/

# Build the project
WORKDIR /src/vlei-supplier-portal-bff/supplier-bff
RUN dotnet build supplier-bff.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
WORKDIR /src/vlei-supplier-portal-bff/supplier-bff
RUN dotnet publish supplier-bff.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Create directories for logs, data, and email output
RUN mkdir -p /app/logs /app/data /app/EmailOutput

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5178
ENV ASPNETCORE_HTTP_PORTS=5178

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5178/health || exit 1

# Expose port
EXPOSE 5178

# Set entry point
ENTRYPOINT ["dotnet", "supplier-bff.dll"]