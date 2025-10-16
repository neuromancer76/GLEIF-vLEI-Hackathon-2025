using Microsoft.AspNetCore.Mvc;
using supplier_bff.Repositories;
using supplier_bff.Models;
using supplier_bff.Services;

namespace supplier_bff.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItalianCompaniesController : ControllerBase
{
    private readonly IItalianCompanyRepository _repository;
    private readonly ILogger<ItalianCompaniesController> _logger;

    public ItalianCompaniesController(
        IItalianCompanyRepository repository,
        ILogger<ItalianCompaniesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get all Italian companies
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ItalianCompany>>> GetAll()
    {
        var companies = await _repository.GetAllAsync();
        return Ok(companies);
    }

    /// <summary>
    /// Get a company by VLEI
    /// </summary>
    [HttpGet("{vlei}")]
    public async Task<ActionResult<ItalianCompany>> GetByVlei(string vlei)
    {
        var company = await _repository.GetByVleiAsync(vlei);
        
        if (company == null)
            return NotFound();
        
        return Ok(company);
    }

    /// <summary>
    /// Search companies using DSL query
    /// </summary>
    /// <remarks>
    /// Example query:
    /// 
    ///     WHERE number_of_employees.greaterThan(100) AND
    ///           credit_limit.greaterThan(100000) AND
    ///           risk.equals(High)
    ///     SORT credit_limit DESC
    ///     LIMIT 10
    ///     
    /// Advanced query with aggregations:
    /// 
    ///     WHERE number_of_employees.greaterThan(100) AND
    ///           credit_limit.greaterThan(100000)
    ///     AGGREGATE range(credit_limit, [
    ///         {from: 100000, to: 500000},
    ///         {from: 500000, to: 1000000}, 
    ///         {from: 1000000}
    ///     ]) {
    ///         term(region, 5) {
    ///             stats(number_of_employees),
    ///             percentiles(credit_limit, [50, 75, 90])
    ///         }
    ///     }
    /// </remarks>
    [HttpPost("search")]
    public async Task<ActionResult<QueryResult<ItalianCompany>>> Search([FromBody] SearchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query is required");
        
        try
        {
            var result = await _repository.SearchAsync(request.Query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing search query");
            return StatusCode(500, new { error = "Error executing query", message = ex.Message });
        }
    }
}

public class SearchRequest
{
    public string Query { get; set; } = string.Empty;
}
