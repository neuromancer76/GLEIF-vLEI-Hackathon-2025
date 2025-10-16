using supplier_bff.Services.QueryParser.AST;

namespace supplier_bff.Services.QueryParser;

/// <summary>
/// Parser that builds an AST from tokens
/// </summary>
public class Parser
{
    private readonly List<Token> _tokens;
    private int _current;

    public Parser(List<Token> tokens)
    {
        _tokens = tokens;
        _current = 0;
    }

    public QueryNode Parse()
    {
        var query = new QueryNode();

        while (!IsAtEnd())
        {
            var token = Peek();
            
            switch (token.Type)
            {
                case TokenType.Select:
                    query.Select = ParseSelect();
                    break;
                    
                case TokenType.Where:
                    query.Where = ParseWhere();
                    break;
                    
                case TokenType.Aggregate:
                    query.Aggregate = ParseAggregate();
                    break;
                    
                case TokenType.Sort:
                    query.Sort = ParseSort();
                    break;
                    
                case TokenType.Limit:
                    query.Limit = ParseLimit();
                    break;
                    
                default:
                    Advance(); // Skip unknown tokens
                    break;
            }
        }

        return query;
    }

    private SelectNode ParseSelect()
    {
        Consume(TokenType.Select, "Expected SELECT");
        
        var select = new SelectNode();
        
        do
        {
            if (Peek().Type == TokenType.Comma)
            {
                Advance();
            }
            
            var field = Consume(TokenType.Identifier, "Expected field name").Value;
            select.Fields.Add(field);
            
        } while (Peek().Type == TokenType.Comma);

        return select;
    }

    private WhereNode ParseWhere()
    {
        Consume(TokenType.Where, "Expected WHERE");
        
        var where = new WhereNode
        {
            Expression = ParseExpression()
        };

        return where;
    }

    private ExpressionNode ParseExpression()
    {
        return ParseOrExpression();
    }

    private ExpressionNode ParseOrExpression()
    {
        var left = ParseAndExpression();

        while (Match(TokenType.Or))
        {
            var right = ParseAndExpression();
            left = new BinaryExpressionNode
            {
                Left = left,
                Operator = BinaryExpressionNode.OperatorType.Or,
                Right = right
            };
        }

        return left;
    }

    private ExpressionNode ParseAndExpression()
    {
        var left = ParsePrimaryExpression();

        while (Match(TokenType.And))
        {
            var right = ParsePrimaryExpression();
            left = new BinaryExpressionNode
            {
                Left = left,
                Operator = BinaryExpressionNode.OperatorType.And,
                Right = right
            };
        }

        return left;
    }

    private ExpressionNode ParsePrimaryExpression()
    {
        // Check for grouped expression: (expression)
        if (Match(TokenType.LeftParen))
        {
            var expression = ParseOrExpression();
            Consume(TokenType.RightParen, "Expected ')' after grouped expression");
            return expression;
        }
        
        // Parse method call: field.method(args)
        var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
        Consume(TokenType.Dot, "Expected '.'");
        var methodName = Consume(TokenType.Identifier, "Expected method name").Value;
        Consume(TokenType.LeftParen, "Expected '('");

        var arguments = new List<string>();
        
        if (Peek().Type != TokenType.RightParen)
        {
            do
            {
                if (Peek().Type == TokenType.Comma)
                {
                    Advance();
                }
                
                var arg = Peek();
                if (arg.Type == TokenType.Identifier || arg.Type == TokenType.Number)
                {
                    arguments.Add(Advance().Value);
                }
                
            } while (Peek().Type == TokenType.Comma);
        }

        Consume(TokenType.RightParen, "Expected ')'");

        return new MethodCallNode
        {
            FieldName = fieldName,
            MethodName = methodName,
            Arguments = arguments
        };
    }

    private AggregateNode ParseAggregate()
    {
        Consume(TokenType.Aggregate, "Expected AGGREGATE");
        
        var aggregate = new AggregateNode();
        aggregate.Aggregations = ParseAggregations();
        
        return aggregate;
    }

    private List<AggregationExpressionNode> ParseAggregations()
    {
        var aggregations = new List<AggregationExpressionNode>();
        
        while (Peek().Type == TokenType.Identifier)
        {
            var aggType = Peek().Value.ToLower();
            
            if (aggType == "range")
            {
                aggregations.Add(ParseRangeAggregation());
            }
            else if (aggType == "term")
            {
                aggregations.Add(ParseTermAggregation());
            }
            else if (aggType == "stats")
            {
                aggregations.Add(ParseStatsAggregation());
            }
            else if (aggType == "percentiles")
            {
                aggregations.Add(ParsePercentilesAggregation());
            }
            else
            {
                Advance(); // Skip unknown aggregation
            }
            
            // Check for comma between aggregations
            if (Peek().Type == TokenType.Comma)
            {
                Advance();
            }
        }
        
        return aggregations;
    }

    private RangeAggregationNode ParseRangeAggregation()
    {
        Advance(); // consume 'range'
        Consume(TokenType.LeftParen, "Expected '('");
        
        var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
        Consume(TokenType.Comma, "Expected ','");
        
        var ranges = ParseRanges();
        
        Consume(TokenType.RightParen, "Expected ')'");
        
        var node = new RangeAggregationNode
        {
            FieldName = fieldName,
            Ranges = ranges
        };
        
        // Check for nested aggregations
        if (Peek().Type == TokenType.LeftBrace)
        {
            Advance();
            node.NestedAggregations = ParseAggregations();
            Consume(TokenType.RightBrace, "Expected '}'");
        }
        
        return node;
    }

