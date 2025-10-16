namespace supplier_bff.Services.QueryParser.AST;

/// <summary>
/// Base class for all AST nodes
/// </summary>
public abstract class AstNode
{
    public abstract void Accept(IQueryVisitor visitor);
}

/// <summary>
/// Root node representing the entire query
/// </summary>
public class QueryNode : AstNode
{
    public SelectNode? Select { get; set; }
    public WhereNode? Where { get; set; }
    public AggregateNode? Aggregate { get; set; }
    public SortNode? Sort { get; set; }
    public LimitNode? Limit { get; set; }

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// SELECT clause node
/// </summary>
public class SelectNode : AstNode
{
    public List<string> Fields { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// WHERE clause node
/// </summary>
public class WhereNode : AstNode
{
    public ExpressionNode? Expression { get; set; }

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// Base class for expressions
/// </summary>
public abstract class ExpressionNode : AstNode
{
}

/// <summary>
/// Binary expression (AND, OR)
/// </summary>
public class BinaryExpressionNode : ExpressionNode
{
    public enum OperatorType
    {
        And,
        Or
    }

    public ExpressionNode Left { get; set; } = null!;
    public OperatorType Operator { get; set; }
    public ExpressionNode Right { get; set; } = null!;

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// Method call expression (e.g., field.greaterThan(value))
/// </summary>
public class MethodCallNode : ExpressionNode
{
    public string FieldName { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public List<string> Arguments { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// AGGREGATE clause node
/// </summary>
public class AggregateNode : AstNode
{
    public List<AggregationExpressionNode> Aggregations { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// Base class for aggregation expressions
/// </summary>
public abstract class AggregationExpressionNode : AstNode
{
    public List<AggregationExpressionNode> NestedAggregations { get; set; } = new();
}

/// <summary>
/// Range aggregation
/// </summary>
public class RangeAggregationNode : AggregationExpressionNode
{
    public string FieldName { get; set; } = string.Empty;
    public List<RangeBucket> Ranges { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

public class RangeBucket
{
    public decimal? From { get; set; }
    public decimal? To { get; set; }
}

/// <summary>
/// Term aggregation
/// </summary>
public class TermAggregationNode : AggregationExpressionNode
{
    public string FieldName { get; set; } = string.Empty;
    public int Size { get; set; }

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// Stats aggregation
/// </summary>
public class StatsAggregationNode : AggregationExpressionNode
{
    public string FieldName { get; set; } = string.Empty;

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// Percentiles aggregation
/// </summary>
public class PercentilesAggregationNode : AggregationExpressionNode
{
    public string FieldName { get; set; } = string.Empty;
    public List<double> Percentiles { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

/// <summary>
/// SORT clause node
/// </summary>
public class SortNode : AstNode
{
    public List<SortField> SortFields { get; set; } = new();

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}

public class SortField
{
    public string FieldName { get; set; } = string.Empty;
    public bool Ascending { get; set; } = true;
}

/// <summary>
/// LIMIT clause node
/// </summary>
public class LimitNode : AstNode
{
    public int Offset { get; set; } = 0;
    public int Size { get; set; }

    public override void Accept(IQueryVisitor visitor)
    {
        visitor.Visit(this);
    }
}
