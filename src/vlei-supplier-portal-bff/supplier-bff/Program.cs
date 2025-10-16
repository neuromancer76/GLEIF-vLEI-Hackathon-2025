using supplier_bff.Middleware;
using supplier_bff.Repositories;
using supplier_bff.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add health checks
builder.Services.AddHealthChecks();

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalhostAllPorts", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return false;
            
            try
            {
                var uri = new Uri(origin);
                // Allow localhost, 127.0.0.1, and IPv6 loopback on any port
                return uri.Host == "localhost" || 
                       uri.Host == "127.0.0.1" || 
                       uri.Host == "::1" ||
                       uri.Host.StartsWith("localhost:");
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo 
    { 
        Title = "Supplier BFF API", 
        Version = "v1",
        Description = "Backend for Frontend API for managing supplier requests and procurement processes"
    });
    
    // Include XML comments
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});

// Add HttpClient services
builder.Services.AddHttpClient();

// Register application services
// DO NOT MODIFY this scope
builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();

// Register Italian Company Repository
builder.Services.AddSingleton<IItalianCompanyRepository, InMemoryItalianCompanyRepository>();

// Register Login Session Repository
builder.Services.AddSingleton<ILoginSessionRepository, InMemoryLoginSessionRepository>();

builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Register GLEIF API service
builder.Services.AddScoped<IGleifService, GleifService>();

// Register VLEI Grant API service
builder.Services.AddScoped<IVleiGrantService, VleiGrantService>();

// Register signify validation services
builder.Services.AddScoped<ISignifyValidationRepository, MockSignifyValidationRepository>();
builder.Services.AddScoped<ISignifyValidationService, SignifyValidationService>();

// Register request-scoped context service
builder.Services.AddScoped<RequestContextService>();

// Register notification service as singleton to persist notifications in memory
builder.Services.AddSingleton<INotificationService, NotificationService>();

// Add logging
builder.Services.AddLogging();

var app = builder.Build();

// Initialize Italian Company Repository
var italianCompanyRepo = app.Services.GetRequiredService<IItalianCompanyRepository>();
await italianCompanyRepo.LoadDataAsync();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Supplier BFF API V1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the app's root
    });
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("LocalhostAllPorts");

// Add our custom header middleware
app.UseMiddleware<HeaderMiddleware>();

// Map health check endpoint
app.MapHealthChecks("/health");

// Map controllers
app.MapControllers();

app.Run();
