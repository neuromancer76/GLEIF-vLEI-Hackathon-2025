using supplier_bff.Models;
using supplier_bff.Services.QueryParser;
using supplier_bff.Services.QueryParser.AST;

namespace supplier_bff.Services;

/// <summary>
/// Result object containing both filtered data and aggregations
/// </summary>
public class QueryResult<T>
{
    public List<T> Data { get; set; } = new();
    public Dictionary<string, object> Aggregations { get; set; } = new();
    public int TotalCount { get; set; }
}

/// <summary>
/// DSL Query Engine using Tokenizer-Lexer-Parser-Visitor pattern
/// Architecture:
/// 1. Lexer: Tokenizes the query string into a sequence of tokens
/// 2. Parser: Builds an Abstract Syntax Tree (AST) from tokens
/// 3. Visitor: Executes the query by traversing the AST
/// 
/// This architecture provides:
/// - Clear separation of concerns (tokenization, parsing, execution)
/// - Extensibility (easy to add new operations or optimizations)
/// - Maintainability (each component has a single responsibility)
/// - Testability (each component can be tested independently)
/// </summary>
public class CompanyQueryEngine
{
    private readonly List<ItalianCompany> _allData;

    public CompanyQueryEngine(List<ItalianCompany> data)
    {
        _allData = data;
    }

    /// <summary>
    /// Executes a DSL query using the Lexer -> Parser -> Visitor pipeline
    /// </summary>
    /// <param name="query">DSL query string (e.g., "WHERE employees.greaterThan(100) SORT name ASC")</param>
    /// <returns>Query result containing filtered data, aggregations, and total count</returns>
    public QueryResult<ItalianCompany> Execute(string query)
    {
        // Step 1: Tokenize - Convert query string into tokens
        var lexer = new Lexer(query);
        var tokens = lexer.Tokenize();

        // Step 2: Parse - Build Abstract Syntax Tree from tokens
        var parser = new Parser(tokens);
        var ast = parser.Parse();

        // Step 3: Execute - Traverse AST using Visitor pattern
        var visitor = new QueryExecutionVisitor(_allData);
        ast.Accept(visitor);

        // Step 4: Return results
        return new QueryResult<ItalianCompany>
        {
            Data = visitor.ResultData,
            Aggregations = visitor.Aggregations,
            TotalCount = visitor.TotalCount
        };
    }
}
