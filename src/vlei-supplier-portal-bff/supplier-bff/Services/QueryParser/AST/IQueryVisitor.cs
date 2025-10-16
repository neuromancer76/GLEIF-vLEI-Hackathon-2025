namespace supplier_bff.Services.QueryParser.AST;

/// <summary>
/// Visitor interface for traversing and processing AST nodes
/// </summary>
public interface IQueryVisitor
{
    void Visit(QueryNode node);
    void Visit(SelectNode node);
    void Visit(WhereNode node);
    void Visit(BinaryExpressionNode node);
    void Visit(MethodCallNode node);
    void Visit(AggregateNode node);
    void Visit(RangeAggregationNode node);
    void Visit(TermAggregationNode node);
    void Visit(StatsAggregationNode node);
    void Visit(PercentilesAggregationNode node);
    void Visit(SortNode node);
    void Visit(LimitNode node);
}
