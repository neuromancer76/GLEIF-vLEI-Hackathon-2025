using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using MyCustomMCPServer.Tools;
using vlei_chatbot_api;
using vlei_chatbot_api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Add health checks
builder.Services.AddHealthChecks();

// NOTE: HttpContextAccessor and PendingActionService will be registered later
// as shared instances between the main app and Semantic Kernel

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:*", 
                "http://localhost:3000", 
                "https://localhost:3000",
                "http://localhost:5173",  // Vite dev server
                "https://localhost:5173", // Vite dev server (HTTPS)
                "http://localhost:4173",  // Vite preview server
                "https://localhost:4173") // Vite preview server (HTTPS)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Get Azure OpenAI configuration
var azureOpenAIConfig = builder.Configuration.GetSection("AzureOpenAI");
var llmEndpoint = azureOpenAIConfig["Endpoint"];
var llmdeploymentName = azureOpenAIConfig["DeploymentName"];
var llmapiKey = azureOpenAIConfig["ApiKey"];

// Configure Semantic Kernel
var kernelBuilder = Kernel.CreateBuilder();

// CRITICAL FIX: Register shared services in kernel's service collection
// The kernel has its own DI container, so we need to register the same singletons
var httpContextAccessor = new HttpContextAccessor();

kernelBuilder.Services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);

// Add logging to kernel's service collection
kernelBuilder.Services.AddLogging();

// Also register them in the main app's service collection (replace existing registrations)
// Note: We'll use the SAME instances to ensure they're shared
builder.Services.AddSingleton<IHttpContextAccessor>(httpContextAccessor);

// Note: AutoFunctionInvocationFilter will be registered using service locator pattern
// because it needs IHttpContextAccessor which is registered in DI
kernelBuilder.Services.AddSingleton<IAutoFunctionInvocationFilter>(sp =>
{
    // Now we can safely use 'sp' because the services are registered in kernel's DI
    var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger<AutoFunctionInvocationFilter>();
    return new AutoFunctionInvocationFilter(httpContextAccessor, logger);
});

kernelBuilder.AddAzureOpenAIChatCompletion(
    llmdeploymentName!,
    llmEndpoint!,
    llmapiKey!
);

// Add HTTP client and tools
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);

// Register tools
builder.Services.AddSingleton<ApplicationRegistryAccessTool>(sp => 
    new ApplicationRegistryAccessTool(
        sp.GetRequiredService<IHttpClientFactory>().CreateClient(),
        sp.GetRequiredService<IConfiguration>()));

builder.Services.AddSingleton<CertifierRegistryTool>(sp => 
    new CertifierRegistryTool(
        sp.GetRequiredService<IHttpClientFactory>().CreateClient(),
        sp.GetRequiredService<IConfiguration>()));

builder.Services.AddSingleton<SupplierPortalTool>(sp =>
    new SupplierPortalTool(
        sp.GetRequiredService<IHttpClientFactory>().CreateClient(),
        sp.GetRequiredService<IConfiguration>()));

builder.Services.AddSingleton<ConversationTopicTool>(sp => 
    new ConversationTopicTool());

// Build and register kernel
var kernel = kernelBuilder.Build();
kernel.Plugins.AddFromObject(new ApplicationRegistryAccessTool(
    new HttpClient(), builder.Configuration));
kernel.Plugins.AddFromObject(new CertifierRegistryTool(
    new HttpClient(), builder.Configuration));
kernel.Plugins.AddFromObject(new SupplierPortalTool(
    new HttpClient(), builder.Configuration));
// Register conversation-topic tool for multi-topic threading
kernel.Plugins.AddFromObject(new ConversationTopicTool());

builder.Services.AddSingleton(kernel);
builder.Services.AddSingleton<IChatCompletionService>(sp => 
    sp.GetRequiredService<Kernel>().GetRequiredService<IChatCompletionService>());

// Register chat service as Singleton to maintain conversation state across requests
// CRITICAL: Must be Singleton because it stores _conversations dictionary in memory
builder.Services.AddSingleton<IChatService, ChatService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// IMPORTANT: UseCors MUST come BEFORE UseHttpsRedirection and UseAuthorization
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthorization();

// Map health check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

app.Run();
