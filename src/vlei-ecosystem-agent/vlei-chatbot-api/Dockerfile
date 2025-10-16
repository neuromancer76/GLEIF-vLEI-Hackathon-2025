# VLEI Chatbot API Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY vlei-chatbot-api.csproj ./
RUN dotnet restore vlei-chatbot-api.csproj

# Copy source code and build
COPY . .
RUN dotnet build vlei-chatbot-api.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish vlei-chatbot-api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Copy configuration prompt files if they exist
COPY ConfigurationPrompt/ ./ConfigurationPrompt/

# Create directory for logs and temporary files
RUN mkdir -p /app/logs /app/temp

# Set environment variables with defaults
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5184
ENV ASPNETCORE_HTTP_PORTS=5184

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5184/health || exit 1

# Expose port
EXPOSE 5184

# Set entry point
ENTRYPOINT ["dotnet", "vlei-chatbot-api.dll"]