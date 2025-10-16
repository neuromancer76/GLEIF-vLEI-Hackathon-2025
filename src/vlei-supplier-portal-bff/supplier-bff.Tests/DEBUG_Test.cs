using supplier_bff.Models;
using supplier_bff.Services;

namespace supplier_bff.Tests;

public class DebugTest
{
    [Fact]
    public void Debug_DecimalComparison()
    {
        var companies = new List<ItalianCompany>
        {
            new() { Vlei = "V1", Name = "C1", Credit_Limit = 90000m, Number_Of_Employees = 50 },
            new() { Vlei = "V2", Name = "C2", Credit_Limit = 250000m, Number_Of_Employees = 100 },
            new() { Vlei = "V3", Name = "C3", Credit_Limit = 300000m, Number_Of_Employees = 150 },
            new() { Vlei = "V4", Name = "C4", Credit_Limit = 500000m, Number_Of_Employees = 200 }
        };

        var engine = new CompanyQueryEngine(companies);
        var result = engine.Execute("WHERE credit_limit.greaterThan(250000)");

        // Should only return V3 and V4
        Assert.Equal(2, result.Data.Count);
        Assert.Contains(result.Data, c => c.Vlei == "V3");
        Assert.Contains(result.Data, c => c.Vlei == "V4");
    }
}
