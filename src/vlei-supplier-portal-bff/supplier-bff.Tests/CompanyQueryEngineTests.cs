using supplier_bff.Models;
using supplier_bff.Services;

namespace supplier_bff.Tests;

/// <summary>
/// Comprehensive test suite for CompanyQueryEngine covering all DSL grammar features
/// </summary>
public class CompanyQueryEngineTests
{
    private List<ItalianCompany> GetTestData()
    {
        return new List<ItalianCompany>
        {
            new ItalianCompany
            {
                Vlei = "VLEI-001",
                Name = "TechCorp Milano",
                Address = "Via Roma 123",
                City = "Milano",
                Region = "Lombardia",
                Ateco = "62.01",
                Activity_Description = "Software development and consulting",
                Risk = "Low",
                Credit_Limit = 750000m,
                Number_Of_Employees = 200
            },
            new ItalianCompany
            {
                Vlei = "VLEI-002",
                Name = "ManufactureX Torino",
                Address = "Corso Italia 45",
                City = "Torino",
                Region = "Piemonte",
                Ateco = "28.25",
                Activity_Description = "Manufacture of industrial cooling equipment",
                Risk = "High",
                Credit_Limit = 500000m,
                Number_Of_Employees = 150
            },
            new ItalianCompany
            {
                Vlei = "VLEI-003",
                Name = "BuildCo Roma",
                Address = "Via Nazionale 78",
                City = "Roma",
                Region = "Lazio",
                Ateco = "28.41",
                Activity_Description = "Manufacture of machine tools for metalworking",
                Risk = "Medium",
                Credit_Limit = 250000m,
                Number_Of_Employees = 80
            },
            new ItalianCompany
            {
                Vlei = "VLEI-004",
                Name = "DataSystems Milano",
                Address = "Piazza Duomo 1",
                City = "Milano",
                Region = "Lombardia",
                Ateco = "62.01",
                Activity_Description = "Software development",
                Risk = "Low",
                Credit_Limit = 600000m,
                Number_Of_Employees = 120
            },
            new ItalianCompany
            {
                Vlei = "VLEI-005",
                Name = "SmallTech Napoli",
                Address = "Via Toledo 99",
                City = "Napoli",
                Region = "Campania",
                Ateco = "62.02",
                Activity_Description = "Software consulting",
                Risk = "High",
                Credit_Limit = 90000m,
                Number_Of_Employees = 45
            },
            new ItalianCompany
            {
                Vlei = "VLEI-006",
                Name = "MegaCorp Venezia",
                Address = "Canal Grande 200",
                City = "Venezia",
                Region = "Veneto",
                Ateco = "28.25",
                Activity_Description = "Manufacture of ventilation equipment",
                Risk = "Medium",
                Credit_Limit = 1000000m,
                Number_Of_Employees = 500
            }
        };
    }

    /// <summary>
    /// Extended test data with additional companies for complex query testing
    /// </summary>
    private List<ItalianCompany> GetExtendedTestData()
    {
        var data = GetTestData();
        data.AddRange(new List<ItalianCompany>
        {
            new ItalianCompany
            {
                Vlei = "VLEI-007",
                Name = "Copper Works Milano",
                Address = "Via Copper 10",
                City = "Milano",
                Region = "Lombardia",
                Ateco = "24.44",
                Activity_Description = "Copper production and metalworking",
                Risk = "Medium",
                Credit_Limit = 850000m,
                Number_Of_Employees = 180
            },
            new ItalianCompany
            {
                Vlei = "VLEI-008",
                Name = "Metal Industries Bergamo",
                Address = "Via Metallo 25",
                City = "Bergamo",
                Region = "Lombardia",
                Ateco = "24.10",
                Activity_Description = "Metal processing and fabrication",
                Risk = "Low",
                Credit_Limit = 920000m,
                Number_Of_Employees = 250
            },
            new ItalianCompany
            {
                Vlei = "VLEI-009",
                Name = "Mining Corp Brescia",
                Address = "Via Miniera 5",
                City = "Brescia",
                Region = "Lombardia",
                Ateco = "07.10",
                Activity_Description = "Mining and extraction of metallic minerals",
                Risk = "High",
                Credit_Limit = 780000m,
                Number_Of_Employees = 320
            },
            new ItalianCompany
            {
                Vlei = "VLEI-010",
                Name = "Copper Mining Roma",
                Address = "Via Rame 100",
                City = "Roma",
                Region = "Lazio",
                Ateco = "07.29",
                Activity_Description = "Copper mining operations",
                Risk = "Medium",
                Credit_Limit = 650000m,
                Number_Of_Employees = 150
            }
        });
        return data;
    }

