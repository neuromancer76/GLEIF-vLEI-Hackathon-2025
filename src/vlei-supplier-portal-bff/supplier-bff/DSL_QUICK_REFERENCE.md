# Quick Reference - Italian Company DSL

## Basic Query Structure
```
[WHERE conditions] [AGGREGATE functions] [SORT fields] [LIMIT count]
```

## Common Patterns

### 1. Simple Filter
```dsl
WHERE risk.equals(High)
```

### 2. Multiple Conditions
```dsl
WHERE employees.greaterThan(100) AND credit_limit.greaterThan(500000)
```

### 3. String Search
```dsl
WHERE name.contains(Tech) OR activity_description.contains(Software)
```

### 4. Sorted Results
```dsl
WHERE region.equals(Lombardia)
SORT credit_limit DESC, name ASC
LIMIT 20
```

### 5. Pagination
```dsl
WHERE risk.equals(Medium)
SORT credit_limit DESC
LIMIT 20, 10  -- Skip 20, take 10
```

### 6. Regional Analysis
```dsl
WHERE employees.greaterThan(50)
AGGREGATE range(credit_limit, [
    {from: 0, to: 500000},
    {from: 500000}
]) {
    term(region, 5) {
        stats(employees)
    }
}
```

## Field Operations Cheat Sheet

| Operation | Example | Description |
|-----------|---------|-------------|
| `equals()` | `risk.equals(High)` | Exact match |
| `notEquals()` | `risk.notEquals(Low)` | Not equal |
| `greaterThan()` | `employees.greaterThan(100)` | Greater than |
| `lessThan()` | `credit_limit.lessThan(100000)` | Less than |
| `contains()` | `name.contains(Tech)` | String contains |
| `startsWith()` | `city.startsWith(Milan)` | String prefix |
| `endsWith()` | `name.endsWith(Ltd)` | String suffix |
| `in()` | `region.in(Lombardia, Lazio)` | Value in list |

## Available Fields

| Field Name | Alternative Names | Type | Example Value |
|------------|-------------------|------|---------------|
| `vlei` | - | string | "VLEI-100000" |
| `name` | - | string | "TechCorp Milano" |
| `address` | - | string | "Via Roma 123" |
| `city` | - | string | "Milano" |
| `region` | - | string | "Lombardia" |
| `ateco` | - | string | "28.25" |
| `activity_description` | `activitydescription` | string | "Manufacture..." |
| `risk` | - | string | "High", "Medium", "Low" |
| `credit_limit` | `creditlimit` | decimal | 500000.00 |
| `employees` | `number_of_employees`, `numberofemployees` | int | 150 |

## Aggregation Functions

| Function | Syntax | Returns |
|----------|--------|---------|
| `range()` | `range(field, [{from: X, to: Y}])` | Buckets by numeric range |
| `term()` | `term(field, size)` | Top N values by frequency |
| `stats()` | `stats(field)` | min, max, avg, sum, count |
| `percentiles()` | `percentiles(field, [50, 75, 90])` | Percentile values |

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ItalianCompanies` | Get all companies |
| GET | `/api/ItalianCompanies/{vlei}` | Get by VLEI |
| POST | `/api/ItalianCompanies/search` | Execute DSL query |

### Search Request Body
```json
{
  "query": "WHERE employees.greaterThan(100) LIMIT 10"
}
```

### Response Format
```json
{
  "data": [...],           // Filtered results
  "aggregations": {...},   // Aggregation results
  "totalCount": 150        // Total before LIMIT
}
```

## Common Use Cases

### Find High-Risk Large Companies
```dsl
WHERE risk.equals(High) AND employees.greaterThan(200)
SORT credit_limit DESC
LIMIT 50
```

### Regional Distribution Analysis
```dsl
AGGREGATE range(employees, [
    {from: 0, to: 50},
    {from: 50, to: 100},
    {from: 100, to: 500},
    {from: 500}
]) {
    term(region, 10)
}
```

### Manufacturing Companies in North Italy
```dsl
WHERE activity_description.contains(Manufacture) AND
      region.in(Lombardia, Piemonte, Veneto)
SORT employees DESC
```

### Credit Limit Analysis by Risk Level
```dsl
AGGREGATE range(credit_limit, [
    {from: 0, to: 250000},
    {from: 250000, to: 500000},
    {from: 500000, to: 1000000},
    {from: 1000000}
]) {
    term(risk, 3) {
        stats(credit_limit),
        percentiles(credit_limit, [25, 50, 75, 90])
    }
}
```

## Tips & Tricks

1. **Case Insensitive**: All string comparisons are case-insensitive
2. **Field Aliases**: Use `employees` instead of `number_of_employees`
3. **Combine Filters**: Use AND/OR for complex conditions
4. **Check Total**: Use `totalCount` to know results before LIMIT
5. **Nested Aggregations**: Combine term, stats, and percentiles for deep insights
