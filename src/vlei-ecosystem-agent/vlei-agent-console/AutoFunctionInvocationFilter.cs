using Microsoft.SemanticKernel;

internal class AutoFunctionInvocationFilter : IAutoFunctionInvocationFilter
{
    public async Task OnAutoFunctionInvocationAsync(AutoFunctionInvocationContext context, Func<AutoFunctionInvocationContext, Task> next)
    {
        try
        {
            Console.WriteLine($"AutoFunctionInvocationFilter: Function '{context.Function.Name}' is being invoked.");
            await next(context);

            // Crete the result with the schema
            FunctionResultWithSchema resultWithSchema = new()
            {
                Value = context.Result.GetValue<object>(),                  // Get the original result
                Schema = context.Function.Metadata.ReturnParameter?.Schema  // Get the function return type schema
            };

            // Return the result with the schema instead of the original one
            context.Result = new FunctionResult(context.Result, resultWithSchema);
        }
        catch(Exception ex)
        {
            Console.WriteLine($"Error in AutoFunctionInvocationFilter: {ex.Message}");
        }
    }

    private sealed class FunctionResultWithSchema
    {
        public object? Value { get; set; }
        public KernelJsonSchema? Schema { get; set; }
    }
}