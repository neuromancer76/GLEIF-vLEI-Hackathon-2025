# Italian Company Query DSL Documentation

## Overview

This repository implements a Domain-Specific Language (DSL) for querying Italian company data. The DSL supports filtering, sorting, limiting, and aggregating company information.

## Data Model

Each Italian company has the following properties:

- `vlei`: Company VLEI identifier
- `name`: Company name
- `address`: Street address
- `city`: City
- `region`: Italian region
- `ateco`: ATECO code (Italian economic activity classification)
- `activity_description`: Description of business activity
- `risk`: Risk level (supports both Italian and English values)
  - Italian: `Basso`, `Medio`, `Alto`
  - English: `Low`, `Medium`, `High`
  - Both formats are automatically normalized to English (Low, Medium, High)
- `credit_limit`: Credit limit in euros
- `number_of_employees` (or `employees`): Number of employees

## DSL Syntax

```ebnf
Query ::= [SELECT] [WHERE] [AGGREGATE] [SORT] [LIMIT]

SELECT ::= "SELECT" FieldList
WHERE ::= "WHERE" Expression  
AGGREGATE ::= "AGGREGATE" AggregationList
SORT ::= "SORT" SortList
LIMIT ::= "LIMIT" (Size | Offset "," Size)

FieldList ::= Field ("," Field)*
Expression ::= Term | Expression LogicalOperator Expression | "(" Expression ")"
Term ::= FieldOperation | "NOT" FieldOperation
FieldOperation ::= FieldName "." Method "(" ParameterList ")"
```

## Supported Methods

### Comparison Methods

- `equals(value)`: Exact match
- `notEquals(value)`: Not equal to
- `greaterThan(value)`: Greater than
- `lessThan(value)`: Less than

### String Methods

- `contains(substring)`: Contains substring (case-insensitive)
- `startsWith(prefix)`: Starts with prefix
- `endsWith(suffix)`: Ends with suffix

### Collection Methods

- `in(value1, value2, ...)`: Value is in list

## Example Queries

### Basic Filtering

```dsl
WHERE employees.greaterThan(100)
```

### Multiple Conditions with AND

```dsl
WHERE employees.greaterThan(100) AND
      credit_limit.greaterThan(100000) AND
      risk.equals(High)
```

### Filtering with OR

```dsl
WHERE region.equals(Lombardia) OR region.equals(Piemonte)
```

### String Operations

```dsl
WHERE name.contains(Tech) AND
      city.startsWith(Milan)
```

### Sorting Results

```dsl
WHERE employees.greaterThan(50)
SORT credit_limit DESC
```

```dsl
WHERE risk.equals(High)
SORT region ASC, employees DESC
```

### Limiting Results

```dsl
WHERE credit_limit.greaterThan(500000)
LIMIT 10
```

```dsl
WHERE employees.greaterThan(100)
LIMIT 20, 10  -- Skip 20, take 10 (pagination)
```

### Complex Query with Aggregations

```dsl
WHERE employees.greaterThan(100) AND
      credit_limit.greaterThan(100000)
AGGREGATE range(credit_limit, [
    {from: 100000, to: 500000},
    {from: 500000, to: 1000000}, 
    {from: 1000000}
]) {
    term(region, 5) {
        stats(employees),
        percentiles(credit_limit, [50, 75, 90])
    }
}
SORT credit_limit DESC
LIMIT 100
```

## Aggregation Functions

### Range Aggregation

Groups data into numerical ranges:

```dsl
AGGREGATE range(credit_limit, [
    {from: 0, to: 100000},
    {from: 100000, to: 500000},
    {from: 500000}
])
```

### Term Aggregation

Groups by field value, showing top N terms:

```dsl
term(region, 5)  -- Top 5 regions
```

### Stats Aggregation

Calculates statistics (count, min, max, avg, sum):

```dsl
stats(employees)
```

### Percentiles Aggregation

Calculates percentile values:

```dsl
percentiles(credit_limit, [50, 75, 90, 95])
```

## API Usage

### Using the Repository Directly

```csharp
var repository = serviceProvider.GetRequiredService<IItalianCompanyRepository>();

// Search with DSL
var result = await repository.SearchAsync(@"
    WHERE employees.greaterThan(100) AND
          credit_limit.greaterThan(500000)
    SORT credit_limit DESC
    LIMIT 20
");

Console.WriteLine($"Found {result.TotalCount} companies");
Console.WriteLine($"Returned {result.Data.Count} results");

foreach (var company in result.Data)
{
    Console.WriteLine($"{company.Name} - {company.Credit_Limit:C}");
}

// Access aggregations
if (result.Aggregations.ContainsKey("count"))
{
    Console.WriteLine($"Total matching: {result.Aggregations["count"]}");
}
```

### Using the REST API

```bash
# Search companies
curl -X POST "http://localhost:5000/api/ItalianCompanies/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "WHERE employees.greaterThan(100) AND risk.equals(High) LIMIT 10"
  }'
```

```bash
# Get all companies
curl -X GET "http://localhost:5000/api/ItalianCompanies"
```

```bash
# Get company by VLEI
curl -X GET "http://localhost:5000/api/ItalianCompanies/VLEI-100000"
```

## Query Result Structure

The search method returns a `QueryResult<ItalianCompany>` object:

```json
{
  "data": [
    {
      "vlei": "VLEI-100001",
      "name": "Company_2",
      "address": "26 Via Melfetta Centrale",
      "city": "Melfetta",
      "region": "Basilicata",
      "ateco": "28.25",
      "activity_description": "Manufacture of industrial cooling and ventilation equipment",
      "risk": "High",
      "credit_limit": 474496.54,
      "number_of_employees": 273
    }
  ],
  "aggregations": {
    "count": 150,
    "range_aggregation": {
      "buckets": [
        {
          "range": "100000 - 500000",
          "count": 80,
          "terms": [...]
        }
      ]
    }
  },
  "totalCount": 150
}
```

## Sample Queries for Common Use Cases

### High-Risk Companies with Large Credit Limits

```dsl
WHERE risk.equals(High) AND
      credit_limit.greaterThan(500000)
SORT credit_limit DESC
LIMIT 20
```

You can also use Italian risk values:

```dsl
WHERE risk.equals(Alto) AND
      credit_limit.greaterThan(500000)
SORT credit_limit DESC
LIMIT 20
```

Both queries above produce identical results as risk values are normalized internally.

### Companies by Region

```dsl
WHERE region.in(Lombardia, Piemonte, Veneto)
SORT name ASC
```

### Large Employers

```dsl
WHERE employees.greaterThan(200)
SORT employees DESC
LIMIT 50
```

### Manufacturing Companies

```dsl
WHERE activity_description.contains(Manufacture)
SORT credit_limit DESC
```

### Regional Analysis with Aggregations

```dsl
WHERE employees.greaterThan(50)
AGGREGATE range(credit_limit, [
    {from: 0, to: 250000},
    {from: 250000, to: 500000},
    {from: 500000}
]) {
    term(region, 10) {
        stats(employees),
        percentiles(credit_limit, [25, 50, 75])
    }
}
```

## Error Handling

- Invalid field names will be ignored
- Type mismatches (e.g., comparing string to number) will return false
- Malformed queries will throw exceptions with descriptive messages
- Ensure data is loaded before querying (repository automatically checks)

## Configuration

Configure the data file path in `appsettings.json`:

```json
{
  "ItalianCompaniesDataPath": "path/to/italian_companies.json"
}
```

If not specified, defaults to `italian_companies.json` in the application directory.
