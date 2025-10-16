using VleiRegistry.Models;
using VleiRegistry.Repositories;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add health checks
builder.Services.AddHealthChecks();

// Add API Explorer and Swagger/OpenAPI support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "VLEI Registry API",
        Version = "v1",
        Description = "A REST API for managing VLEI application and certifier registry entries with in-memory storage",
        Contact = new OpenApiContact
        {
            Name = "VLEI Registry Team"
        }
    });
    
    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Register the in-memory repositories as singletons to maintain data across requests
builder.Services.AddSingleton<InMemoryApplicationRepository>();
builder.Services.AddSingleton<IApplicationRepository>(provider => provider.GetService<InMemoryApplicationRepository>()!);

builder.Services.AddSingleton<InMemoryCertifierRepository>();
builder.Services.AddSingleton<ICertifierRepository>(provider => provider.GetService<InMemoryCertifierRepository>()!);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "VLEI Registry API v1");
        c.RoutePrefix = "swagger";
    });
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Map health check endpoint
app.MapHealthChecks("/health");

// Map controllers
app.MapControllers();

// Initialize the repositories with data from configuration
InitializeRepositories(app.Services, app.Configuration);

app.Run();

static void InitializeRepositories(IServiceProvider services, IConfiguration configuration)
{
    using var scope = services.CreateScope();
    
    // Initialize Application Repository
    var applicationRepository = scope.ServiceProvider.GetRequiredService<InMemoryApplicationRepository>();
    var applicationData = configuration.GetSection("ApplicationData").Get<Application[]>();
    
    if (applicationData != null && applicationData.Length > 0)
    {
        applicationRepository.SeedData(applicationData);
        Console.WriteLine($"Initialized application repository with {applicationData.Length} applications");
    }
    else
    {
        Console.WriteLine("No application data found in configuration");
    }
    
    // Initialize Certifier Repository
    var certifierRepository = scope.ServiceProvider.GetRequiredService<InMemoryCertifierRepository>();
    var certifierData = configuration.GetSection("CertifierData").Get<Certifier[]>();
    
    if (certifierData != null && certifierData.Length > 0)
    {
        certifierRepository.SeedData(certifierData);
        Console.WriteLine($"Initialized certifier repository with {certifierData.Length} certifiers");
    }
    else
    {
        Console.WriteLine("No certifier data found in configuration");
    }
}
