using Microsoft.AspNetCore.Mvc;
using VleiRegistry.Models;
using VleiRegistry.Repositories;
using System.Net;

namespace VleiRegistry.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertifiersController : ControllerBase
    {
        private readonly ICertifierRepository _certifierRepository;
        private readonly ILogger<CertifiersController> _logger;

        public CertifiersController(ICertifierRepository certifierRepository, ILogger<CertifiersController> logger)
        {
            _certifierRepository = certifierRepository;
            _logger = logger;
        }

        /// <summary>
        /// Get a list of all certifiers with their IDs and descriptions
        /// </summary>
        /// <returns>List of certifiers with ID and description</returns>
        /// <response code="200">Returns the list of certifiers</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("list")]
        [ProducesResponseType(typeof(IEnumerable<CertifierListItem>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<CertifierListItem>>> GetCertifierList()
        {
            try
            {
                var certifiers = await _certifierRepository.GetAllAsync();
                return Ok(certifiers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving certifier list");
                return StatusCode(500, "Internal server error occurred while retrieving certifiers");
            }
        }

        /// <summary>
        /// Get detailed information about a specific certifier
        /// </summary>
        /// <param name="certifierId">The certifier ID</param>
        /// <returns>Certifier details including all properties</returns>
        /// <response code="200">Returns the certifier details</response>
        /// <response code="400">If the certifier ID is invalid</response>
        /// <response code="404">If the certifier is not found</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpGet("{certifierId}/details")]
        [ProducesResponseType(typeof(CertifierDetails), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<CertifierDetails>> GetCertifierDetails(string certifierId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(certifierId))
                {
                    return BadRequest("Certifier ID is required");
                }

                var certifier = await _certifierRepository.GetByIdAsync(certifierId);
                
                if (certifier == null)
                {
                    return NotFound($"Certifier with ID '{certifierId}' not found");
                }

                return Ok(certifier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving certifier details for ID: {CertifierId}", certifierId);
                return StatusCode(500, "Internal server error occurred while retrieving certifier details");
            }
        }

        /// <summary>
        /// Create a new certifier
        /// </summary>
        /// <param name="request">Certifier creation request</param>
        /// <returns>Created certifier details</returns>
        /// <response code="201">Returns the newly created certifier</response>
        /// <response code="400">If the request is invalid</response>
        /// <response code="409">If a certifier with the same ID already exists</response>
        /// <response code="500">If there was an internal server error</response>
        [HttpPost]
        [ProducesResponseType(typeof(CertifierDetails), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Conflict)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<CertifierDetails>> CreateCertifier([FromBody] CreateCertifierRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body is required");
                }

                if (string.IsNullOrWhiteSpace(request.Id))
                {
                    return BadRequest("Certifier ID is required");
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest("Certifier name is required");
                }

                if (string.IsNullOrWhiteSpace(request.Description))
                {
                    return BadRequest("Description is required");
                }

                // Check if certifier already exists
                var exists = await _certifierRepository.ExistsAsync(request.Id);
                if (exists)
                {
                    return Conflict($"Certifier with ID '{request.Id}' already exists");
                }

                // Create new certifier
                var certifier = new Certifier
                {
                    Id = request.Id,
                    BadgeTypes = request.BadgeTypes ?? new List<string>(),
                    ContactUri = request.ContactUri,
                    Name = request.Name,
                    Description = request.Description
                };

                var createdCertifier = await _certifierRepository.AddAsync(certifier);

                var response = new CertifierDetails
                {
                    Id = createdCertifier.Id,
                    BadgeTypes = new List<string>(createdCertifier.BadgeTypes),
                    ContactUri = createdCertifier.ContactUri,
                    Name = createdCertifier.Name,
                    Description = createdCertifier.Description
                };

                return CreatedAtAction(
                    nameof(GetCertifierDetails),
                    new { certifierId = response.Id },
                    response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating certifier");
                return StatusCode(500, "Internal server error occurred while creating certifier");
            }
        }
    }
}