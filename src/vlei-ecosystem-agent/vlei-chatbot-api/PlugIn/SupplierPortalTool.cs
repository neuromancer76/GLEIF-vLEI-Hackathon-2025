using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace MyCustomMCPServer.Tools;

public class SupplierPortalTool
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public SupplierPortalTool(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _baseUrl = configuration["SupplierPortal:BaseUrl"] ?? "https://localhost:7043";
    }

    [KernelFunction("supplier-search-italian-companies")]
    [Description("Search Italian companies using DSL query. Supports complex queries with WHERE clauses, aggregations, sorting, and limits. Example: 'WHERE number_of_employees.greaterThan(100) AND credit_limit.greaterThan(100000) SORT credit_limit DESC LIMIT 10'")]
    public async Task<string> SearchItalianCompaniesAsync(
        [Description("The DSL query string to search for Italian companies. Use syntax like: WHERE field.operation(value) AND/OR other_conditions SORT field ASC/DESC LIMIT number")] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return "Error: Query is required";
            }

            var searchRequest = new
            {
                query = query
            };

            var json = JsonSerializer.Serialize(searchRequest);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/ItalianCompanies/search", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return responseContent;
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error searching Italian companies: {ex.Message}";
        }
    }

    [KernelFunction("supplier-create-request")]
    [Description("Creates a new supplier request with order details, requester information, and candidate suppliers")]
    public async Task<string> CreateSupplierRequestAsync(
        [Description("The order ID")] string orderId,
        [Description("The order description")] string description,
        [Description("The total amount")] string totalAmount,
        [Description("Requester prefix")] string requesterPrefix,
        [Description("Requester LEI (Legal Entity Identifier)")] string requesterLei,
        [Description("Requester OOBI")] string requesterOobi,
        [Description("Candidate suppliers as JSON array with lei, supplierEmail, and applied fields. Example: '[{\"lei\":\"123\",\"supplierEmail\":\"supplier@example.com\",\"applied\":false}]'")] string candidatesJson = "[]")
    {
        try
        {
            if (string.IsNullOrWhiteSpace(orderId))
            {
                return "Error: Order ID is required";
            }

            // Parse candidates JSON
            var candidates = new List<object>();
            if (!string.IsNullOrWhiteSpace(candidatesJson))
            {
                try
                {
                    candidates = JsonSerializer.Deserialize<List<object>>(candidatesJson) ?? new List<object>();
                }
                catch (JsonException)
                {
                    return "Error: Invalid candidates JSON format";
                }
            }

            var supplierRequest = new
            {
                orderDetails = new
                {
                    orderId,
                    description,
                    totalAmount,
                    requester = new
                    {
                        prefix = requesterPrefix,
                        lei = requesterLei,
                        oobi = requesterOobi
                    },
                    candidates,
                    createdAt = DateTime.UtcNow
                }
            };

            var json = JsonSerializer.Serialize(supplierRequest);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/Supplier/create-request", content);
            
            if (response.IsSuccessStatusCode)
            {
                return "Supplier request created successfully";
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                return "Error: Order ID already exists or creation failed";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error creating supplier request: {ex.Message}";
        }
    }

    [KernelFunction("supplier-send-invitation")]
    [Description("Sends a professional HTML invitation email to a supplier with a link to apply to the request. The email will be generated from your message using TrustSphere branding and saved for review.")]
    public async Task<string> SendSupplierInvitationAsync(
        [Description("The order ID for the supplier request")] string orderId,
        [Description("The email body content - write a professional, personalized invitation message explaining the opportunity. This will be converted to a branded HTML email with a 'Apply to This Request' button automatically added.")] string body,
        [Description("The supplier's email address")] string supplierEmail,
        [Description("The supplier's Legal Entity Identifier (LEI)")] string supplierLei)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(orderId))
            {
                return "Error: Order ID is required";
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                return "Error: Email body is required. Please provide a professional invitation message for the supplier.";
            }

            if (string.IsNullOrWhiteSpace(supplierEmail))
            {
                return "Error: Supplier email is required";
            }

            if (string.IsNullOrWhiteSpace(supplierLei))
            {
                return "Error: Supplier LEI is required";
            }

            var invitation = new
            {
                orderId,
                body,
                supplierEmail,
                supplierLei
            };

            var json = JsonSerializer.Serialize(invitation);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/Supplier/send-invitation", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                
                // Extract information from response
                var applyLink = result.GetProperty("applyLink").GetString();
                var emailFileName = result.GetProperty("emailFileName").GetString();
                
                return $"✅ Invitation sent successfully to {supplierEmail}!\n\n" +
                       $"📧 A professional HTML email has been generated and sent.\n" +
                       $"📁 Email saved as: {emailFileName}\n" +
                       $"🔗 Apply link: {applyLink}\n\n" +
                       $"The supplier will receive a branded TrustSphere email with your message and a prominent 'Apply to This Request' button.";
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.BadRequest)
            {
                return "Error: Failed to send invitation. The order may not exist or there was a validation error.";
            }
            else
            {
                return $"Error: HTTP {response.StatusCode} - {response.ReasonPhrase}";
            }
        }
        catch (Exception ex)
        {
            return $"Error sending supplier invitation: {ex.Message}";
        }
    }
}