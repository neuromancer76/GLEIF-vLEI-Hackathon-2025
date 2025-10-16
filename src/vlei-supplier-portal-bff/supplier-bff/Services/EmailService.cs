using System.Web;
using System.Text;

namespace supplier_bff.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly string _emailOutputPath;
    private readonly string _templatePath;

    public EmailService(
        ILogger<EmailService> logger, 
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
        
        // Setup paths for email templates and output
        _templatePath = Path.Combine(_environment.ContentRootPath, "EmailTemplates");
        _emailOutputPath = Path.Combine(_environment.ContentRootPath, "EmailOutput");
        
        // Ensure output directory exists
        if (!Directory.Exists(_emailOutputPath))
        {
            Directory.CreateDirectory(_emailOutputPath);
            _logger.LogInformation("Created EmailOutput directory at {Path}", _emailOutputPath);
        }
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            // This is a mock implementation
            // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
            
            _logger.LogInformation("Sending email to: {ToEmail}", to);
            _logger.LogInformation("Subject: {Subject}", subject);
            _logger.LogInformation("Body: {Body}", body);
            
            // Simulate email sending delay
            await Task.Delay(100);
            
            // For demonstration purposes, assume email is always sent successfully
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}", to);
            return false;
        }
    }

    public async Task<bool> SendHtmlEmailAsync(string to, string subject, string htmlBody)
    {
        try
        {
            _logger.LogInformation("Sending HTML email to: {ToEmail}", to);
            _logger.LogInformation("Subject: {Subject}", subject);
            
            // In a real implementation, you would use an email service that supports HTML
            // For now, we'll just log and save the email
            await Task.Delay(100);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send HTML email to {ToEmail}", to);
            return false;
        }
    }

    public string GenerateApplyLink(string orderId, string lei, string baseUrl)
    {
        var encodedOrderId = HttpUtility.UrlEncode(orderId);
        var encodedLei = HttpUtility.UrlEncode(lei);
        
        return $"http://localhost:5173/supplier?orderId={encodedOrderId}&lei={encodedLei}";
    }

    public async Task<string> GenerateHtmlEmailFromLlmMessageAsync(
        string llmMessageBody,
        string emailTitle,
        string subject,
        string? ctaText = null,
        string? ctaUrl = null)
    {
        try
        {
            // Read the template file
            var templatePath = Path.Combine(_templatePath, "StandardEmailTemplate.html");
            
            if (!File.Exists(templatePath))
            {
                _logger.LogError("Email template not found at {TemplatePath}", templatePath);
                throw new FileNotFoundException("Email template not found", templatePath);
            }

            var template = await File.ReadAllTextAsync(templatePath);
            
            // Process the LLM message body to convert plain text to HTML paragraphs
            var htmlMessageBody = ConvertMessageToHtml(llmMessageBody);
            
            // Generate CTA section if provided
            var ctaSection = string.Empty;
            if (!string.IsNullOrEmpty(ctaText) && !string.IsNullOrEmpty(ctaUrl))
            {
                ctaSection = $@"
                <div style=""text-align: center; margin: 30px 0;"">
                    <a href=""{ctaUrl}"" class=""cta-button"">{ctaText}</a>
                </div>";
            }
            
            // Replace placeholders
            var htmlEmail = template
                .Replace("{{SUBJECT}}", subject)
                .Replace("{{EMAIL_TITLE}}", emailTitle)
                .Replace("{{MESSAGE_BODY}}", htmlMessageBody)
                .Replace("{{CTA_SECTION}}", ctaSection)
                .Replace("{{SUPPORT_URL}}", "https://www.gleif.org/en/contact/contact-information")
                .Replace("{{DOCS_URL}}", "https://www.gleif.org/en/organizational-identity/introducing-the-legal-entity-identifier-lei")
                .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
            
            _logger.LogInformation("Generated HTML email with title: {EmailTitle}", emailTitle);
            
            return htmlEmail;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate HTML email from LLM message");
            throw;
        }
    }

    public async Task<string> GenerateAndSaveEmailAsync(
        string llmMessageBody,
        string emailTitle,
        string subject,
        string? fileName = null,
        string? ctaText = null,
        string? ctaUrl = null)
    {
        try
        {
            // Generate the HTML email
            var htmlEmail = await GenerateHtmlEmailFromLlmMessageAsync(
                llmMessageBody,
                emailTitle,
                subject,
                ctaText,
                ctaUrl);
            
            // Generate filename if not provided
            if (string.IsNullOrEmpty(fileName))
            {
                fileName = $"email_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";
            }
            
            // Ensure filename has .html extension
            if (!fileName.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            {
                fileName += ".html";
            }
            
            // Save to file
            var filePath = Path.Combine(_emailOutputPath, fileName);
            await File.WriteAllTextAsync(filePath, htmlEmail);
            
            _logger.LogInformation("Email saved to {FilePath}", filePath);
            
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate and save email");
            throw;
        }
    }

    public async Task<string> GenerateAndSaveNotificationEmailAsync(
        string title,
        string message,
        string icon = "📧",
        string? ctaText = null,
        string? ctaUrl = null,
        string? fileName = null)
    {
        try
        {
            // Read the notification template file
            var templatePath = Path.Combine(_templatePath, "NotificationEmailTemplate.html");
            
            if (!File.Exists(templatePath))
            {
                _logger.LogError("Notification email template not found at {TemplatePath}", templatePath);
                throw new FileNotFoundException("Notification email template not found", templatePath);
            }

            var template = await File.ReadAllTextAsync(templatePath);
            
            // Generate CTA section if provided
            var ctaSection = string.Empty;
            if (!string.IsNullOrEmpty(ctaText) && !string.IsNullOrEmpty(ctaUrl))
            {
                ctaSection = $@"<a href=""{ctaUrl}"" class=""cta-button"">{ctaText}</a>";
            }
            
            // Replace placeholders
            var htmlEmail = template
                .Replace("{{SUBJECT}}", title)
                .Replace("{{ICON}}", icon)
                .Replace("{{TITLE}}", title)
                .Replace("{{MESSAGE}}", message)
                .Replace("{{CTA_SECTION}}", ctaSection)
                .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
            
            // Generate filename if not provided
            if (string.IsNullOrEmpty(fileName))
            {
                fileName = $"notification_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";
            }
            
            // Ensure filename has .html extension
            if (!fileName.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            {
                fileName += ".html";
            }
            
            // Save to file
            var filePath = Path.Combine(_emailOutputPath, fileName);
            await File.WriteAllTextAsync(filePath, htmlEmail);
            
            _logger.LogInformation("Notification email saved to {FilePath}", filePath);
            
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate and save notification email");
            throw;
        }
    }

    /// <summary>
    /// Converts a plain text or markdown-style message to HTML.
    /// Handles paragraphs, lists, and basic formatting.
    /// </summary>
    private string ConvertMessageToHtml(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        var html = new StringBuilder();
        var lines = message.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        var inList = false;
        var currentParagraph = new StringBuilder();

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // Handle empty lines (paragraph breaks)
            if (string.IsNullOrWhiteSpace(trimmedLine))
            {
                if (currentParagraph.Length > 0)
                {
                    html.AppendLine($"<p>{currentParagraph}</p>");
                    currentParagraph.Clear();
                }
                
                if (inList)
                {
                    html.AppendLine("</ul>");
                    inList = false;
                }
                continue;
            }
            
            // Handle bullet points
            if (trimmedLine.StartsWith("- ") || trimmedLine.StartsWith("• ") || trimmedLine.StartsWith("* "))
            {
                if (currentParagraph.Length > 0)
                {
                    html.AppendLine($"<p>{currentParagraph}</p>");
                    currentParagraph.Clear();
                }
                
                if (!inList)
                {
                    html.AppendLine("<ul>");
                    inList = true;
                }
                
                var listItem = trimmedLine.Substring(2).Trim();
                html.AppendLine($"<li>{FormatInlineText(listItem)}</li>");
            }
            // Handle numbered lists
            else if (System.Text.RegularExpressions.Regex.IsMatch(trimmedLine, @"^\d+\.\s"))
            {
                if (currentParagraph.Length > 0)
                {
                    html.AppendLine($"<p>{currentParagraph}</p>");
                    currentParagraph.Clear();
                }
                
                if (!inList)
                {
                    html.AppendLine("<ol>");
                    inList = true;
                }
                
                var listItem = System.Text.RegularExpressions.Regex.Replace(trimmedLine, @"^\d+\.\s", "");
                html.AppendLine($"<li>{FormatInlineText(listItem)}</li>");
            }
            // Regular paragraph text
            else
            {
                if (inList)
                {
                    html.AppendLine(inList ? "</ul>" : "</ol>");
                    inList = false;
                }
                
                if (currentParagraph.Length > 0)
                {
                    currentParagraph.Append(" ");
                }
                currentParagraph.Append(FormatInlineText(trimmedLine));
            }
        }
        
        // Close any open elements
        if (currentParagraph.Length > 0)
        {
            html.AppendLine($"<p>{currentParagraph}</p>");
        }
        
        if (inList)
        {
            html.AppendLine("</ul>");
        }
        
        return html.ToString();
    }

    /// <summary>
    /// Formats inline text elements like bold, italic, and links.
    /// </summary>
    private string FormatInlineText(string text)
    {
        // Convert **bold** to <strong>
        text = System.Text.RegularExpressions.Regex.Replace(
            text, 
            @"\*\*(.*?)\*\*", 
            "<strong>$1</strong>");
        
        // Convert *italic* to <em>
        text = System.Text.RegularExpressions.Regex.Replace(
            text, 
            @"\*(.*?)\*", 
            "<em>$1</em>");
        
        // Convert URLs to links (basic pattern)
        text = System.Text.RegularExpressions.Regex.Replace(
            text,
            @"(https?://[^\s]+)",
            "<a href=\"$1\">$1</a>");
        
        return text;
    }
}