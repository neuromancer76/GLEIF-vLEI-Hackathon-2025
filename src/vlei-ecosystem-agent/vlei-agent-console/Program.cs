// Copyright (c) Microsoft. All rights reserved.

using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.Plugins.Core.CodeInterpreter;
using MyCustomMCPServer.Tools;
using System.Text;

#pragma warning disable SKEXP0050 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.

var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .Build();

// Get Azure OpenAI configuration

var azureOpenAIConfig = configuration.GetSection("AzureOpenAI");
var llmEndpoint = azureOpenAIConfig["Endpoint"];
var promptFolder = azureOpenAIConfig["PromptConfiguration"];
var llmdeploymentName = azureOpenAIConfig["DeploymentName"];
var llmapiKey = azureOpenAIConfig["ApiKey"];
var containerAppEndpoint = azureOpenAIConfig["AzureContainerEndpoint"];


// Cached token for the Azure Container Apps service
string? cachedToken = null;

// Logger for program scope
ILogger logger = NullLogger.Instance;


/// <summary>
/// Acquire a token for the Azure Container Apps service
/// </summary>
async Task<string> TokenProvider(CancellationToken cancellationToken)
{
    if (cachedToken is null)
    {
        string resource = "https://acasessions.io/.default";
        var credential = new InteractiveBrowserCredential();

        // Attempt to get the token
        var accessToken = await credential.GetTokenAsync(new Azure.Core.TokenRequestContext([resource]), cancellationToken).ConfigureAwait(false);
        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation("Access token obtained successfully");
        }
        cachedToken = accessToken.Token;
    }

    return cachedToken;
}

var settings = new SessionsPythonSettings(
        sessionId: Guid.NewGuid().ToString(),
        endpoint: new Uri(containerAppEndpoint));

Console.WriteLine("=== Code Interpreter With Azure Container Apps Plugin Demo ===\n");

Console.WriteLine("Start your conversation with the assistant. Type enter or an empty message to quit.");

var builder = Kernel.CreateBuilder();
builder.Services.AddSingleton<IAutoFunctionInvocationFilter, AutoFunctionInvocationFilter>();
builder.AddAzureOpenAIChatCompletion(
                llmdeploymentName,
                llmEndpoint,
                llmapiKey
                );

// Change the log level to Trace to see more detailed logs
//builder.Services.AddLogging(loggingBuilder => loggingBuilder.AddConsole().SetMinimumLevel(LogLevel.Information));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IConfiguration>(configuration);
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
builder.Services.AddSingleton((sp)
    => new SessionsPythonPlugin(
        settings,
        sp.GetRequiredService<IHttpClientFactory>(),
        TokenProvider,
        sp.GetRequiredService<ILoggerFactory>()));
var kernel = builder.Build();

logger = kernel.GetRequiredService<ILoggerFactory>().CreateLogger<Program>();

kernel.Plugins.AddFromObject(kernel.GetRequiredService<ApplicationRegistryAccessTool>());
kernel.Plugins.AddFromObject(kernel.GetRequiredService<CertifierRegistryTool>());
kernel.Plugins.AddFromObject(kernel.GetRequiredService<SupplierPortalTool>());

var chatCompletion = kernel.GetRequiredService<IChatCompletionService>();

var chatHistory = new ChatHistory();

StringBuilder fullAssistantContent = new();
chatHistory.AddSystemMessage("You are a business expert. You can run query given the following grammar");
foreach (var fileName in Directory.GetFiles(promptFolder, "*.md"))
    chatHistory.AddSystemMessage(File.ReadAllText(fileName));
while (true)
{
    Console.Write("\nUser: ");
    var input = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(input)) { break; }

    chatHistory.AddUserMessage(input);

    Console.WriteLine("Assistant: ");
    fullAssistantContent.Clear();
    await foreach (var content in chatCompletion.GetStreamingChatMessageContentsAsync(
        chatHistory,
        new OpenAIPromptExecutionSettings { FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() },
        kernel)
        .ConfigureAwait(false))
    {
        Console.ForegroundColor = ConsoleColor.Green;
        if (content.Metadata["Usage"] != null)
        {
            Console.WriteLine();
           Console.WriteLine($"Input token{(content.Metadata["Usage"] as OpenAI.Chat.ChatTokenUsage)?.InputTokenCount}");
            Console.WriteLine($"Output token{(content.Metadata["Usage"] as OpenAI.Chat.ChatTokenUsage)?.OutputTokenCount}");
        }
        Console.ForegroundColor = ConsoleColor.White;
        Console.Write(content.Content);
        fullAssistantContent.Append(content.Content);
    }
    chatHistory.AddAssistantMessage(fullAssistantContent.ToString());
}