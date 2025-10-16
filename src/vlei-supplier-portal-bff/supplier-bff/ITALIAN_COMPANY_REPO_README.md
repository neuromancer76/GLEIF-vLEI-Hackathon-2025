# Italian Company Repository - Getting Started

## What Was Created

A complete solution for querying Italian company data using a custom Domain-Specific Language (DSL). This includes:

✅ **Data Model** - `ItalianCompany` class matching your JSON structure  
✅ **DSL Parser** - Full query language parser supporting WHERE, AGGREGATE, SORT, LIMIT  
✅ **Repository** - In-memory repository with data loading and search capabilities  
✅ **REST API** - Controller with endpoints for searching and retrieving companies  
✅ **Documentation** - Comprehensive guides and examples  

## Quick Start

### 1. Run the Application

```bash
cd supplier-bff
dotnet run
```

The application will:
- Load `italian_companies.json` (100 companies)
- Start the web server at `http://localhost:5178`
- Display "Successfully loaded 100 Italian companies" in the console

### 2. Test with Swagger

Open your browser to: `http://localhost:5178`

You'll see the Swagger UI with three endpoints:
- `GET /api/ItalianCompanies` - Get all companies
- `GET /api/ItalianCompanies/{vlei}` - Get by VLEI
- `POST /api/ItalianCompanies/search` - Execute DSL query

### 3. Try Your Example Query

In Swagger, use the `POST /api/ItalianCompanies/search` endpoint with this body:

```json
{
  "query": "WHERE employees.greaterThan(100) AND credit_limit.greaterThan(100000) AGGREGATE range(credit_limit, [{from: 100000, to: 500000}, {from: 500000, to: 1000000}, {from: 1000000}]) { term(region, 5) { stats(employees), percentiles(credit_limit, [50, 75, 90]) } }"
}
```

### 4. Use the HTTP File

Open `italian-companies.http` in VS Code and click "Send Request" on any example.

## Example Queries

### Simple Search - High Risk Companies
```json
{
  "query": "WHERE risk.equals(High) LIMIT 10"
}
```

### Complex Search with Sorting
```json
{
  "query": "WHERE employees.greaterThan(100) AND credit_limit.greaterThan(500000) SORT credit_limit DESC LIMIT 20"
}
```

### Regional Analysis
```json
{
  "query": "WHERE employees.greaterThan(50) AGGREGATE range(credit_limit, [{from: 0, to: 250000}, {from: 250000, to: 500000}, {from: 500000}]) { term(region, 10) { stats(employees), percentiles(credit_limit, [25, 50, 75]) } }"
}
```

## Using the Repository in Your Code

### Inject the Repository

```csharp
public class YourService
{
    private readonly IItalianCompanyRepository _repository;
    
    public YourService(IItalianCompanyRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<QueryResult<ItalianCompany>> FindCompanies()
    {
        return await _repository.SearchAsync(@"
            WHERE risk.equals(High) AND
                  employees.greaterThan(100)
            SORT credit_limit DESC
            LIMIT 50
        ");
    }
}
```

### Access Results

```csharp
var result = await _repository.SearchAsync(query);

// Filtered data
foreach (var company in result.Data)
{
    Console.WriteLine($"{company.Name} - {company.Credit_Limit:C}");
}

// Aggregations
if (result.Aggregations.ContainsKey("count"))
{
    Console.WriteLine($"Total matching: {result.Aggregations["count"]}");
}

// Total count (before LIMIT)
Console.WriteLine($"Total results: {result.TotalCount}");
Console.WriteLine($"Returned: {result.Data.Count}");
```

## Documentation Files

📄 **IMPLEMENTATION_SUMMARY.md** - Complete technical overview  
📄 **DSL_QUERY_GUIDE.md** - Full DSL syntax and examples  
📄 **DSL_QUICK_REFERENCE.md** - Quick reference card  
📄 **italian-companies.http** - HTTP request examples  

## DSL Capabilities at a Glance

### Field Operations
- `equals()`, `notEquals()`, `greaterThan()`, `lessThan()`
- `contains()`, `startsWith()`, `endsWith()`
- `in()` for multiple values

### Aggregations
- `range()` - Bucket by numeric ranges
- `term()` - Group by field values
- `stats()` - Calculate min, max, avg, sum
- `percentiles()` - Calculate percentile values

### Query Clauses
- `WHERE` - Filter data
- `AGGREGATE` - Compute aggregations (with nesting support)
- `SORT` - Order results
- `LIMIT` - Pagination support

## Available Fields

- `vlei`, `name`, `address`, `city`, `region`
- `ateco`, `activity_description`, `risk`
- `credit_limit`, `employees` (or `number_of_employees`)

## Next Steps

1. ✅ Application is running and data is loaded
2. Try the example queries in Swagger or the `.http` file
3. Read `DSL_QUERY_GUIDE.md` for comprehensive documentation
4. Use `DSL_QUICK_REFERENCE.md` for quick syntax lookup
5. Integrate the repository into your services

## Configuration

### Custom Data File Path

Add to `appsettings.json`:
```json
{
  "ItalianCompaniesDataPath": "path/to/your/italian_companies.json"
}
```

### Copy to Output

The `.csproj` file is already configured to copy `italian_companies.json` to the output directory automatically.

## Troubleshooting

**Data file not found?**
- Check that `italian_companies.json` exists in the project root
- Rebuild the project: `dotnet build`
- The file will be copied to `bin/Debug/net9.0/`

**Invalid query?**
- Check syntax in `DSL_QUERY_GUIDE.md`
- Use exact field names (case-insensitive)
- Ensure proper parentheses and quotes

**No results?**
- Verify the data was loaded (check console output)
- Try a broader query first: `WHERE risk.equals(High)`
- Check field values match your JSON data

## Support

See the documentation files for detailed information:
- Syntax errors? → `DSL_QUERY_GUIDE.md`
- Quick lookup? → `DSL_QUICK_REFERENCE.md`
- Implementation details? → `IMPLEMENTATION_SUMMARY.md`

---

**Status**: ✅ All components created and tested  
**Data Loaded**: 100 Italian companies  
**Endpoints**: 3 REST API endpoints available  
**Documentation**: Complete guides and examples ready
