# Supplier BFF (Backend for Frontend) API

## Overview

This is a .NET Core Web API project that manages supplier requests and procurement processes. The API provides endpoints for creating supplier requests, sending invitations, managing applications, and retrieving order information.

## Project Structure

```
supplier-bff/
├── Controllers/           # API Controllers
├── DTOs/                 # Data Transfer Objects
├── Middleware/           # Custom middleware components
├── Models/              # Domain models
├── Repositories/        # Data access layer
├── Services/           # Business logic layer
└── Program.cs          # Application startup
```

## Models

### CompanyRequester
- **Prefix**: Company identifier prefix
- **Lei**: Legal Entity Identifier
- **Oobi**: Out-of-band identifier

### OrderDetails
- **OrderId**: Unique identifier for the order
- **Description**: Order description
- **TotalAmount**: Total amount for the order
- **Requester**: Company requesting the order
- **Candidates**: List of potential suppliers
- **CreatedAt**: Order creation timestamp

### SupplierCandidate
- **Lei**: Legal Entity Identifier
- **SupplierEmail**: Supplier email address
- **Applied**: Whether the supplier has applied

## API Endpoints

### POST /api/supplier/create-request
Creates a new supplier request with order details, requester information, and candidate suppliers.

**Request Body:**
```json
{
  "orderDetails": {
    "orderId": "ORDER-001",
    "description": "Software Development Services",
    "totalAmount": "50000.00"
  },
  "requester": {
    "prefix": "TECHCORP",
    "lei": "5493003FVWLMBFTISI11",
    "oobi": "http://techcorp.com/oobi"
  },
  "candidates": [
    {
      "lei": "LEI123456789012345678",
      "supplierEmail": "contact@suppliera.com",
      "applied": false
    }
  ]
}
```

### POST /api/supplier/send-invitation
Sends an invitation email to a supplier with a link to apply to the request.

**Headers:**
- `OrderId`: The order ID for the invitation

**Request Body:**
```json
{
  "body": "Dear Supplier, we would like to invite you to participate...",
  "supplierEmail": "contact@suppliera.com"
}
```

### POST /api/supplier/apply
Allows a supplier to apply to a request. Only one supplier can be selected per order.

**Query Parameters:**
- `orderId`: The order ID
- `supplierEmail`: The supplier's email address

### GET /api/supplier/order/{orderId}
Retrieves detailed information about a specific order.

### GET /api/supplier/orders?companyPrefix={prefix}
Retrieves all orders for a specific company prefix.

### GET /api/supplier/debug/signify-headers
Debug endpoint that returns information about the signify authentication headers received in the request. Useful for testing and verifying signify header parsing.

### GET /api/supplier/secure-data
Secure endpoint that demonstrates signify authentication requirements. Returns sensitive data only when valid signify headers are present and validated.

### GET /api/supplier/company-data/{lei}
Retrieves company data from the GLEIF API using a Legal Entity Identifier (LEI). Returns the company's legal name, primary address, and other relevant information.

**Path Parameters:**
- `lei`: The 20-character Legal Entity Identifier

**Response includes:**
- Legal name and language
- Primary address (formatted and structured)
- Company status and jurisdiction
- Creation date
- Alternative names

## Features

### Header Middleware
The application includes middleware that extracts HTTP headers and makes them available throughout the request pipeline via the `RequestContextService`. The middleware specifically handles **Signify authentication headers** for cryptographic request verification.

#### Signify Headers Support
The application recognizes and processes the following signify authentication headers:

- **`signature`**: Contains the cryptographic signature
- **`signature-input`**: Contains signature metadata including algorithm, key ID, and creation timestamp
- **`signify-resource`**: The signify resource identifier
- **`signify-timestamp`**: ISO timestamp when the signature was created

