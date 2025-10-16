# Email Generation System

## Overview

The BFF (Backend for Frontend) includes a comprehensive email generation system that creates branded HTML emails from LLM-generated content. The system uses professional HTML templates styled to match the TrustSphere website and saves generated emails to disk for review and sending.

## Architecture

### Components

1. **Email Templates** (`EmailTemplates/` folder)
   - `StandardEmailTemplate.html` - Full-featured email with header, footer, and flexible content area
   - `NotificationEmailTemplate.html` - Simplified template for quick notifications

2. **Email Service** (`Services/EmailService.cs`)
   - Generates HTML emails from LLM text content
   - Converts plain text/markdown to formatted HTML
   - Saves emails to the `EmailOutput/` folder
   - Supports CTAs (Call-To-Action buttons)

3. **Email Controller** (`Controllers/EmailController.cs`)
   - REST API endpoints for email generation
   - List and view generated emails
   - Test and demonstration interface

4. **Email Output** (`EmailOutput/` folder)
   - Auto-created folder for storing generated HTML emails
   - Files are timestamped and uniquely named
   - Can be reviewed before sending

## Features

### 1. LLM Message to HTML Conversion

The system automatically converts LLM-generated text into professional HTML:

- **Paragraphs**: Separated by blank lines
- **Bold text**: `**bold**` → `<strong>bold</strong>`
- **Italic text**: `*italic*` → `<em>italic</em>`
- **Bullet lists**: Lines starting with `- `, `• `, or `* `
- **Numbered lists**: Lines starting with `1. `, `2. `, etc.
- **URLs**: Automatically converted to clickable links

### 2. Template Placeholders

#### Standard Email Template:
- `{{SUBJECT}}` - Email subject
- `{{EMAIL_TITLE}}` - Main heading in email body
- `{{MESSAGE_BODY}}` - LLM-generated content (auto-formatted)
- `{{CTA_SECTION}}` - Optional call-to-action button
- `{{SUPPORT_URL}}` - Support page URL
- `{{DOCS_URL}}` - Documentation URL
- `{{YEAR}}` - Current year

#### Notification Template:
- `{{SUBJECT}}` - Email subject
- `{{ICON}}` - Emoji or icon character
- `{{TITLE}}` - Notification title
- `{{MESSAGE}}` - Notification message
- `{{CTA_SECTION}}` - Optional call-to-action button
- `{{YEAR}}` - Current year

### 3. Branding

Emails are styled to match the TrustSphere brand:

- **Colors**: Dark blue header (`#1a1a2e`, `#16213e`), turquoise accents (`#3498db`)
- **Typography**: System fonts with clean, professional styling
- **Layout**: Responsive design (mobile-friendly)
- **Footer**: TrustSphere branding with links to support and documentation

## Usage

### API Endpoints

#### 1. Generate Standard Email

```http
POST /api/email/generate
Content-Type: application/json

{
  "llmMessageBody": "Your LLM-generated message here...",
  "emailTitle": "Email Heading",
  "subject": "Email Subject Line",
  "fileName": "optional_custom_name",
  "ctaText": "Click Here",
  "ctaUrl": "https://example.com/action"
}
```

**Response:**
```json
{
  "success": true,
  "filePath": "C:\\path\\to\\EmailOutput\\email_20250112_143022_abc123.html",
  "fileName": "email_20250112_143022_abc123.html",
  "message": "Email generated and saved successfully"
}
```

#### 2. Generate Notification Email

```http
POST /api/email/generate-notification
Content-Type: application/json

{
  "title": "Notification Title",
  "message": "Your notification message",
  "icon": "🔔",
  "ctaText": "View Details",
  "ctaUrl": "https://example.com/details",
  "fileName": "optional_custom_name"
}
```

#### 3. List Generated Emails

```http
GET /api/email/list
```

**Response:**
```json
{
  "files": [
    {
      "fileName": "email_20250112_143022_abc123.html",
      "fullPath": "C:\\path\\to\\EmailOutput\\email_20250112_143022_abc123.html",
      "createdAt": "2025-01-12T14:30:22",
      "size": 12458
    }
  ]
}
```

#### 4. View Generated Email

```http
GET /api/email/view/{fileName}
```

Returns the HTML content of the email (rendered in browser).

### Code Examples

#### Using IEmailService in Your Code