    #region WHERE Clause Tests - Field Operations

    [Fact]
    public void Execute_WhereEquals_ReturnsMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE risk.equals(High)");

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.All(result.Data, c => Assert.Equal("High", c.Risk));
    }

    [Fact]
    public void Execute_WhereNotEquals_ReturnsNonMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE risk.notEquals(High)");

        // Assert
        Assert.Equal(4, result.Data.Count);
        Assert.All(result.Data, c => Assert.NotEqual("High", c.Risk));
    }

    [Fact]
    public void Execute_WhereGreaterThan_ReturnsCorrectRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(100)");

        // Assert
        Assert.Equal(4, result.Data.Count);
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees > 100));
    }

    [Fact]
    public void Execute_WhereLessThan_ReturnsCorrectRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.lessThan(100)");

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees < 100));
    }

    [Fact]
    public void Execute_WhereContains_ReturnsMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE activity_description.contains(Software)");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c => 
            Assert.Contains("Software", c.Activity_Description, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Execute_WhereStartsWith_ReturnsMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE name.startsWith(Tech)");

        // Assert
        Assert.Single(result.Data);
        Assert.StartsWith("Tech", result.Data[0].Name);
    }

    [Fact]
    public void Execute_WhereEndsWith_ReturnsMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE city.endsWith(no)");

        // Assert - Milano (2 instances) + Torino (1 instance) = 3 cities ending with "no"
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c => Assert.EndsWith("no", c.City, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Execute_WhereIn_ReturnsMatchingRecords()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE region.in(Lombardia, Lazio, Veneto)");

        // Assert
        Assert.Equal(4, result.Data.Count);
        Assert.All(result.Data, c => 
            Assert.Contains(c.Region, new[] { "Lombardia", "Lazio", "Veneto" }));
    }

    #endregion

    #region WHERE Clause Tests - Logical Operators

    [Fact]
    public void Execute_WhereAND_ReturnsBothConditionsMet()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(100) AND credit_limit.greaterThan(500000)");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c =>
        {
            Assert.True(c.Number_Of_Employees > 100);
            Assert.True(c.Credit_Limit > 500000);
        });
    }

    [Fact]
    public void Execute_WhereOR_ReturnsEitherConditionMet()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE risk.equals(High) OR employees.greaterThan(400)");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c =>
            Assert.True(c.Risk == "High" || c.Number_Of_Employees > 400));
    }

    [Fact]
    public void Execute_WhereMultipleAND_ReturnsAllConditionsMet()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(100) AND credit_limit.greaterThan(100000) AND risk.equals(Low)");

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.All(result.Data, c =>
        {
            Assert.True(c.Number_Of_Employees > 100);
            Assert.True(c.Credit_Limit > 100000);
            Assert.Equal("Low", c.Risk);
        });
    }

    [Fact]
    public void Execute_WhereMixedANDOR_ReturnsCorrectLogic()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - (Low risk) OR (High employees AND High credit)
        var result = engine.Execute("WHERE risk.equals(Low) OR employees.greaterThan(400) AND credit_limit.greaterThan(500000)");

        // Assert
        Assert.True(result.Data.Count > 0);
    }

    #endregion

    #region WHERE Clause Tests - Field Name Aliases

    [Fact]
    public void Execute_WhereCreditLimitAlias_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Test both credit_limit and creditlimit
        var result1 = engine.Execute("WHERE credit_limit.greaterThan(500000)");
        var result2 = engine.Execute("WHERE creditlimit.greaterThan(500000)");

        // Assert
        Assert.Equal(result1.Data.Count, result2.Data.Count);
    }

    [Fact]
    public void Execute_WhereEmployeesAlias_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Test employees, number_of_employees, numberofemployees
        var result1 = engine.Execute("WHERE employees.greaterThan(100)");
        var result2 = engine.Execute("WHERE number_of_employees.greaterThan(100)");
        var result3 = engine.Execute("WHERE numberofemployees.greaterThan(100)");

        // Assert
        Assert.Equal(result1.Data.Count, result2.Data.Count);
        Assert.Equal(result1.Data.Count, result3.Data.Count);
    }

    #endregion

    #region SORT Clause Tests

    [Fact]
    public void Execute_SortAscending_ReturnsSortedData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) SORT credit_limit ASC");

        // Assert
        Assert.Equal(6, result.Data.Count);
        for (int i = 0; i < result.Data.Count - 1; i++)
        {
            Assert.True(result.Data[i].Credit_Limit <= result.Data[i + 1].Credit_Limit);
        }
    }

    [Fact]
    public void Execute_SortDescending_ReturnsSortedData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) SORT employees DESC");

        // Assert
        Assert.Equal(6, result.Data.Count);
        for (int i = 0; i < result.Data.Count - 1; i++)
        {
            Assert.True(result.Data[i].Number_Of_Employees >= result.Data[i + 1].Number_Of_Employees);
        }
    }

    [Fact]
    public void Execute_SortMultipleFields_ReturnsSortedData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) SORT region ASC, credit_limit DESC");

        // Assert
        Assert.Equal(6, result.Data.Count);
        // Verify primary sort by region
        var regions = result.Data.Select(c => c.Region).ToList();
        var sortedRegions = regions.OrderBy(r => r).ToList();
        // Check that within same region, credit_limit is descending
        var lombardiaCompanies = result.Data.Where(c => c.Region == "Lombardia").ToList();
        if (lombardiaCompanies.Count > 1)
        {
            Assert.True(lombardiaCompanies[0].Credit_Limit >= lombardiaCompanies[1].Credit_Limit);
        }
    }

    #endregion

    #region LIMIT Clause Tests

    [Fact]
    public void Execute_LimitOnly_ReturnsLimitedResults()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) LIMIT 3");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.Equal(6, result.TotalCount);
    }

    [Fact]
    public void Execute_LimitWithOffset_ReturnsPaginatedResults()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) SORT vlei ASC LIMIT 2, 2");

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.Equal(6, result.TotalCount);
        // Should skip first 2, take next 2
        Assert.Equal("VLEI-003", result.Data[0].Vlei);
        Assert.Equal("VLEI-004", result.Data[1].Vlei);
    }

    [Fact]
    public void Execute_LimitLargerThanDataset_ReturnsAllData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(0) LIMIT 100");

        // Assert
        Assert.Equal(6, result.Data.Count);
        Assert.Equal(6, result.TotalCount);
    }

    #endregion

    #region Combined Clauses Tests

    [Fact]
    public void Execute_WHERESortLimit_WorksTogether()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE risk.equals(Low) SORT credit_limit DESC LIMIT 1");

        // Assert
        Assert.Single(result.Data);
        Assert.Equal("Low", result.Data[0].Risk);
        Assert.Equal("VLEI-001", result.Data[0].Vlei); // Highest credit limit among Low risk
    }

    [Fact]
    public void Execute_ComplexQueryAllClauses_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(50) AND credit_limit.greaterThan(200000)
            SORT credit_limit DESC
            LIMIT 3
        ");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.True(result.TotalCount >= 3);
        Assert.All(result.Data, c =>
        {
            Assert.True(c.Number_Of_Employees > 50);
            Assert.True(c.Credit_Limit > 200000);
        });
        // Verify sorted
        for (int i = 0; i < result.Data.Count - 1; i++)
        {
            Assert.True(result.Data[i].Credit_Limit >= result.Data[i + 1].Credit_Limit);
        }
    }

    #endregion

    #region AGGREGATE Tests

    [Fact]
    public void Execute_AggregateCount_ReturnsCount()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(100)");

        // Assert
        Assert.True(result.Aggregations.ContainsKey("count"));
        Assert.Equal(4, result.Aggregations["count"]);
    }

    [Fact]
    public void Execute_AggregateRange_ReturnsBuckets()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(0)
            AGGREGATE range(credit_limit, [
                {from: 0, to: 300000},
                {from: 300000, to: 700000},
                {from: 700000}
            ])
        ");

        // Assert
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
        var rangeAgg = result.Aggregations["range_aggregation"] as Dictionary<string, object>;
        Assert.NotNull(rangeAgg);
        Assert.True(rangeAgg.ContainsKey("buckets"));
    }

    [Fact]
    public void Execute_AggregateRangeWithTerm_ReturnsNestedAggregation()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(0)
            AGGREGATE range(credit_limit, [
                {from: 0, to: 500000},
                {from: 500000}
            ]) {
                term(region, 5)
            }
        ");

        // Assert
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
        var rangeAgg = result.Aggregations["range_aggregation"] as Dictionary<string, object>;
        Assert.NotNull(rangeAgg);
    }

    [Fact]
    public void Execute_AggregateWithStats_ReturnsStatistics()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(0)
            AGGREGATE range(credit_limit, [
                {from: 0, to: 1000000},
                {from: 1000000}
            ]) {
                term(region, 10) {
                    stats(employees)
                }
            }
        ");

        // Assert
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
    }

    [Fact]
    public void Execute_AggregateWithPercentiles_ReturnsPercentiles()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(0)
            AGGREGATE range(credit_limit, [
                {from: 0, to: 500000},
                {from: 500000}
            ]) {
                term(region, 5) {
                    percentiles(credit_limit, [50, 75, 90])
                }
            }
        ");

        // Assert
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
    }

    [Fact]
    public void Execute_CompleteAggregationExample_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - The full example from requirements
        var result = engine.Execute(@"
            WHERE employees.greaterThan(50) AND credit_limit.greaterThan(100000)
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
        ");

        // Assert
        Assert.NotEmpty(result.Data);
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
        Assert.True(result.Aggregations.ContainsKey("count"));
    }

    #endregion

    #region Edge Cases and Error Handling

    [Fact]
    public void Execute_EmptyQuery_ReturnsAllData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("");

        // Assert
        Assert.Equal(6, result.Data.Count);
        Assert.Equal(6, result.TotalCount);
    }

    [Fact]
    public void Execute_WhereNoMatches_ReturnsEmptyList()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(10000)");

        // Assert
        Assert.Empty(result.Data);
        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public void Execute_CaseInsensitiveFieldNames_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result1 = engine.Execute("WHERE RISK.equals(High)");
        var result2 = engine.Execute("WHERE Risk.equals(High)");
        var result3 = engine.Execute("WHERE risk.equals(High)");

        // Assert
        Assert.Equal(result1.Data.Count, result2.Data.Count);
        Assert.Equal(result1.Data.Count, result3.Data.Count);
    }

    [Fact]
    public void Execute_CaseInsensitiveStringComparisons_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result1 = engine.Execute("WHERE risk.equals(high)");
        var result2 = engine.Execute("WHERE risk.equals(HIGH)");
        var result3 = engine.Execute("WHERE risk.equals(High)");

        // Assert
        Assert.Equal(result1.Data.Count, result2.Data.Count);
        Assert.Equal(result1.Data.Count, result3.Data.Count);
    }

    [Fact]
    public void Execute_DecimalComparison_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE credit_limit.greaterThan(250000)");

        // Assert
        Assert.Equal(4, result.Data.Count);
        Assert.All(result.Data, c => Assert.True(c.Credit_Limit > 250000));
    }

    [Fact]
    public void Execute_IntegerComparison_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.lessThan(150)");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees < 150));
    }

    #endregion

    #region Real-World Query Examples

    [Fact]
    public void Execute_FindHighRiskLargeCompanies_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE risk.equals(High) AND employees.greaterThan(100)
            SORT credit_limit DESC
            LIMIT 10
        ");

        // Assert
        Assert.Single(result.Data);
        Assert.Equal("High", result.Data[0].Risk);
        Assert.True(result.Data[0].Number_Of_Employees > 100);
    }

    [Fact]
    public void Execute_RegionalAnalysis_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE region.in(Lombardia, Piemonte, Veneto)
            SORT employees DESC
        ");

        // Assert
        Assert.Equal(4, result.Data.Count);
        Assert.All(result.Data, c => 
            Assert.Contains(c.Region, new[] { "Lombardia", "Piemonte", "Veneto" }));
    }

    [Fact]
    public void Execute_ManufacturingCompanies_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE activity_description.contains(Manufacture)
            SORT credit_limit DESC
        ");

        // Assert
        Assert.Equal(3, result.Data.Count);
        Assert.All(result.Data, c => 
            Assert.Contains("Manufacture", c.Activity_Description, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Execute_SoftwareCompaniesByCity_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE activity_description.contains(Software) AND city.startsWith(M)
            SORT name ASC
        ");

        // Assert
        Assert.Equal(2, result.Data.Count);
        Assert.All(result.Data, c => Assert.StartsWith("M", c.City));
    }

    #endregion

    #region Data Integrity Tests

    [Fact]
    public void Execute_TotalCountReflectsPreLimitCount_Always()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute("WHERE employees.greaterThan(50) LIMIT 2");

        // Assert
        Assert.True(result.TotalCount >= result.Data.Count);
        Assert.Equal(2, result.Data.Count);
    }

    [Fact]
    public void Execute_AggregationsOnFilteredData_NotLimitedData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result = engine.Execute(@"
            WHERE employees.greaterThan(50)
            AGGREGATE range(credit_limit, [{from: 0}])
            LIMIT 1
        ");

        // Assert
        Assert.Single(result.Data); // Only 1 in data due to LIMIT
        Assert.True((int)result.Aggregations["count"] > 1); // But count aggregates all filtered
    }

    [Fact]
    public void Execute_ResultDataIsIndependent_NotShared()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act
        var result1 = engine.Execute("WHERE risk.equals(High)");
        var result2 = engine.Execute("WHERE risk.equals(Medium)");

        // Assert - Verify results are independent (High=2, Medium=2 but different companies)
        Assert.Equal(2, result1.Data.Count);
        Assert.Equal(2, result2.Data.Count);
        Assert.NotEmpty(result1.Data);
        Assert.NotEmpty(result2.Data);
        // Verify they contain different companies
        Assert.All(result1.Data, c => Assert.Equal("High", c.Risk));
        Assert.All(result2.Data, c => Assert.Equal("Medium", c.Risk));
    }

    [Fact]
    public void Execute_AggregateTermWithMultipleStats_ReturnsCorrectAggregations()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Note: stats() only works on numeric fields (credit_limit, employees)
        var result = engine.Execute("AGGREGATE term(city, 20) { stats(credit_limit), stats(employees) } LIMIT 100");

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Data);
        Assert.True(result.Data.Count <= 100);
        
        // Verify aggregations exist
        Assert.NotNull(result.Aggregations);
        Assert.True(result.Aggregations.Count > 0);
        
        // Verify term aggregation was created
        Assert.Contains("term_aggregation", result.Aggregations.Keys);
        var termAgg = result.Aggregations["term_aggregation"] as Dictionary<string, object>;
        Assert.NotNull(termAgg);
        
        // Verify we have buckets grouped by city
        var bucketsObj = termAgg["buckets"];
        var buckets = bucketsObj as List<object>;
        Assert.NotNull(buckets);
        Assert.NotEmpty(buckets);
        Assert.True(buckets.Count <= 20); // Should respect the limit of 20 cities
        
        // Verify each bucket has the expected structure
        var firstBucket = buckets[0] as Dictionary<string, object>;
        Assert.NotNull(firstBucket);
        Assert.Contains("key", firstBucket.Keys);
        Assert.Contains("count", firstBucket.Keys);
        
        // Verify nested stats aggregations exist in buckets
        foreach (var bucketObj in buckets)
        {
            var bucket = bucketObj as Dictionary<string, object>;
            Assert.NotNull(bucket);
            
            // Each bucket should have a nested aggregations container
            Assert.Contains("nested", bucket.Keys);
            var nested = bucket["nested"] as Dictionary<string, object>;
            Assert.NotNull(nested);
            
            // Each bucket should have stats for credit_limit
            Assert.Contains("credit_limit_stats", nested.Keys);
            var creditLimitStats = nested["credit_limit_stats"] as Dictionary<string, object>;
            Assert.NotNull(creditLimitStats);
            Assert.Contains("count", creditLimitStats.Keys);
            Assert.Contains("min", creditLimitStats.Keys);
            Assert.Contains("max", creditLimitStats.Keys);
            Assert.Contains("avg", creditLimitStats.Keys);
            Assert.Contains("sum", creditLimitStats.Keys);
            
            // Verify stats values are reasonable
            Assert.True((int)creditLimitStats["count"] > 0);
            Assert.True((decimal)creditLimitStats["min"] >= 0);
            Assert.True((decimal)creditLimitStats["max"] >= (decimal)creditLimitStats["min"]);
            
            // Each bucket should have stats for employees
            Assert.Contains("employees_stats", nested.Keys);
            var employeesStats = nested["employees_stats"] as Dictionary<string, object>;
            Assert.NotNull(employeesStats);
            Assert.Contains("count", employeesStats.Keys);
            Assert.Contains("min", employeesStats.Keys);
            Assert.Contains("max", employeesStats.Keys);
            Assert.Contains("avg", employeesStats.Keys);
            Assert.Contains("sum", employeesStats.Keys);
            
            // Verify employee stats values are reasonable
            Assert.True((int)employeesStats["count"] > 0);
            Assert.True((decimal)employeesStats["min"] >= 0);
        }
        
        // Verify that cities are actually present
        var cities = buckets.Select(b => (b as Dictionary<string, object>)?["key"] as string).ToList();
        Assert.NotEmpty(cities);
        Assert.All(cities, city => Assert.False(string.IsNullOrWhiteSpace(city)));
        
        // Verify that the data is not affected by aggregations
        Assert.True(result.Data.Count > 0);
        
        // Verify that total count is tracked
        Assert.True(result.TotalCount > 0);
        Assert.True(result.TotalCount >= result.Data.Count);
    }

    [Fact]
    public void Execute_ComplexWhereWithOrAndSort_ReturnsFilteredSortedResults()
    {
        // Arrange
        var engine = new CompanyQueryEngine(GetExtendedTestData());
        
        // This query should find companies in Lombardia region with activity descriptions 
        // containing "Copper", "Metal", or "Mining", sorted by credit limit descending
        var query = "WHERE region.equals(Lombardia) AND (activity_description.contains(Copper) OR activity_description.contains(Metal) OR activity_description.contains(Mining)) SORT credit_limit DESC LIMIT 10";
        
        // Act
        var result = engine.Execute(query);
        
        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Data);
        
        // Should find the 3 Lombardia companies with Metal/Copper/Mining keywords
        Assert.Equal(3, result.Data.Count);
        
        // All results should be in Lombardia region
        Assert.All(result.Data, company => 
            Assert.Equal("Lombardia", company.Region));
        
        // All results should contain one of the keywords in activity description
        Assert.All(result.Data, company =>
        {
            var description = company.Activity_Description.ToLower();
            Assert.True(
                description.Contains("copper") || 
                description.Contains("metal") || 
                description.Contains("mining"),
                $"Activity description '{company.Activity_Description}' should contain Copper, Metal, or Mining");
        });
        
        // Results should be sorted by credit_limit in descending order
        for (int i = 0; i < result.Data.Count - 1; i++)
        {
            Assert.True(result.Data[i].Credit_Limit >= result.Data[i + 1].Credit_Limit,
                $"Credit limit should be in descending order: {result.Data[i].Credit_Limit} >= {result.Data[i + 1].Credit_Limit}");
        }
        
        // Should respect the LIMIT of 10
        Assert.True(result.Data.Count <= 10);
    }

    [Fact]
    public void Execute_NestedParentheses_ParsesCorrectly()
    {
        // Arrange
        var engine = new CompanyQueryEngine(GetExtendedTestData());
        
        // Test nested parentheses: ((A OR B) AND C)
        var query = "WHERE ((region.equals(Lombardia) OR region.equals(Lazio)) AND risk.equals(Medium))";
        
        // Act
        var result = engine.Execute(query);
        
        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Data);
        
        // Should find companies in Lombardia OR Lazio with Medium risk
        Assert.All(result.Data, company =>
        {
            Assert.True(company.Region == "Lombardia" || company.Region == "Lazio",
                $"Region should be Lombardia or Lazio, but was {company.Region}");
            Assert.Equal("Medium", company.Risk);
        });
    }

    #endregion

    #region Flexible DSL Tests - Null/Empty Filter Handling

    [Fact]
    public void Execute_NullFilterValue_IgnoresFilter()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Query with null value should ignore the filter
        var result = engine.Execute("WHERE name.equals() AND employees.greaterThan(100)");

        // Assert
        Assert.Equal(4, result.Data.Count); // Only employees filter should apply
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees > 100));
    }

    [Fact]
    public void Execute_EmptyStringFilter_IgnoresFilter()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Query with empty string should ignore the filter
        var result = engine.Execute("WHERE risk.equals() AND credit_limit.greaterThan(500000)");

        // Assert
        Assert.Equal(3, result.Data.Count); // Only credit_limit filter should apply
        Assert.All(result.Data, c => Assert.True(c.Credit_Limit > 500000));
    }

    [Fact]
    public void Execute_MultipleNullFilters_IgnoresAllNullFilters()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Multiple null/empty filters should all be ignored
        var result = engine.Execute("WHERE name.equals() AND region.contains() AND employees.greaterThan(150)");

        // Assert
        Assert.Equal(3, result.Data.Count); // Only employees filter should apply
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees > 150));
    }

    [Fact]
    public void Execute_AllNullFilters_ReturnsAllData()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - All filters null should return all data
        var result = engine.Execute("WHERE name.equals() AND region.contains() AND risk.equals()");

        // Assert
        Assert.Equal(6, result.Data.Count); // All records should be returned
        Assert.Equal(6, result.TotalCount);
    }

    [Fact]
    public void Execute_NullFilterWithAndLogic_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Null filter with AND should not affect other valid filters
        var result = engine.Execute("WHERE city.equals() AND region.equals(Lombardia) AND employees.greaterThan(100)");

        // Assert
        // Should find companies in Lombardia with > 100 employees (city filter ignored)
        Assert.Equal(2, result.Data.Count);
        Assert.All(result.Data, c =>
        {
            Assert.Equal("Lombardia", c.Region);
            Assert.True(c.Number_Of_Employees > 100);
        });
    }

    [Fact]
    public void Execute_NullFilterWithOrLogic_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Null filter with OR should make that part always true
        var result = engine.Execute("WHERE city.equals() OR employees.greaterThan(400)");

        // Assert
        // Since city.equals() is null (always true), this should return all records
        Assert.Equal(6, result.Data.Count);
        Assert.Equal(6, result.TotalCount);
    }

    [Fact]
    public void Execute_MixedNullAndValidFilters_AppliesOnlyValidFilters()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Mix of null and valid filters
        var result = engine.Execute("WHERE name.contains() AND risk.equals(High) AND address.startsWith() AND employees.greaterThan(100)");

        // Assert
        // Should apply only risk=High AND employees>100 (ignore name and address filters)
        Assert.Single(result.Data);
        Assert.Equal("High", result.Data[0].Risk);
        Assert.True(result.Data[0].Number_Of_Employees > 100);
        Assert.Equal("VLEI-002", result.Data[0].Vlei); // ManufactureX Torino
    }

    [Fact]
    public void Execute_NullFilterInComplexQuery_WorksWithSortAndLimit()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Complex query with null filters, sorting, and limiting
        var result = engine.Execute("WHERE vlei.startsWith() AND employees.greaterThan(80) SORT credit_limit DESC LIMIT 3");

        // Assert
        // vlei filter ignored, only employees filter applied
        Assert.Equal(3, result.Data.Count);
        Assert.True(result.TotalCount >= 3); // Should be 5 total matching employees > 80
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees > 80));
        
        // Verify sorting (descending credit limit)
        for (int i = 0; i < result.Data.Count - 1; i++)
        {
            Assert.True(result.Data[i].Credit_Limit >= result.Data[i + 1].Credit_Limit);
        }
    }

    [Fact]
    public void Execute_NullInMethodArguments_IgnoresFilter()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Test different methods with null arguments
        var containsResult = engine.Execute("WHERE activity_description.contains() AND risk.equals(Low)");
        var startsWithResult = engine.Execute("WHERE name.startsWith() AND risk.equals(Low)");
        var endsWithResult = engine.Execute("WHERE city.endsWith() AND risk.equals(Low)");

        // Assert
        Assert.Equal(2, containsResult.Data.Count);
        Assert.Equal(2, startsWithResult.Data.Count);
        Assert.Equal(2, endsWithResult.Data.Count);
        
        // All should return the same Low risk companies
        Assert.All(containsResult.Data, c => Assert.Equal("Low", c.Risk));
        Assert.All(startsWithResult.Data, c => Assert.Equal("Low", c.Risk));
        Assert.All(endsWithResult.Data, c => Assert.Equal("Low", c.Risk));
    }

    [Fact]
    public void Execute_NullWithAggregations_WorksCorrectly()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Null filter should not affect aggregations
        var result = engine.Execute(@"
            WHERE region.equals() AND employees.greaterThan(100)
            AGGREGATE range(credit_limit, [
                {from: 0, to: 600000},
                {from: 600000}
            ])
        ");

        // Assert
        // Only employees filter should apply, region filter ignored
        Assert.Equal(4, result.Data.Count);
        Assert.Equal(4, result.Aggregations["count"]);
        Assert.All(result.Data, c => Assert.True(c.Number_Of_Employees > 100));
        
        // Verify aggregation was computed on filtered data
        Assert.True(result.Aggregations.ContainsKey("range_aggregation"));
    }

    [Fact]
    public void Execute_ValidVsNullFilter_ProduceDifferentResults()
    {
        // Arrange
        var data = GetTestData();
        var engine = new CompanyQueryEngine(data);

        // Act - Compare same query with valid filter vs null filter
        var validFilterResult = engine.Execute("WHERE region.equals(Lombardia) AND employees.greaterThan(100)");
        var nullFilterResult = engine.Execute("WHERE region.equals() AND employees.greaterThan(100)");

        // Assert
        // Valid filter should return fewer results (only Lombardia)
        Assert.Equal(2, validFilterResult.Data.Count);
        Assert.All(validFilterResult.Data, c => Assert.Equal("Lombardia", c.Region));
        
        // Null filter should return more results (all regions)
        Assert.Equal(4, nullFilterResult.Data.Count);
        var regions = nullFilterResult.Data.Select(c => c.Region).Distinct().ToList();
        Assert.True(regions.Count > 1); // Should include multiple regions
        
        // Both should have employees > 100
        Assert.All(validFilterResult.Data, c => Assert.True(c.Number_Of_Employees > 100));
        Assert.All(nullFilterResult.Data, c => Assert.True(c.Number_Of_Employees > 100));
    }

    #endregion
}
