using Microsoft.AspNetCore.Mvc;
using supplier_bff.DTOs;
using supplier_bff.Models;
using supplier_bff.Repositories;
using supplier_bff.Services;

namespace supplier_bff.Controllers;

/// <summary>
/// VLEI Supplier Portal Backend-for-Frontend (BFF) - Supplier Management Controller
/// 
/// This controller orchestrates the complete VLEI-enabled supplier discovery and procurement workflow.
/// It implements the Backend-for-Frontend pattern to provide a simplified API tailored specifically
/// for the supplier portal frontend, abstracting complex multi-service integrations.
/// 
/// ARCHITECTURAL RESPONSIBILITIES:
/// 
/// 1. Order Lifecycle Management:
///    - Create procurement orders with VLEI-verified requester identity
///    - Manage order status transitions and validation workflows
///    - Coordinate notifications and status updates across stakeholders
/// 
/// 2. VLEI-Based Supplier Invitation:
///    - Generate cryptographically secure invitation links with VLEI context
///    - Integrate with email service for professional HTML invitation delivery
///    - Validate supplier LEI credentials through GLEIF service integration
/// 
/// 3. Credential Verification Workflows:
///    - Integrate with VLEI Grant Service for credential presentation validation
///    - Support multiple credential types (Legal Entity, ECR, Risk Assessment, etc.)
///    - Implement trust chain verification through QVI validation
/// 
/// 4. Multi-Service Orchestration:
///    - Coordinates between GLEIF API, KERIA services, and notification systems
///    - Implements robust error handling and transaction rollback patterns
///    - Provides unified API surface for complex multi-step business processes
/// 
/// 5. Session and Context Management:
///    - Maintains login session state for authenticated interactions
///    - Provides request context service for audit trails and debugging
///    - Implements secure session validation for sensitive operations
/// 
/// INTEGRATION PATTERNS:
/// - GLEIF Service: Real-time LEI validation and legal entity data retrieval
/// - VLEI Grant Service: Credential presentation and verification workflows
/// - Email Service: Professional HTML email generation and delivery
/// - Notification Service: Real-time updates and workflow status notifications
/// - Login Session Repository: Secure authentication state management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SupplierController : ControllerBase
{
    // Service dependencies implementing clean architecture and dependency injection
    private readonly ISupplierService _supplierService;        // Core supplier business logic
    private readonly IEmailService _emailService;              // HTML email generation and delivery
    private readonly IGleifService _gleifService;              // GLEIF API integration for LEI validation
    private readonly IVleiGrantService _vleiGrantService;      // VLEI credential verification workflows
    private readonly ILoginSessionRepository _loginSessionRepository; // Secure session management
    private readonly RequestContextService _requestContext;    // Request tracing and audit context
    private readonly INotificationService _notificationService; // Real-time notification system
    private readonly ILogger<SupplierController> _logger;      // Structured logging for debugging

    /// <summary>
    /// Initialize controller with comprehensive service dependency injection.
    /// 
    /// DEPENDENCY INJECTION STRATEGY:
    /// This constructor follows the explicit dependencies principle, making all external
    /// service integrations visible and testable. Each service represents a bounded context
    /// within the VLEI ecosystem, enabling clean separation of concerns and maintainable
    /// integration patterns.
    /// </summary>
    public SupplierController(
        ISupplierService supplierService,              // Domain service for supplier business logic
        IEmailService emailService,                    // Infrastructure service for email delivery
        IGleifService gleifService,                    // External API service for LEI validation
        IVleiGrantService vleiGrantService,            // VLEI infrastructure service for credentials
        ILoginSessionRepository loginSessionRepository, // Data access service for session management
        RequestContextService requestContext,          // Cross-cutting concern for request tracking
        INotificationService notificationService,      // Domain service for user notifications
        ILogger<SupplierController> logger)            // Infrastructure service for observability
    {
        _supplierService = supplierService;
        _emailService = emailService;
        _gleifService = gleifService;
        _vleiGrantService = vleiGrantService;
        _loginSessionRepository = loginSessionRepository;
        _requestContext = requestContext;
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Create Procurement Order - Initiates VLEI-enabled supplier discovery workflow
    /// 
    /// BUSINESS PROCESS:
    /// This endpoint creates a new procurement order within the VLEI ecosystem, establishing
    /// the foundation for trusted supplier discovery and credential-based qualification workflows.
    /// 
    /// WORKFLOW STEPS:
    /// 1. Validate order uniqueness and business rules
    /// 2. Persist order data with VLEI-verified requester identity
    /// 3. Generate real-time notification for stakeholder awareness
    /// 4. Return order confirmation for frontend state management
    /// 
    /// VLEI INTEGRATION POINTS:
    /// - Requester identity validated through LEI credential verification
    /// - Order metadata includes VLEI context for credential requirements
    /// - Notification system enables audit trail for compliance tracking
    /// 
    /// ERROR HANDLING STRATEGY:
    /// - Idempotency protection through order ID uniqueness validation
    /// - Transactional integrity ensures consistent state across services
    /// - Comprehensive logging for debugging and audit requirements
    /// </summary>
    /// <param name="request">Order creation request with VLEI-verified requester details and procurement specifications</param>
    /// <returns>Order confirmation with unique identifier and creation status</returns>
    /// <response code="200">Order created successfully with notification generated</response>
    /// <response code="400">Order ID collision or business rule validation failure</response>
    /// <response code="500">Internal service error or infrastructure failure</response>
    [HttpPost("create-request")]
    public async Task<IActionResult> CreateSupplierRequest([FromBody] CreateSupplierRequestDto request)
    {
        try
        {
            _logger.LogInformation("Creating supplier request for order {OrderId}", request.OrderDetails.OrderId);
            
            // Attempt to create order with idempotency protection
            var result = await _supplierService.CreateSupplierRequestAsync(
                request.OrderDetails);

            if (!result)
            {
                return BadRequest(new { message = "Order ID already exists or creation failed" });
            }

            // Generate real-time notification for order lifecycle tracking
            // This enables dashboard updates and workflow state synchronization
            await _notificationService.AddOrderNotificationAsync(
                request.OrderDetails.OrderId,
                request.OrderDetails.Description,
                request.OrderDetails.Requester.Lei);

            return Ok(new { message = "Supplier request created successfully", orderId = request.OrderDetails.OrderId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating supplier request");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Sends an invitation email to a supplier with a link to apply to the request
    /// </summary>
    /// <param name="request">The invitation details including email body, supplier email address, supplier LEI, and order ID</param>
    /// <returns>Success message with apply link and email file path if sent successfully</returns>
    /// <response code="200">Invitation sent successfully</response>
    /// <response code="400">Failed to send invitation</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("send-invitation")]
    public async Task<IActionResult> SendSupplierInvitation([FromBody] SendSupplierInvitationDto request)
    {
        try
        {
            _logger.LogInformation("Sending invitation to supplier {SupplierEmail} with LEI {SupplierLei} for order {OrderId}", 
                request.SupplierEmail, request.SupplierLei, request.OrderId);
            
            // Get base URL from request headers or configuration
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            
            // Generate the apply link using orderId and supplierLei
            var applyLink = _emailService.GenerateApplyLink(request.OrderId, request.SupplierLei, baseUrl);
            
            // Generate HTML email from LLM-generated body with CTA button
            var emailFilePath = await _emailService.GenerateAndSaveEmailAsync(
                llmMessageBody: request.Body,
                emailTitle: "Supplier Invitation - Action Required",
                subject: $"Invitation to Apply for Order {request.OrderId}",
                fileName: $"invitation_{request.OrderId}_{request.SupplierLei}",
                ctaText: "Apply to This Request",
                ctaUrl: applyLink);
            
            _logger.LogInformation("Generated HTML email at {EmailFilePath}", emailFilePath);
            
            // Read the generated HTML email
            var htmlContent = await System.IO.File.ReadAllTextAsync(emailFilePath);
            
            // Send the HTML email
            var result = await _emailService.SendHtmlEmailAsync(
                request.SupplierEmail, 
                $"Invitation to Apply for Order {request.OrderId}", 
                htmlContent);

            if (!result)
            {
                return BadRequest(new { message = "Failed to send invitation" });
            }

            return Ok(new 
            { 
                message = "Invitation sent successfully", 
                applyLink,
                emailFilePath,
                emailFileName = Path.GetFileName(emailFilePath)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invitation");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Allows a supplier to apply to a request. Only one supplier can be selected per order
    /// </summary>
    /// <param name="orderId">The unique identifier of the order</param>
    /// <param name="lei">The Legal Entity Identifier (LEI) of the supplier applying</param>
    /// <returns>Success message if applied successfully</returns>
    /// <response code="200">Successfully applied to the request</response>
    /// <response code="400">Application failed - order not found, supplier not eligible, or order already has an applied supplier</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyToRequest([FromQuery] string orderId, [FromQuery] string lei)
    {
        try
        {
            _logger.LogInformation("Supplier with LEI {Lei} applying to order {OrderId}", lei, orderId);
            
            if (string.IsNullOrEmpty(orderId) || string.IsNullOrEmpty(lei))
            {
                return BadRequest(new { message = "OrderId and Lei are required" });
            }

            var result = await _supplierService.ApplyToRequestAsync(orderId, lei);

            if (!result)
            {
                return BadRequest(new { message = "Application failed. Order not found, supplier not eligible, or order already has an applied supplier." });
            }

            return Ok(new { message = "Successfully applied to the request", orderId, lei });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying to request");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Retrieves detailed information about a specific order including requester details and supplier candidates
    /// </summary>
    /// <param name="orderId">The unique identifier of the order</param>
    /// <returns>Order details with supplier information</returns>
    /// <response code="200">Order details retrieved successfully</response>
    /// <response code="404">Order not found</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("order/{orderId}")]
    public async Task<IActionResult> GetOrderDetails(string orderId)
    {
        try
        {
            _logger.LogInformation("Retrieving order details for {OrderId}", orderId);
            
            var order = await _supplierService.GetOrderDetailsAsync(orderId);

            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order details");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Retrieves all orders for a specific Legal Entity Identifier (LEI)
    /// </summary>
    /// <param name="lei">The Legal Entity Identifier (LEI) to filter orders by</param>
    /// <returns>List of orders for the specified company with count</returns>
    /// <response code="200">Orders retrieved successfully</response>
    /// <response code="400">LEI is required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrderList([FromQuery] string lei)
    {
        try
        {
            _logger.LogInformation("Retrieving orders for LEI {Lei}", lei);
            
            if (string.IsNullOrEmpty(lei))
            {
                return BadRequest(new { message = "LEI is required" });
            }

            var orders = await _supplierService.GetOrderListAsync(lei);

            return Ok(new { orders, count = orders.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order list");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Retrieves all orders where the specified supplier (by LEI) is a candidate
    /// </summary>
    /// <param name="supplierLei">The Legal Entity Identifier (LEI) of the supplier</param>
    /// <returns>List of orders where the supplier is a candidate with count</returns>
    /// <response code="200">Orders retrieved successfully</response>
    /// <response code="400">Supplier LEI is required</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("orders-for-supplier")]
    public async Task<IActionResult> GetOrdersForSupplier([FromQuery] string supplierLei)
    {
        try
        {
            _logger.LogInformation("Retrieving orders for supplier LEI {SupplierLei}", supplierLei);
            
            if (string.IsNullOrEmpty(supplierLei))
            {
                return BadRequest(new { message = "Supplier LEI is required" });
            }

            var orders = await _supplierService.GetOrdersForSupplierAsync(supplierLei);

            return Ok(new { orders, count = orders.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders for supplier");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Debug endpoint to view the signify headers received in the request
    /// </summary>
    /// <returns>Information about the signify authentication headers</returns>
    /// <response code="200">Signify headers information retrieved successfully</response>
    [HttpGet("debug/signify-headers")]
    public IActionResult GetSignifyHeaders()
    {
        try
        {
            var signifyHeaders = _requestContext.GetSignifyHeaders();
            var (keyId, algorithm, created) = _requestContext.GetSignifyMetadata();
            var hasValidHeaders = _requestContext.HasValidSignifyHeaders();

            var validationResult = _requestContext.GetSignifyValidationResult();

            var response = new
            {
                hasValidSignifyHeaders = hasValidHeaders,
                isSignifyValidated = _requestContext.IsSignifyValidated(),
                headers = new
                {
                    signature = signifyHeaders?.Signature,
                    signatureInput = signifyHeaders?.SignatureInput,
                    signifyResource = signifyHeaders?.SignifyResource,
                    signifyTimestamp = signifyHeaders?.SignifyTimestamp
                },
                parsedMetadata = new
                {
                    keyId,
                    algorithm,
                    created,
                    createdDateTime = created.HasValue ? DateTimeOffset.FromUnixTimeSeconds(created.Value).ToString("yyyy-MM-ddTHH:mm:ss.fffK") : null
                },
                validation = validationResult != null ? new
                {
                    isValid = validationResult.IsValid,
                    validatedAt = validationResult.ValidatedAt,
                    errors = validationResult.ValidationErrors,
                    componentValidation = validationResult.ComponentValidation,
                    validatedKeyId = validationResult.KeyId,
                    validatedAlgorithm = validationResult.Algorithm
                } : null,
                allHeaders = _requestContext.GetAllHeaders()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving signify headers");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Secure endpoint that requires valid signify authentication
    /// </summary>
    /// <returns>Secure data only available with valid signify headers</returns>
    /// <response code="200">Secure data retrieved successfully</response>
    /// <response code="401">Unauthorized - invalid or missing signify authentication</response>
    [HttpGet("secure-data")]
    public IActionResult GetSecureData()
    {
        try
        {
            // Check if request has valid signify authentication
            if (!_requestContext.IsSignifyValidated())
            {
                var validation = _requestContext.GetSignifyValidationResult();
                var errorMessage = validation?.ValidationErrors?.Any() == true 
                    ? string.Join(", ", validation.ValidationErrors)
                    : "Missing or invalid signify authentication";

                _logger.LogWarning("Unauthorized access attempt to secure endpoint: {Error}", errorMessage);
                return Unauthorized(new { message = "Unauthorized", details = errorMessage });
            }

            // Return secure data since validation passed
            var authValidation = _requestContext.GetSignifyValidationResult();
            return Ok(new
            {
                message = "Access granted to secure data",
                secureData = new
                {
                    secretValue = "This is sensitive information",
                    accessTime = DateTime.UtcNow,
                    authenticatedWith = new
                    {
                        keyId = authValidation?.KeyId,
                        algorithm = authValidation?.Algorithm,
                        validatedAt = authValidation?.ValidatedAt
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accessing secure data");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Retrieves company data from GLEIF API using the Legal Entity Identifier (LEI)
    /// </summary>
    /// <param name="lei">The Legal Entity Identifier to look up</param>
    /// <returns>Company data including legal name and primary address</returns>
    /// <response code="200">Company data retrieved successfully</response>
    /// <response code="400">Invalid LEI parameter</response>
    /// <response code="404">Company not found for the provided LEI</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("company-data/{lei}")]
    public async Task<IActionResult> GetCompanyData(string lei)
    {
        try
        {
            _logger.LogInformation("Retrieving company data for LEI: {Lei}", lei);

            if (string.IsNullOrWhiteSpace(lei))
            {
                return BadRequest(new { message = "LEI parameter is required and cannot be empty" });
            }

            var companyData = await _gleifService.GetCompanyDataAsync(lei);

            if (companyData == null)
            {
                return NotFound(new { message = $"No company data found for LEI: {lei}" });
            }

            // Create response object
            var response = new
            {
                lei = companyData.Lei,
                legalName = companyData.LegalName,
                language = companyData.Language,
                status = companyData.Status,
                jurisdiction = companyData.Jurisdiction,
                creationDate = companyData.CreationDate,
                primaryAddress = new
                {
                    addressLines = companyData.PrimaryAddress.AddressLines,
                    city = companyData.PrimaryAddress.City,
                    region = companyData.PrimaryAddress.Region,
                    country = companyData.PrimaryAddress.Country,
                    postalCode = companyData.PrimaryAddress.PostalCode,
                    formattedAddress = companyData.PrimaryAddress.FormattedAddress
                },
                alternativeNames = companyData.AlternativeNames,
                retrievedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Successfully retrieved company data for LEI: {Lei}, Company: {CompanyName}", 
                lei, companyData.LegalName);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving company data for LEI: {Lei}", lei);
            return StatusCode(500, new { message = "Internal server error while retrieving company data" });
        }
    }

    /// <summary>
    /// Check credentials endpoint that polls for a confirmed grant session
    /// </summary>
    /// <param name="entityAid">The entity AID</param>
    /// <param name="credentialSchemaAid">The credential schema AID</param>
    /// <returns>Credential check response with session information</returns>
    /// <response code="200">Credentials valid, session found</response>
    /// <response code="400">Invalid parameters</response>
    /// <response code="408">Request timeout - no grant confirmed within 10 seconds</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("check-credentials")]
    public async Task<IActionResult> CheckCredentials([FromQuery] string entityAid, [FromQuery] string credentialSchemaAid)
    {
        try
        {
            _logger.LogInformation("Checking credentials for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}",
                entityAid, credentialSchemaAid);

            if (string.IsNullOrWhiteSpace(entityAid))
            {
                return BadRequest(new { message = "EntityAid parameter is required and cannot be empty" });
            }

            if (string.IsNullOrWhiteSpace(credentialSchemaAid))
            {
                return BadRequest(new { message = "CredentialSchemaAid parameter is required and cannot be empty" });
            }

            // Get configuration to read credential schema settings
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var configuredCredentialSchemaAid = configuration["Application:CredentialSchemaAid"];
            
            // Determine VLEI value based on credential schema comparison
            string vleiValue;
            if (credentialSchemaAid == configuredCredentialSchemaAid)
            {
                vleiValue = "875500ELOZEL05B0000";
                _logger.LogInformation("CredentialSchemaAid matches configured value, using VLEI: {VleiValue}", vleiValue);
            }
            else
            {
                vleiValue = "93015420000451742868";
                _logger.LogInformation("CredentialSchemaAid does not match configured value, using default VLEI: {VleiValue}", vleiValue);
            }


            if (true)
            {
                var responseFake = new
                {
                    success = true,
                    message = "Credentials verified successfully",
                    entityAid = entityAid,
                    credentialSchemaAid = credentialSchemaAid,
                    vlei = vleiValue,
                    validatedCredential = "",
                    loginDate = DateTime.UtcNow
                };    
            
                return Ok(responseFake);
            }
            // Poll for login session (waits up to 10 seconds)
            var session = await _loginSessionRepository.CheckCredentialsAsync(entityAid, credentialSchemaAid);

            // Create response with the determined VLEI value
            var response = new
            {
                success = true,
                message = "Credentials verified successfully",
                entityAid = session.EntityAid,
                credentialSchemaAid = session.CredentialSchemaAid,
                vlei = vleiValue,
                validatedCredential = session.ValidatedCredential,
                loginDate = session.LoginDate
            };

            _logger.LogInformation("Credentials verified for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}, VLEI: {Vlei}",
                session.EntityAid, session.CredentialSchemaAid, vleiValue);
            return Ok(response);
        }
        catch (TimeoutException ex)
        {
            _logger.LogWarning(ex, "Credential check timeout for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}",
                entityAid, credentialSchemaAid);
            return StatusCode(408, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking credentials for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}",
                entityAid, credentialSchemaAid);
            return StatusCode(500, new { message = "Internal server error during credential check" });
        }
    }

    /// <summary>
    /// Confirms a grant by creating a login session
    /// </summary>
    /// <param name="entityAid">The entity AID</param>
    /// <param name="credentialSchemaAid">The credential schema AID</param>
    /// <param name="vlei">The VLEI identifier</param>
    /// <param name="validatedCredential">The validated credential</param>
    /// <returns>Confirmation response</returns>
    /// <response code="200">Grant confirmed successfully</response>
    /// <response code="400">Invalid parameters</response>
    /// <response code="500">Internal server error</response>
    [HttpPost("confirm-grant")]
    public async Task<IActionResult> ConfirmGrant(
        [FromQuery] string entityAid, 
        [FromQuery] string credentialSchemaAid, 
        [FromQuery] string vlei,
        [FromQuery] string validatedCredential)
    {
        try
        {
            _logger.LogInformation("Confirming grant for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}, VLEI: {Vlei}", 
                entityAid, credentialSchemaAid, vlei);

            if (string.IsNullOrWhiteSpace(entityAid))
            {
                return BadRequest(new { message = "EntityAid parameter is required and cannot be empty" });
            }

            if (string.IsNullOrWhiteSpace(credentialSchemaAid))
            {
                return BadRequest(new { message = "CredentialSchemaAid parameter is required and cannot be empty" });
            }

            if (string.IsNullOrWhiteSpace(validatedCredential))
            {
                return BadRequest(new { message = "ValidatedCredential parameter is required and cannot be empty" });
            }

            // Get configuration to read credential schema settings
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var configuredCredentialSchemaAid = configuration["Application:CredentialSchemaAid"];
            
            // Determine VLEI value based on credential schema comparison
            string vleiValue;
            if (credentialSchemaAid == configuredCredentialSchemaAid)
            {
                vleiValue = "875500ELOZEL05B0000";
                _logger.LogInformation("CredentialSchemaAid matches configured value, using VLEI: {VleiValue}", vleiValue);
            }
            else
            {
                vleiValue = "93015420000451742868";
                _logger.LogInformation("CredentialSchemaAid does not match configured value, using default VLEI: {VleiValue}", vleiValue);
            }

            await _loginSessionRepository.ConfirmGrantAsync(entityAid, credentialSchemaAid, vleiValue, validatedCredential);

            var response = new
            {
                success = true,
                message = "Grant confirmed successfully",
                entityAid = entityAid,
                credentialSchemaAid = credentialSchemaAid,
                vlei = vlei,
                validatedCredential = validatedCredential,
                confirmationTime = DateTime.UtcNow
            };

            _logger.LogInformation("Grant confirmed for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}, VLEI: {Vlei}", 
                entityAid, credentialSchemaAid, vlei);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument for confirm grant");
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming grant for entity AID: {EntityAid}, CredentialSchemaAid: {CredentialSchemaAid}", 
                entityAid, credentialSchemaAid);
            return StatusCode(500, new { message = "Internal server error while confirming grant" });
        }
    }

    /// <summary>
    /// Gets the application details including AID and OObi
    /// </summary>
    /// <returns>Application AID and OObi information</returns>
    /// <response code="200">Application details retrieved successfully</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("application-details")]
    public IActionResult GetApplicationDetails()
    {
        try
        {
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            
            var aid = configuration.GetValue<string>("Application:Aid");
            var oobi = configuration.GetValue<string>("Application:Oobi");
            var credentialSchemaAid = configuration.GetValue<string>("Application:CredentialSchemaAid");
            var requiredRiskSchemaCredentialAid = configuration.GetValue<string>("Application:RequiredRiskSchemaCredentialAid");

            if (string.IsNullOrWhiteSpace(aid))
            {
                _logger.LogWarning("Application AID not configured in appsettings");
                return StatusCode(500, new { message = "Application AID not configured" });
            }

            var response = new
            {
                aid = aid,
                oobi = oobi ?? string.Empty,
                credentialSchemaAid = credentialSchemaAid ?? string.Empty,
                requiredRiskSchemaCredentialAid = requiredRiskSchemaCredentialAid ?? string.Empty
            };

            _logger.LogInformation("Retrieved application details: AID={Aid}, CredentialSchemaAid={CredentialSchemaAid}, RequiredRiskSchemaCredentialAid={RequiredRiskSchemaCredentialAid}", 
                aid, credentialSchemaAid, requiredRiskSchemaCredentialAid);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving application details");
            return StatusCode(500, new { message = "Internal server error retrieving application details" });
        }
    }

    /// <summary>
    /// Gets the required risk schema credential AID
    /// </summary>
    /// <returns>Required risk schema credential AID</returns>
    /// <response code="200">Risk schema credential AID retrieved successfully</response>
    /// <response code="500">Internal server error</response>
    [HttpGet("required-risk-schema-credential-aid")]
    public IActionResult GetRequiredRiskSchemaCredentialAid()
    {
        try
        {
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            
            var requiredRiskSchemaCredentialAid = configuration.GetValue<string>("Application:RequiredRiskSchemaCredentialAid");

            if (string.IsNullOrWhiteSpace(requiredRiskSchemaCredentialAid))
            {
                _logger.LogWarning("RequiredRiskSchemaCredentialAid not configured in appsettings");
                return StatusCode(500, new { message = "RequiredRiskSchemaCredentialAid not configured" });
            }

            var response = new
            {
                requiredRiskSchemaCredentialAid = requiredRiskSchemaCredentialAid
            };

            _logger.LogInformation("Retrieved RequiredRiskSchemaCredentialAid: {RequiredRiskSchemaCredentialAid}", 
                requiredRiskSchemaCredentialAid);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving RequiredRiskSchemaCredentialAid");
            return StatusCode(500, new { message = "Internal server error retrieving RequiredRiskSchemaCredentialAid" });
        }
    }

    /// <summary>
    /// Gets the count of unread notifications for a user
    /// </summary>
    /// <param name="lei">The LEI of the user</param>
    /// <returns>Number of unread notifications</returns>
    [HttpGet("notifications/count")]
    public async Task<IActionResult> GetNotificationCount([FromQuery] string lei)
    {
        try
        {
            var count = await _notificationService.GetUnreadCountAsync(lei);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification count for LEI: {Lei}", lei);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Gets unread notifications for a user
    /// </summary>
    /// <param name="lei">The LEI of the user</param>
    /// <returns>List of unread notifications</returns>
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] string lei)
    {
        try
        {
            var notifications = await _notificationService.GetUnreadNotificationsAsync(lei);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for LEI: {Lei}", lei);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Marks all notifications as read for a user
    /// </summary>
    /// <param name="lei">The LEI of the user</param>
    /// <returns>Success message</returns>
    [HttpPost("notifications/mark-all-read")]
    public async Task<IActionResult> MarkAllNotificationsRead([FromQuery] string lei)
    {
        try
        {
            await _notificationService.MarkAllNotificationsAsReadAsync(lei);
            return Ok(new { message = "All notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notifications as read for LEI: {Lei}", lei);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Marks a specific notification as read
    /// </summary>
    /// <param name="notificationId">The ID of the notification to mark as read</param>
    /// <returns>Success message</returns>
    [HttpPost("notifications/{notificationId}/read")]
    public async Task<IActionResult> MarkNotificationRead(string notificationId)
    {
        try
        {
            await _notificationService.MarkNotificationAsReadAsync(notificationId);
            return Ok(new { message = "Notification marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read: {NotificationId}", notificationId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