```csharp
public class MyService
{
    private readonly IEmailService _emailService;
    
    public MyService(IEmailService emailService)
    {
        _emailService = emailService;
    }
    
    public async Task SendWelcomeEmail(string llmResponse)
    {
        // Generate and save email
        var filePath = await _emailService.GenerateAndSaveEmailAsync(
            llmMessageBody: llmResponse,
            emailTitle: "Welcome to TrustSphere",
            subject: "Welcome - Get Started with vLEI",
            fileName: "welcome_user_12345",
            ctaText: "Complete Your Profile",
            ctaUrl: "https://trustsphere.example.com/onboarding"
        );
        
        // Email is now saved at: filePath
        // You can send it using your email provider
    }
    
    public async Task SendQuickNotification()
    {
        var filePath = await _emailService.GenerateAndSaveNotificationEmailAsync(
            title: "New Message",
            message: "You have a new message waiting in your inbox.",
            icon: "📨",
            ctaText: "View Message",
            ctaUrl: "https://trustsphere.example.com/messages/789"
        );
    }
}
```

## Testing

Use the included `email-generation.http` file to test all endpoints:

1. **Start the BFF application**:
   ```bash
   cd supplier-bff
   dotnet run
   ```

2. **Open `email-generation.http` in VS Code**

3. **Click "Send Request"** on any of the test cases

4. **View generated emails**:
   - Check the `EmailOutput/` folder
   - Use the `/api/email/view/{fileName}` endpoint to preview in browser
   - Open the HTML files directly in a browser

## Email Template Customization

### Modifying Templates

Templates are located in `EmailTemplates/`:

1. **Edit HTML structure**: Modify the template files directly
2. **Update styling**: Change CSS in the `<style>` section
3. **Add placeholders**: Use `{{PLACEHOLDER_NAME}}` format
4. **Update service**: Modify `EmailService.cs` to replace new placeholders

### Adding New Templates

1. Create a new HTML file in `EmailTemplates/`
2. Add a new method to `IEmailService` interface
3. Implement the method in `EmailService.cs`
4. Add corresponding controller endpoint if needed

## Integration with LLM Chat

The email system is designed to work seamlessly with LLM-generated content:

```csharp
// In your chat service
public async Task<string> GenerateAndEmailResponse(string userQuery)
{
    // Get LLM response
    var llmResponse = await _chatService.GetChatResponseAsync(userQuery);
    
    // Generate email from LLM response
    var emailPath = await _emailService.GenerateAndSaveEmailAsync(
        llmMessageBody: llmResponse,
        emailTitle: "Your Query Results",
        subject: "TrustSphere - Query Response",
        ctaText: "View in Portal",
        ctaUrl: "https://trustsphere.example.com/results"
    );
    
    // Optionally send the email
    var htmlContent = await File.ReadAllTextAsync(emailPath);
    await _emailService.SendHtmlEmailAsync(
        to: "user@example.com",
        subject: "TrustSphere - Query Response",
        htmlBody: htmlContent
    );
    
    return emailPath;
}
```

## File Naming Convention

Generated emails follow this naming pattern:
- **Auto-generated**: `email_YYYYMMDD_HHmmss_<guid>.html`
- **Custom filename**: `{custom_name}.html`
- **Notifications**: `notification_YYYYMMDD_HHmmss_<guid>.html`

## Folder Structure

```
supplier-bff/
├── EmailTemplates/
│   ├── StandardEmailTemplate.html
│   └── NotificationEmailTemplate.html
├── EmailOutput/
│   ├── email_20250112_143022_abc123.html
│   ├── welcome_user_12345.html
│   └── notification_20250112_150000_def456.html
├── Controllers/
│   └── EmailController.cs
├── Services/
│   ├── IEmailService.cs
│   └── EmailService.cs
└── email-generation.http
```

## Best Practices

1. **Always preview emails** before sending to users
2. **Use descriptive filenames** for important emails
3. **Include CTAs** to drive user actions
4. **Keep LLM messages concise** for better readability
5. **Test on mobile** using responsive design tools
6. **Sanitize user input** if dynamically adding content
7. **Archive generated emails** for compliance/audit purposes

## Future Enhancements

Potential improvements to consider:

- Email sending integration (SendGrid, AWS SES, etc.)
- Template versioning
- Email preview in admin dashboard
- Scheduling system for delayed sends
- Email analytics and tracking
- Multilingual template support
- A/B testing for email content
- Attachment support
- Plain text fallback generation

## Troubleshooting

### Issue: Email template not found
**Solution**: Ensure `EmailTemplates/` folder exists and contains template files

### Issue: Permission denied when saving
**Solution**: Check write permissions on `EmailOutput/` folder

### Issue: Formatting looks wrong
**Solution**: Review the `ConvertMessageToHtml` method logic for your content format

### Issue: URLs not clickable
**Solution**: Ensure URLs in LLM content start with `http://` or `https://`

## Support

For questions or issues:
- Check the test cases in `email-generation.http`
- Review the inline code documentation
- Test with simple messages first before complex formatting
