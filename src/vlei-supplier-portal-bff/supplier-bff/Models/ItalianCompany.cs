namespace supplier_bff.Models;

public class ItalianCompany
{
    public string Vlei { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Ateco { get; set; } = string.Empty;
    public string Activity_Description { get; set; } = string.Empty;
    public string Risk { get; set; } = string.Empty;
    public decimal Credit_Limit { get; set; }
    public int Number_Of_Employees { get; set; }
    public string Email { get; set; } = string.Empty;
}
