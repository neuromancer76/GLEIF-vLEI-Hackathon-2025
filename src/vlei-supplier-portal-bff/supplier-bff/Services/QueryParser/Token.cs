namespace supplier_bff.Services.QueryParser;

/// <summary>
/// Represents the type of token in the DSL
/// </summary>
public enum TokenType
{
    // Keywords
    Where,
    Select,
    Aggregate,
    Sort,
    Limit,
    And,
    Or,
    Asc,
    Desc,
    
    // Identifiers and Literals
    Identifier,      // field names, method names
    Number,          // numeric literals
    String,          // string literals
    
    // Delimiters
    LeftParen,       // (
    RightParen,      // )
    LeftBrace,       // {
    RightBrace,      // }
    LeftBracket,     // [
    RightBracket,    // ]
    Comma,           // ,
    Dot,             // .
    Colon,           // :
    
    // Special
    Eof,             // End of input
    Unknown
}

/// <summary>
/// Represents a token in the DSL query
/// </summary>
public class Token
{
    public TokenType Type { get; }
    public string Value { get; }
    public int Position { get; }
    public int Line { get; }
    public int Column { get; }

    public Token(TokenType type, string value, int position, int line, int column)
    {
        Type = type;
        Value = value;
        Position = position;
        Line = line;
        Column = column;
    }

    public override string ToString()
    {
        return $"{Type}('{Value}') at {Line}:{Column}";
    }
}
