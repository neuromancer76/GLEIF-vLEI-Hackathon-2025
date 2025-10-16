using Microsoft.AspNetCore.Mvc;
using VleiRegistry.Models;
using VleiRegistry.Repositories;
using System.Net;

namespace VleiRegistry.Controllers
{
    /// <summary>
    /// VLEI Trust Registry - Applications Management Controller
    /// 
    /// This controller manages the registry of trusted applications within the VLEI ecosystem.
    /// It provides discovery and registration services for applications that participate in
    /// VLEI credential exchange workflows.
    /// 
    /// ARCHITECTURAL PURPOSE:
    /// - Trust Registry Pattern: Maintains authoritative list of trusted VLEI applications
    /// - Service Discovery: Enables dynamic discovery of application endpoints and capabilities
    /// - Credential Schema Mapping: Associates applications with their required credential schemas
    /// - MCP Integration: Links applications to their Model Context Protocol configurations
    /// 
    /// TRUST MODEL:
    /// Applications registered here are considered trusted participants in the VLEI ecosystem.
    /// The registry acts as a source of truth for:
    /// - Application identity and capabilities
    /// - Required credential schemas for access
    /// - API endpoints for credential verification
    /// - Portal URLs for user interfaces
    /// 
    /// INTEGRATION PATTERNS:
    /// - Chatbot AI queries this registry to discover available applications
    /// - Supplier Portal BFF validates application access through credential schema checks
    /// - Frontend applications use portal URLs for seamless user navigation
    /// - KERIA agents reference API URLs for credential presentation workflows
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationsController : ControllerBase
    {
        private readonly IApplicationRepository _applicationRepository;
        private readonly ILogger<ApplicationsController> _logger;

        /// <summary>
        /// Initialize controller with dependency injection.
        /// 
        /// Repository Pattern: Abstracts data access to enable testability and
        /// future migration from in-memory storage to distributed databases.
        /// </summary>
        public ApplicationsController(IApplicationRepository applicationRepository, ILogger<ApplicationsController> logger)
        {
            _applicationRepository = applicationRepository;
            _logger = logger;
        }

        /// <summary>
        /// Retrieve the complete list of trusted VLEI applications for discovery purposes.
        /// 
        /// BUSINESS LOGIC:
        /// This endpoint serves as the primary discovery mechanism for VLEI applications.
        /// It returns a lightweight list suitable for:
        /// - AI chatbot application suggestion workflows
        /// - Frontend application navigation menus
        /// - Service mesh discovery and routing
        /// - Administrative dashboards and monitoring
        /// 
        /// CACHING STRATEGY:
        /// In production, this endpoint should be cached aggressively since application
        /// registrations change infrequently. Consider implementing:
        /// - Response caching with appropriate cache headers
        /// - Redis caching for high-traffic scenarios
        /// - CDN distribution for global access patterns
        /// </summary>
        /// <returns>Lightweight list of applications with essential discovery information</returns>
        /// <response code="200">Returns the list of applications</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("list")]
        [ProducesResponseType(typeof(IEnumerable<ApplicationListItem>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<ApplicationListItem>>> GetApplicationList()
        {
            try
            {
                var applications = await _applicationRepository.GetAllAsync();
                return Ok(applications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving application list");
                return StatusCode(500, "Internal server error occurred while retrieving applications");
            }
        }

        /// <summary>
        /// Get detailed information about a specific application
        /// </summary>
        /// <param name="applicationId">The application ID</param>
        /// <returns>Application details including all properties</returns>
        /// <response code="200">Returns the application details</response>
        /// <response code="400">If the application ID is invalid</response>
        /// <response code="404">If the application is not found</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("{applicationId}/details")]
        [ProducesResponseType(typeof(ApplicationDetails), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<ApplicationDetails>> GetApplicationDetails(string applicationId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(applicationId))
                {
                    return BadRequest("Application ID is required");
                }

                var application = await _applicationRepository.GetByIdAsync(applicationId);
                
                if (application == null)
                {
                    return NotFound($"Application with ID '{applicationId}' not found");
                }

                return Ok(application);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving application details for ID: {ApplicationId}", applicationId);
                return StatusCode(500, "Internal server error occurred while retrieving application details");
            }
        }

        /// <summary>
        /// Create a new application
        /// </summary>
        /// <param name="request">Application creation request</param>
        /// <returns>Created application details</returns>
        /// <response code="201">Returns the newly created application</response>
        /// <response code="400">If the request is invalid</response>
        /// <response code="409">If an application with the same ID already exists</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApplicationDetails), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Conflict)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<ApplicationDetails>> CreateApplication([FromBody] CreateApplicationRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body is required");
                }

                if (string.IsNullOrWhiteSpace(request.ApplicationId))
                {
                    return BadRequest("Application ID is required");
                }

                if (string.IsNullOrWhiteSpace(request.Description))
                {
                    return BadRequest("Description is required");
                }

                // Check if application already exists
                var exists = await _applicationRepository.ExistsAsync(request.ApplicationId);
                if (exists)
                {
                    return Conflict($"Application with ID '{request.ApplicationId}' already exists");
                }

                // Create new application
                var application = new Application
                {
                    ApplicationId = request.ApplicationId,
                    Description = request.Description,
                    CredentialSchema = request.CredentialSchema,
                    McpName = request.McpName,
                    ApiUrl = request.ApiUrl,
                    PortalUrl = request.PortalUrl
                };

                var createdApplication = await _applicationRepository.AddAsync(application);

                var response = new ApplicationDetails
                {
                    ApplicationId = createdApplication.ApplicationId,
                    Description = createdApplication.Description,
                    CredentialSchema = createdApplication.CredentialSchema,
                    McpName = createdApplication.McpName,
                    ApiUrl = createdApplication.ApiUrl,
                    PortalUrl = createdApplication.PortalUrl
                };

                return CreatedAtAction(
                    nameof(GetApplicationDetails),
                    new { applicationId = response.ApplicationId },
                    response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating application");
                return StatusCode(500, "Internal server error occurred while creating application");
            }
        }
    }
}