Example signify headers:
```
signature: indexed="?0";signify="0BB3IrmO_gRvi7WvPgPRs2hdmw3Jk4h7joFRSomHahXZIzI524g4SI8P-p9TCO1KhyHa5JFt-JPB5HB2mNq0ru4D"
signature-input: signify=("@method" "@path" "signify-resource" "signify-timestamp");created=1759338969;keyid="DAUpefduMnqhpOaPHzzVJDDSkJ8-k5id9iEKIw1v2XVz";alg="ed25519"
signify-resource: EKs4NyFyOX_bjy3ZE0NK_GTNxidpulele-dSy4pyFbyi
signify-timestamp: 2025-10-01T17:16:09.525000+00:00
```

#### Signify Validation
The application includes a **mock validation service** that simulates cryptographic verification of signify headers:

- **Automatic validation**: Headers are automatically validated by the middleware
- **Mock implementation**: Always returns `true` for demonstration purposes
- **Validation components**: Validates signature, key ID, timestamp, and resource
- **Access control**: Secure endpoints can require valid signify authentication

**Validation Results**: Available through `RequestContextService.GetSignifyValidationResult()`

### In-Memory Database
The application uses an in-memory repository pattern with thread-safe `ConcurrentDictionary` for storing order data.

### Email Service
Includes a mock email service that simulates sending invitations with application links.

### Logging
Comprehensive logging throughout all layers of the application.

## Business Logic

1. **CreateSupplierRequest**: Creates a new order entry. Returns error if orderId is duplicated.
2. **SendSupplierInvitation**: Sends email with custom body and includes an application link.
3. **ApplyToRequest**: Sets a supplier as applied only if no other supplier has applied yet.
4. **GetOrderDetails**: Returns order details with supplier information.
5. **GetOrderList**: Returns all orders for a specific company prefix.

## Running the Application

1. Navigate to the project directory:
   ```bash
   cd supplier-bff
   ```

2. Build the project:
   ```bash
   dotnet build
   ```

3. Run the application:
   ```bash
   dotnet run
   ```

4. The API will be available at `https://localhost:7010` (or the port specified in launchSettings.json)

5. OpenAPI/Swagger documentation will be available at `https://localhost:7010/openapi/v1.json` in development mode.

## Testing

Use the provided `supplier-bff.http` file with tools like REST Client in VS Code to test the API endpoints.

## Agent-Driven Search with DSL Integration

### Domain Specific Language (DSL) for Agent Interrogation

The Supplier BFF provides a **Domain Specific Language (DSL)** that enables AI agents to perform complex, natural language-driven queries against the supplier database. This DSL bridges the gap between human intent expressed in natural language and structured data queries, making the search process fully **"agentizable"**.

#### DSL Architecture

The DSL system transforms natural language queries into structured database operations through multiple layers:

```
Natural Language → DSL Query → Database Operation → Structured Response
```

**Example Agent Interactions:**

1. **Simple Company Search:**
```
Agent Input: "Find Italian suppliers in Milan with more than 100 employees"
DSL Query: WHERE region.equals("Lombardia") AND city.equals("Milano") AND number_of_employees.greaterThan(100)
Result: Filtered list of Milan-based suppliers matching criteria
```

2. **Risk-Based Filtering:**
```
Agent Input: "Show low-risk suppliers with credit limit above €500,000"
DSL Query: WHERE risk.equals("Low") AND credit_limit.greaterThan(500000) SORT credit_limit DESC
Result: High-creditworthy, low-risk suppliers ranked by credit capacity
```

3. **Industry-Specific Search:**
```
Agent Input: "Find automotive suppliers in Northern Italy"
DSL Query: WHERE activity_description.contains("automotive") AND region.in(["Lombardia","Piemonte","Veneto"])
Result: Regional automotive industry suppliers
```

#### DSL Grammar and Operations

**Supported Operations:**
- **Comparison**: `equals`, `greaterThan`, `lessThan`, `contains`, `startsWith`, `endsWith`
- **Logical**: `AND`, `OR`, `NOT` for complex filtering
- **Aggregation**: `COUNT()`, `SUM()`, `AVG()` grouped by fields
- **Sorting**: `SORT field_name ASC|DESC` with multiple sort keys
- **Limiting**: `LIMIT n` for result set management