    private List<RangeBucket> ParseRanges()
    {
        var ranges = new List<RangeBucket>();
        
        Consume(TokenType.LeftBracket, "Expected '['");
        
        while (Peek().Type != TokenType.RightBracket)
        {
            if (Peek().Type == TokenType.Comma)
            {
                Advance();
            }
            
            Consume(TokenType.LeftBrace, "Expected '{'");
            
            var bucket = new RangeBucket();
            
            while (Peek().Type != TokenType.RightBrace)
            {
                if (Peek().Type == TokenType.Comma)
                {
                    Advance();
                }
                
                var key = Consume(TokenType.Identifier, "Expected 'from' or 'to'").Value.ToLower();
                Consume(TokenType.Colon, "Expected ':'");
                
                if (Peek().Type == TokenType.Number)
                {
                    var value = decimal.Parse(Advance().Value, System.Globalization.CultureInfo.InvariantCulture);
                    
                    if (key == "from")
                    {
                        bucket.From = value;
                    }
                    else if (key == "to")
                    {
                        bucket.To = value;
                    }
                }
            }
            
            Consume(TokenType.RightBrace, "Expected '}'");
            ranges.Add(bucket);
        }
        
        Consume(TokenType.RightBracket, "Expected ']'");
        
        return ranges;
    }

    private TermAggregationNode ParseTermAggregation()
    {
        Advance(); // consume 'term'
        Consume(TokenType.LeftParen, "Expected '('");
        
        var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
        Consume(TokenType.Comma, "Expected ','");
        var size = int.Parse(Consume(TokenType.Number, "Expected number").Value);
        
        Consume(TokenType.RightParen, "Expected ')'");
        
        var node = new TermAggregationNode
        {
            FieldName = fieldName,
            Size = size
        };
        
        // Check for nested aggregations
        if (Peek().Type == TokenType.LeftBrace)
        {
            Advance();
            node.NestedAggregations = ParseAggregations();
            Consume(TokenType.RightBrace, "Expected '}'");
        }
        
        return node;
    }

    private StatsAggregationNode ParseStatsAggregation()
    {
        Advance(); // consume 'stats'
        Consume(TokenType.LeftParen, "Expected '('");
        
        var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
        
        Consume(TokenType.RightParen, "Expected ')'");
        
        return new StatsAggregationNode
        {
            FieldName = fieldName
        };
    }

    private PercentilesAggregationNode ParsePercentilesAggregation()
    {
        Advance(); // consume 'percentiles'
        Consume(TokenType.LeftParen, "Expected '('");
        
        var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
        Consume(TokenType.Comma, "Expected ','");
        
        var percentiles = new List<double>();
        
        Consume(TokenType.LeftBracket, "Expected '['");
        
        while (Peek().Type != TokenType.RightBracket)
        {
            if (Peek().Type == TokenType.Comma)
            {
                Advance();
            }
            
            if (Peek().Type == TokenType.Number)
            {
                percentiles.Add(double.Parse(Advance().Value, System.Globalization.CultureInfo.InvariantCulture));
            }
        }
        
        Consume(TokenType.RightBracket, "Expected ']'");
        Consume(TokenType.RightParen, "Expected ')'");
        
        return new PercentilesAggregationNode
        {
            FieldName = fieldName,
            Percentiles = percentiles
        };
    }

    private SortNode ParseSort()
    {
        Consume(TokenType.Sort, "Expected SORT");
        
        var sort = new SortNode();
        
        do
        {
            if (Peek().Type == TokenType.Comma)
            {
                Advance();
            }
            
            var fieldName = Consume(TokenType.Identifier, "Expected field name").Value;
            var ascending = true;
            
            if (Peek().Type == TokenType.Asc || Peek().Type == TokenType.Desc)
            {
                ascending = Advance().Type == TokenType.Asc;
            }
            
            sort.SortFields.Add(new SortField
            {
                FieldName = fieldName,
                Ascending = ascending
            });
            
        } while (Peek().Type == TokenType.Comma);

        return sort;
    }

    private LimitNode ParseLimit()
    {
        Consume(TokenType.Limit, "Expected LIMIT");
        
        var first = int.Parse(Consume(TokenType.Number, "Expected number").Value);
        
        if (Peek().Type == TokenType.Comma)
        {
            Advance();
            var second = int.Parse(Consume(TokenType.Number, "Expected number").Value);
            
            return new LimitNode
            {
                Offset = first,
                Size = second
            };
        }
        
        return new LimitNode
        {
            Offset = 0,
            Size = first
        };
    }

    // Helper methods
    private Token Peek()
    {
        return _tokens[_current];
    }

    private Token Advance()
    {
        if (!IsAtEnd())
        {
            _current++;
        }
        return _tokens[_current - 1];
    }

    private bool Match(TokenType type)
    {
        if (Peek().Type == type)
        {
            Advance();
            return true;
        }
        return false;
    }

    private Token Consume(TokenType type, string message)
    {
        if (Peek().Type == type)
        {
            return Advance();
        }
        
        throw new Exception($"{message} at {Peek()}");
    }

    private bool IsAtEnd()
    {
        return Peek().Type == TokenType.Eof;
    }
}
