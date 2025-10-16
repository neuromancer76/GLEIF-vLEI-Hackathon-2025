using Microsoft.AspNetCore.Mvc;
using supplier_bff.Services;

namespace supplier_bff.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailController> _logger;

    public EmailController(IEmailService emailService, ILogger<EmailController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Generates an HTML email from LLM-generated content and saves it to disk.
    /// </summary>
    /// <param name="request">The email generation request</param>
    /// <returns>Path to the generated email file</returns>
    [HttpPost("generate")]
    public async Task<IActionResult> GenerateEmail([FromBody] GenerateEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Generating email with title: {EmailTitle}", request.EmailTitle);

            var filePath = await _emailService.GenerateAndSaveEmailAsync(
                request.LlmMessageBody,
                request.EmailTitle,
                request.Subject,
                request.FileName,
                request.CtaText,
                request.CtaUrl);

            return Ok(new
            {
                success = true,
                filePath = filePath,
                fileName = Path.GetFileName(filePath),
                message = "Email generated and saved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate email");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to generate email",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Generates a notification email and saves it to disk.
    /// </summary>
    /// <param name="request">The notification email request</param>
    /// <returns>Path to the generated email file</returns>
    [HttpPost("generate-notification")]
    public async Task<IActionResult> GenerateNotificationEmail([FromBody] GenerateNotificationEmailRequest request)
    {
        try
        {
            _logger.LogInformation("Generating notification email: {Title}", request.Title);

            var filePath = await _emailService.GenerateAndSaveNotificationEmailAsync(
                request.Title,
                request.Message,
                request.Icon ?? "📧",
                request.CtaText,
                request.CtaUrl,
                request.FileName);

            return Ok(new
            {
                success = true,
                filePath = filePath,
                fileName = Path.GetFileName(filePath),
                message = "Notification email generated and saved successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate notification email");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to generate notification email",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Lists all generated emails in the EmailOutput folder.
    /// </summary>
    /// <returns>List of generated email files</returns>
    [HttpGet("list")]
    public IActionResult ListGeneratedEmails()
    {
        try
        {
            var emailOutputPath = Path.Combine(Directory.GetCurrentDirectory(), "EmailOutput");
            
            if (!Directory.Exists(emailOutputPath))
            {
                return Ok(new { files = Array.Empty<string>() });
            }

            var files = Directory.GetFiles(emailOutputPath, "*.html")
                .Select(f => new
                {
                    fileName = Path.GetFileName(f),
                    fullPath = f,
                    createdAt = System.IO.File.GetCreationTime(f),
                    size = new FileInfo(f).Length
                })
                .OrderByDescending(f => f.createdAt)
                .ToList();

            return Ok(new { files });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list generated emails");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to list generated emails",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// Retrieves the content of a generated email file.
    /// </summary>
    /// <param name="fileName">Name of the email file</param>
    /// <returns>HTML content of the email</returns>
    [HttpGet("view/{fileName}")]
    public async Task<IActionResult> ViewGeneratedEmail(string fileName)
    {
        try
        {
            var emailOutputPath = Path.Combine(Directory.GetCurrentDirectory(), "EmailOutput");
            var filePath = Path.Combine(emailOutputPath, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Email file not found" });
            }

            var content = await System.IO.File.ReadAllTextAsync(filePath);
            return Content(content, "text/html");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to view generated email");
            return StatusCode(500, new
            {
                success = false,
                message = "Failed to view generated email",
                error = ex.Message
            });
        }
    }
}

/// <summary>
/// Request model for generating an email from LLM content.
/// </summary>
public class GenerateEmailRequest
{
    /// <summary>
    /// The message content generated by the LLM (can be plain text or markdown-style).
    /// </summary>
    public required string LlmMessageBody { get; set; }

    /// <summary>
    /// The title/heading displayed in the email.
    /// </summary>
    public required string EmailTitle { get; set; }

    /// <summary>
    /// The email subject line.
    /// </summary>
    public required string Subject { get; set; }

    /// <summary>
    /// Optional custom filename (without extension).
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// Optional call-to-action button text.
    /// </summary>
    public string? CtaText { get; set; }

    /// <summary>
    /// Optional call-to-action button URL.
    /// </summary>
    public string? CtaUrl { get; set; }
}

/// <summary>
/// Request model for generating a notification email.
/// </summary>
public class GenerateNotificationEmailRequest
{
    /// <summary>
    /// Notification title.
    /// </summary>
    public required string Title { get; set; }

    /// <summary>
    /// Notification message.
    /// </summary>
    public required string Message { get; set; }

    /// <summary>
    /// Emoji or icon character (default: 📧).
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Optional call-to-action button text.
    /// </summary>
    public string? CtaText { get; set; }

    /// <summary>
    /// Optional call-to-action button URL.
    /// </summary>
    public string? CtaUrl { get; set; }

    /// <summary>
    /// Optional custom filename (without extension).
    /// </summary>
    public string? FileName { get; set; }
}