**Data Fields Available for DSL Queries:**
```javascript
// Company Fields
name                    // Company legal name
region                  // Geographic region (Italian regions)
city                    // City location
activity_description    // Business activity description
ateco                   // Italian economic activity code
number_of_employees     // Employee count
credit_limit           // Credit limit in euros
risk                   // Risk level (Low/Medium/High or Basso/Medio/Alto)
vlei                   // Verifiable Legal Entity Identifier
```

**Advanced DSL Examples:**
```sql
-- Geographic and size-based filtering
WHERE region.equals("Lombardia") AND number_of_employees.between(50, 500)

-- Industry clustering with aggregation
SELECT ateco, COUNT() WHERE region.equals("Piemonte") GROUP BY ateco

-- Multi-criteria risk assessment
WHERE risk.in(["Low", "Medium"]) AND credit_limit.greaterThan(100000) 
ORDER BY credit_limit DESC, number_of_employees ASC LIMIT 20
```

#### Agent Integration Points

**Chatbot Integration:**
The AI chatbot uses the DSL through the `SupplierPortalTool` which translates natural language requests into DSL queries:

```csharp
[KernelFunction("supplier-search-italian-companies")]
[Description("Search Italian companies using DSL query for complex filtering...")]
public async Task<string> SearchItalianCompaniesAsync(string query)
{
    // Agent provides DSL query based on user natural language
    var results = await _supplierService.ExecuteDslQuery(query);
    return FormatResultsForAgent(results);
}
```

**Natural Language Processing:**
- Agents parse user intent from conversational context
- Geographic terms are mapped to Italian regions automatically
- Risk terminology supports both English and Italian variants
- Industry keywords are mapped to ATECO classification codes

#### Agent Response Formatting

The DSL system returns agent-friendly structured data that can be formatted into rich HTML responses:

```json
{
  "query": "WHERE region.equals('Lombardia') AND risk.equals('Low')",
  "totalResults": 15,
  "companies": [
    {
      "name": "Innovtech Solutions SRL",
      "city": "Milano",
      "employees": 250,
      "creditLimit": 750000,
      "risk": "Low",
      "ateco": "62.01",
      "activityDescription": "Software development and consulting"
    }
  ],
  "aggregations": {
    "avgEmployees": 180,
    "totalCreditLimit": 8500000,
    "riskDistribution": { "Low": 15, "Medium": 0, "High": 0 }
  }
}
```

This enables agents to provide comprehensive business intelligence responses including comparisons, rankings, and strategic recommendations based on the filtered data.

## Mock Database Documentation

### Overview

The Supplier BFF utilizes a **mocked database implementation** designed specifically for **demonstration and development purposes**. This approach allows for rapid prototyping, testing, and showcase scenarios without the complexity of production database infrastructure.

### Database Architecture

#### In-Memory Storage Pattern
```csharp
// Thread-safe concurrent storage for high-performance access
private static readonly ConcurrentDictionary<string, OrderDetails> _orders = new();
private static readonly ConcurrentDictionary<string, CompanyData> _companyCache = new();
private static readonly List<ItalianCompanyData> _italianCompanies = new();
```

#### Mock Data Categories

**1. Order Management Data**
- **Order Repository**: Complete order lifecycle with supplier applications
- **Company Requesters**: Mock company profiles with LEI identifiers  
- **Supplier Candidates**: Potential suppliers with contact information
- **Application Status**: Tracking of supplier application states

**2. Italian Company Dataset**
The system includes a comprehensive **mock Italian company dataset** with realistic business profiles:

```json
{
  "name": "Innovtech Solutions SRL",
  "region": "Lombardia",
  "city": "Milano",
  "number_of_employees": 250,
  "credit_limit": 750000,
  "risk": "Low",
  "ateco": "62.01",
  "activity_description": "Software development and consulting services",
  "vlei": "549300FAKEVLEI123456"
}
```

