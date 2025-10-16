using System.Text;

namespace supplier_bff.Services.QueryParser;

/// <summary>
/// Lexer that tokenizes DSL query strings
/// </summary>
public class Lexer
{
    private readonly string _input;
    private int _position;
    private int _line;
    private int _column;
    private char _currentChar;

    private static readonly Dictionary<string, TokenType> _keywords = new(StringComparer.OrdinalIgnoreCase)
    {
        { "WHERE", TokenType.Where },
        { "SELECT", TokenType.Select },
        { "AGGREGATE", TokenType.Aggregate },
        { "SORT", TokenType.Sort },
        { "LIMIT", TokenType.Limit },
        { "AND", TokenType.And },
        { "OR", TokenType.Or },
        { "ASC", TokenType.Asc },
        { "DESC", TokenType.Desc }
    };

    public Lexer(string input)
    {
        _input = input ?? string.Empty;
        _position = 0;
        _line = 1;
        _column = 1;
        _currentChar = _position < _input.Length ? _input[_position] : '\0';
    }

    public List<Token> Tokenize()
    {
        var tokens = new List<Token>();
        
        while (_currentChar != '\0')
        {
            if (char.IsWhiteSpace(_currentChar))
            {
                SkipWhitespace();
                continue;
            }

            if (char.IsLetter(_currentChar) || _currentChar == '_')
            {
                tokens.Add(ReadIdentifierOrKeyword());
                continue;
            }

            if (char.IsDigit(_currentChar))
            {
                tokens.Add(ReadNumber());
                continue;
            }

            // Single character tokens
            var token = _currentChar switch
            {
                '(' => CreateToken(TokenType.LeftParen, "("),
                ')' => CreateToken(TokenType.RightParen, ")"),
                '{' => CreateToken(TokenType.LeftBrace, "{"),
                '}' => CreateToken(TokenType.RightBrace, "}"),
                '[' => CreateToken(TokenType.LeftBracket, "["),
                ']' => CreateToken(TokenType.RightBracket, "]"),
                ',' => CreateToken(TokenType.Comma, ","),
                '.' => CreateToken(TokenType.Dot, "."),
                ':' => CreateToken(TokenType.Colon, ":"),
                _ => null
            };

            if (token != null)
            {
                tokens.Add(token);
                Advance();
                continue;
            }

            // Unknown character
            tokens.Add(CreateToken(TokenType.Unknown, _currentChar.ToString()));
            Advance();
        }

        tokens.Add(new Token(TokenType.Eof, "", _position, _line, _column));
        return tokens;
    }

    private void SkipWhitespace()
    {
        while (_currentChar != '\0' && char.IsWhiteSpace(_currentChar))
        {
            Advance();
        }
    }

    private Token ReadIdentifierOrKeyword()
    {
        var startPosition = _position;
        var startLine = _line;
        var startColumn = _column;
        var sb = new StringBuilder();

        while (_currentChar != '\0' && (char.IsLetterOrDigit(_currentChar) || _currentChar == '_'))
        {
            sb.Append(_currentChar);
            Advance();
        }

        var value = sb.ToString();
        var type = _keywords.TryGetValue(value, out var keywordType) 
            ? keywordType 
            : TokenType.Identifier;

        return new Token(type, value, startPosition, startLine, startColumn);
    }

    private Token ReadNumber()
    {
        var startPosition = _position;
        var startLine = _line;
        var startColumn = _column;
        var sb = new StringBuilder();

        while (_currentChar != '\0' && (char.IsDigit(_currentChar) || _currentChar == '.'))
        {
            sb.Append(_currentChar);
            Advance();
        }

        return new Token(TokenType.Number, sb.ToString(), startPosition, startLine, startColumn);
    }

    private Token CreateToken(TokenType type, string value)
    {
        return new Token(type, value, _position, _line, _column);
    }

    private void Advance()
    {
        if (_currentChar == '\n')
        {
            _line++;
            _column = 1;
        }
        else
        {
            _column++;
        }

        _position++;
        _currentChar = _position < _input.Length ? _input[_position] : '\0';
    }
}
