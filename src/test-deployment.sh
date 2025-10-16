#!/bin/bash

# VLEI Ecosystem Deployment Test Script
# Tests all service health endpoints and basic functionality

set -e

echo "🐳 VLEI Ecosystem Health Check & Test Suite"
echo "==========================================="

# Configuration
REGISTRY_URL="http://localhost:5136"
BFF_URL="http://localhost:5178"
CHATBOT_URL="http://localhost:5184"
WEB_URL="http://localhost:3000"
HOLDER_URL="http://localhost:3001"

# KERI Infrastructure URLs
KERIA_ADMIN_URL="http://localhost:3901"
KERIA_AGENT_URL="http://localhost:3902"
VLEI_SCHEMA_URL="http://localhost:7723"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_endpoint() {
    local url=$1
    local service_name=$2
    local timeout=${3:-10}
    
    echo -n "Testing $service_name... "
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

test_health_endpoint() {
    local url=$1
    local service_name=$2
    
    echo -n "Health check $service_name... "
    
    response=$(curl -f -s --max-time 10 "$url" 2>/dev/null || echo "ERROR")
    
    if [[ $response == *"Healthy"* ]] || [[ $response == "healthy" ]]; then
        echo -e "${GREEN}✓ HEALTHY${NC}"
        return 0
    else
        echo -e "${RED}✗ UNHEALTHY${NC} ($response)"
        return 1
    fi
}

check_docker_services() {
    echo -e "${BLUE}📦 Checking Docker Services${NC}"
    echo "=============================="
    
    # Check if docker-compose is running
    if ! docker-compose ps | grep -q "Up"; then
        echo -e "${RED}❌ No running Docker Compose services found${NC}"
        echo "Please run: docker-compose up -d"
        exit 1
    fi
    
    # List running services
    echo "Running services:"
    docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
    echo ""
}

test_infrastructure_services() {
    echo -e "${BLUE}🏗️ Testing VLEI Infrastructure Services${NC}"
    echo "========================================"
    
    local failed=0
    
    # Test KERIA services
    test_endpoint "$KERIA_ADMIN_URL" "KERIA Admin" 15 || failed=$((failed + 1))
    test_endpoint "$KERIA_AGENT_URL" "KERIA Agent" 15 || failed=$((failed + 1))
    test_endpoint "$VLEI_SCHEMA_URL/ping" "VLEI Schema Server" 10 || failed=$((failed + 1))
    
    echo ""
    return $failed
}

test_application_services() {
    echo -e "${BLUE}🚀 Testing VLEI Application Services${NC}"
    echo "==================================="
    
    local failed=0
    
    # Test health endpoints
    test_health_endpoint "$REGISTRY_URL/health" "Registry Service" || failed=$((failed + 1))
    test_health_endpoint "$BFF_URL/health" "Supplier BFF" || failed=$((failed + 1))
    test_health_endpoint "$CHATBOT_URL/health" "Chatbot API" || failed=$((failed + 1))
    test_health_endpoint "$WEB_URL/health.html" "Web Frontend" || failed=$((failed + 1))
    
    # Test basic connectivity
    test_endpoint "$HOLDER_URL" "Holder Responder" 10 || failed=$((failed + 1))
    
    echo ""
    return $failed
}

test_api_endpoints() {
    echo -e "${BLUE}🔌 Testing API Endpoints${NC}"
    echo "========================"
    
    local failed=0
    
    # Test Registry API
    echo -n "Registry API (/applications)... "
    if curl -f -s --max-time 10 "$REGISTRY_URL/api/applications" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        failed=$((failed + 1))
    fi
    
    # Test BFF API
    echo -n "Supplier BFF API (/api/supplier)... "
    if curl -f -s --max-time 10 "$BFF_URL/api/supplier" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        failed=$((failed + 1))
    fi
    
    # Test Chatbot API
    echo -n "Chatbot API (/chat)... "
    response=$(curl -f -s --max-time 10 -X POST \
        -H "Content-Type: application/json" \
        -d '{"message": "test", "conversationId": "test"}' \
        "$CHATBOT_URL/api/chat" 2>/dev/null || echo "ERROR")
    
    if [[ $response != "ERROR" ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    return $failed
}

test_web_frontend() {
    echo -e "${BLUE}🌐 Testing Web Frontend${NC}"
    echo "======================="
    
    local failed=0
    
    # Test main page
    echo -n "Main page load... "
    if curl -f -s --max-time 10 "$WEB_URL" | grep -q "html"; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        failed=$((failed + 1))
    fi
    
    # Test static assets
    echo -n "Static assets... "
    if curl -f -s --max-time 10 "$WEB_URL/vite.svg" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${YELLOW}? SKIP${NC} (assets may not be built)"
    fi
    
    echo ""
    return $failed
}

check_environment() {
    echo -e "${BLUE}⚙️ Checking Environment Configuration${NC}"
    echo "===================================="
    
    if [ -f ".env" ]; then
        echo -e "${GREEN}✓${NC} .env file exists"
        
        # Check for required variables
        if grep -q "AZURE_OPENAI_ENDPOINT" .env && grep -q "AZURE_OPENAI_API_KEY" .env; then
            echo -e "${GREEN}✓${NC} Azure OpenAI configuration found"
        else
            echo -e "${YELLOW}⚠${NC} Azure OpenAI configuration missing (some features may not work)"
        fi
    else
        echo -e "${YELLOW}⚠${NC} .env file not found - copy from .env.example"
    fi
    
    echo ""
}

show_service_urls() {
    echo -e "${BLUE}🔗 Service URLs${NC}"
    echo "==============="
    echo "Web Frontend:     $WEB_URL"
    echo "Registry API:     $REGISTRY_URL"
    echo "Supplier BFF:     $BFF_URL"
    echo "Chatbot API:      $CHATBOT_URL"
    echo "Holder Responder: $HOLDER_URL"
    echo ""
    echo "KERI Infrastructure:"
    echo "KERIA Admin:      $KERIA_ADMIN_URL"
    echo "KERIA Agent:      $KERIA_AGENT_URL"
    echo "VLEI Schemas:     $VLEI_SCHEMA_URL"
    echo ""
}

show_logs() {
    echo -e "${BLUE}📋 Recent Service Logs${NC}"
    echo "======================"
    
    services=("vlei-registry" "vlei-supplier-portal-bff" "vlei-chatbot-api" "vlei-holder-credential-responder" "vlei-supplier-portal-web")
    
    for service in "${services[@]}"; do
        echo -e "${YELLOW}--- $service logs (last 5 lines) ---${NC}"
        docker-compose logs --tail=5 "$service" 2>/dev/null || echo "Service not running"
        echo ""
    done
}

# Main execution
main() {
    echo "Starting at $(date)"
    echo ""
    
    # Check environment
    check_environment
    
    # Check Docker services
    check_docker_services
    
    # Wait a moment for services to stabilize
    echo "Waiting 5 seconds for services to stabilize..."
    sleep 5
    echo ""
    
    # Run tests
    local total_failed=0
    
    test_infrastructure_services || total_failed=$((total_failed + $?))
    test_application_services || total_failed=$((total_failed + $?))
    test_api_endpoints || total_failed=$((total_failed + $?))
    test_web_frontend || total_failed=$((total_failed + $?))
    
    # Show URLs
    show_service_urls
    
    # Final result
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo "==============="
    
    if [ $total_failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! VLEI ecosystem is healthy.${NC}"
        echo ""
        echo "🌐 Access the application at: $WEB_URL"
    else
        echo -e "${RED}❌ $total_failed test(s) failed. Check service logs for details.${NC}"
        echo ""
        echo "💡 Troubleshooting tips:"
        echo "1. Check all services are running: docker-compose ps"
        echo "2. Check logs: docker-compose logs [service-name]"
        echo "3. Restart services: docker-compose restart"
        echo "4. Check infrastructure: cd vlei-environment/infrastructure-setup && docker-compose ps"
        echo ""
        
        # Show recent logs if there are failures
        show_logs
        
        exit 1
    fi
}

# Handle command line arguments
case "${1:-test}" in
    "test")
        main
        ;;
    "logs")
        show_logs
        ;;
    "urls")
        show_service_urls
        ;;
    "quick")
        check_docker_services
        test_application_services
        show_service_urls
        ;;
    *)
        echo "Usage: $0 [test|logs|urls|quick]"
        echo ""
        echo "Commands:"
        echo "  test  - Run full test suite (default)"
        echo "  logs  - Show recent service logs"
        echo "  urls  - Show service URLs"
        echo "  quick - Run quick health checks only"
        ;;
esac