**Geographic Distribution:**
- **Northern Italy**: Lombardia, Piemonte, Veneto, Liguria
- **Central Italy**: Toscana, Lazio, Emilia-Romagna
- **Southern Italy**: Campania, Sicilia, Puglia

**Industry Coverage:**
- Technology and software development (ATECO 62.x)
- Manufacturing and automotive (ATECO 25.x, 29.x)
- Financial services (ATECO 64.x)
- Construction and engineering (ATECO 41.x, 42.x)
- Professional services (ATECO 69.x, 70.x)

**Risk Profiles:**
- **Low Risk (Basso)**: 40% of companies - high credit limits, stable operations
- **Medium Risk (Medio)**: 45% of companies - moderate credit, standard operations  
- **High Risk (Alto)**: 15% of companies - limited credit, higher oversight required

#### Mock Data Features

**1. Realistic Business Logic**
```csharp
// Risk-based credit limit correlation
var creditLimit = risk switch {
    "Low" => Random.Next(500000, 2000000),    // €500K - €2M
    "Medium" => Random.Next(100000, 750000),   // €100K - €750K  
    "High" => Random.Next(25000, 200000)       // €25K - €200K
};
```

**2. Geographic Consistency**
- Companies are realistically distributed across Italian regions
- City-region mappings follow actual Italian geography
- Regional economic specializations reflected in industry distribution

**3. Temporal Data Simulation**
```csharp
// Realistic order creation timestamps
CreatedAt = DateTime.UtcNow.AddDays(-Random.Next(0, 90));

// Company establishment dates
EstablishedDate = DateTime.UtcNow.AddYears(-Random.Next(5, 25));
```

### Mock Database Benefits

**Development Advantages:**
- ✅ **Rapid Prototyping**: Immediate data availability without setup
- ✅ **Consistent Testing**: Repeatable test scenarios with known data
- ✅ **Performance**: In-memory operations for fast response times
- ✅ **Isolation**: No external dependencies or connection requirements
- ✅ **Flexibility**: Easy data manipulation for different test cases

**Demonstration Benefits:**
- ✅ **Realistic Scenarios**: Business-relevant data for meaningful demos
- ✅ **Italian Market Focus**: Authentic regional and industry data
- ✅ **Risk Modeling**: Comprehensive risk assessment scenarios
- ✅ **Scale Simulation**: Sufficient data volume for performance testing
- ✅ **Agent Training**: Rich dataset for DSL query development

### Production Migration Path

**Database Transition Strategy:**
When moving from mock to production database, the following components require adaptation:

```csharp
// Current: In-memory mock repository
public class InMemorySupplierRepository : ISupplierRepository

// Future: Production database repository  
public class SqlServerSupplierRepository : ISupplierRepository
public class CosmosDbSupplierRepository : ISupplierRepository
```

**Data Migration Considerations:**
1. **Schema Mapping**: Mock data structure → Production database schema
2. **Data Volume**: Scale from mock hundreds to production thousands/millions
3. **Performance**: Query optimization for production workloads
4. **Integration**: Real-time data feeds from GLEIF and company registries
5. **Compliance**: GDPR and data protection requirements

**Mock Data Disclaimer:**
> ⚠️ **Important**: All company data in this system is **entirely fictional** and created for demonstration purposes only. No real company information, LEIs, or business relationships are represented. The data is designed to showcase the capabilities of the VLEI ecosystem and agent-driven search functionality.

## Dependencies

- .NET 9.0
- ASP.NET Core Web API
- Microsoft.Extensions.Logging
- Built-in dependency injection

## Architecture

The application follows a clean architecture pattern with:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic and DSL query processing
- **Repositories**: Handle data persistence (in-memory mock implementation)
- **Middleware**: Cross-cutting concerns (header processing)
- **DTOs**: Data transfer between layers
- **Models**: Domain entities and mock data structures
- **DSL Engine**: Natural language to query translation layer