using supplier_bff.Models;

namespace supplier_bff.Services.QueryParser.AST;

/// <summary>
/// Visitor that executes the query against Italian company data
/// </summary>
public class QueryExecutionVisitor : IQueryVisitor
{
    private readonly List<ItalianCompany> _allData;
    private List<ItalianCompany> _filteredData;
    private List<string>? _selectFields;
    private Dictionary<string, object> _aggregations;

    public List<ItalianCompany> ResultData { get; private set; }
    public Dictionary<string, object> Aggregations => _aggregations;
    public int TotalCount { get; private set; }

    public QueryExecutionVisitor(List<ItalianCompany> data)
    {
        _allData = data;
        _filteredData = data.ToList();
        ResultData = new List<ItalianCompany>();
        _aggregations = new Dictionary<string, object>();
    }

    public void Visit(QueryNode node)
    {
        // Process in execution order
        
        // 1. WHERE - filter data
        if (node.Where != null)
        {
            node.Where.Accept(this);
        }
        
        // 2. SELECT - project fields (store for later)
        if (node.Select != null)
        {
            node.Select.Accept(this);
        }
        
        // 3. SORT - order data
        if (node.Sort != null)
        {
            node.Sort.Accept(this);
        }
        
        // Store total before limit
        TotalCount = _filteredData.Count;
        
        // 4. LIMIT - paginate
        if (node.Limit != null)
        {
            node.Limit.Accept(this);
        }
        else
        {
            ResultData = _filteredData;
        }
        
        // 5. AGGREGATE - compute aggregations on filtered data (before limit)
        if (node.Aggregate != null)
        {
            node.Aggregate.Accept(this);
        }
        
        // Always include count
        _aggregations["count"] = TotalCount;
    }

    public void Visit(SelectNode node)
    {
        _selectFields = node.Fields;
        // Field projection is conceptual in this implementation
        // The actual data model returns full ItalianCompany objects
    }

    public void Visit(WhereNode node)
    {
        if (node.Expression != null)
        {
            _filteredData = _allData.Where(company => EvaluateExpression(company, node.Expression)).ToList();
        }
    }

    private bool EvaluateExpression(ItalianCompany company, ExpressionNode expression)
    {
        return expression switch
        {
            BinaryExpressionNode binary => EvaluateBinaryExpression(company, binary),
            MethodCallNode method => EvaluateMethodCall(company, method),
            _ => false
        };
    }

    private bool EvaluateBinaryExpression(ItalianCompany company, BinaryExpressionNode node)
    {
        var left = EvaluateExpression(company, node.Left);
        var right = EvaluateExpression(company, node.Right);

        return node.Operator switch
        {
            BinaryExpressionNode.OperatorType.And => left && right,
            BinaryExpressionNode.OperatorType.Or => left || right,
            _ => false
        };
    }

    private bool EvaluateMethodCall(ItalianCompany company, MethodCallNode node)
    {
        // Skip filter if any argument is null or empty (flexible DSL support)
        if (!node.Arguments.Any() || node.Arguments.Any(arg => string.IsNullOrEmpty(arg)))
        {
            return true; // Ignore this filter condition
        }

        var fieldValue = GetFieldValue(company, node.FieldName);
        var method = node.MethodName.ToLower();

        return method switch
        {
            "equals" => CompareEquals(fieldValue, node.Arguments[0]),
            "notequals" => !CompareEquals(fieldValue, node.Arguments[0]),
            "greaterthan" => CompareGreaterThan(fieldValue, node.Arguments[0]),
            "lessthan" => CompareLessThan(fieldValue, node.Arguments[0]),
            "contains" => fieldValue?.ToString()?.Contains(node.Arguments[0], StringComparison.OrdinalIgnoreCase) ?? false,
            "startswith" => fieldValue?.ToString()?.StartsWith(node.Arguments[0], StringComparison.OrdinalIgnoreCase) ?? false,
            "endswith" => fieldValue?.ToString()?.EndsWith(node.Arguments[0], StringComparison.OrdinalIgnoreCase) ?? false,
            "in" => node.Arguments.Any(arg => CompareEquals(fieldValue, arg)),
            _ => false
        };
    }

    private object? GetFieldValue(ItalianCompany company, string fieldName)
    {
        // Normalize field name (support aliases)
        var normalized = fieldName.ToLower().Replace("_", "");

        return normalized switch
        {
            "vlei" => company.Vlei,
            "name" => company.Name,
            "address" => company.Address,
            "city" => company.City,
            "region" => company.Region,
            "ateco" => company.Ateco,
            "activitydescription" or "activity" => company.Activity_Description,
            "risk" => company.Risk,
            "creditlimit" or "credit" => company.Credit_Limit,
            "numberofemployees" or "employees" => company.Number_Of_Employees,
            _ => null
        };
    }

    private bool CompareEquals(object? fieldValue, string paramValue)
    {
        if (fieldValue == null) return false;
        
        // Normalize risk values to support both Italian and English
        var normalizedFieldValue = NormalizeRiskValue(fieldValue.ToString());
        var normalizedParamValue = NormalizeRiskValue(paramValue);
        
        return string.Equals(normalizedFieldValue, normalizedParamValue, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Normalizes risk values from Italian (Basso, Medio, Alto) to English (Low, Medium, High)
    /// </summary>
    private string NormalizeRiskValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value ?? string.Empty;

        var normalized = value.Trim().ToLower();
        
        return normalized switch
        {
            "basso" => "Low",
            "medio" => "Medium",
            "alto" => "High",
            "low" => "Low",
            "medium" => "Medium",
            "high" => "High",
            _ => value // Return original if not a risk value
        };
    }

    private bool CompareGreaterThan(object? fieldValue, string paramValue)
    {
        if (fieldValue == null) return false;

        // Try decimal comparison
        if (fieldValue is decimal decField && decimal.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var decParam))
        {
            return decField > decParam;
        }

        // Try int comparison
        if (fieldValue is int intField && int.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var intParam))
        {
            return intField > intParam;
        }

        // Try convert to decimal
        if (decimal.TryParse(fieldValue.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var fieldDec) &&
            decimal.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var paramDec))
        {
            return fieldDec > paramDec;
        }

        return false;
    }

    private bool CompareLessThan(object? fieldValue, string paramValue)
    {
        if (fieldValue == null) return false;

        // Try decimal comparison
        if (fieldValue is decimal decField && decimal.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var decParam))
        {
            return decField < decParam;
        }

        // Try int comparison
        if (fieldValue is int intField && int.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var intParam))
        {
            return intField < intParam;
        }

        // Try convert to decimal
        if (decimal.TryParse(fieldValue.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var fieldDec) &&
            decimal.TryParse(paramValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var paramDec))
        {
            return fieldDec < paramDec;
        }

        return false;
    }

    public void Visit(BinaryExpressionNode node)
    {
        // Handled in EvaluateExpression
    }

    public void Visit(MethodCallNode node)
    {
        // Handled in EvaluateExpression
    }

    public void Visit(AggregateNode node)
    {
        foreach (var aggregation in node.Aggregations)
        {
            aggregation.Accept(this);
        }
    }

    public void Visit(RangeAggregationNode node)
    {
        var buckets = new List<object>();

        foreach (var range in node.Ranges)
        {
            var matchingCompanies = _filteredData.Where(c =>
            {
                var value = GetFieldValue(c, node.FieldName);
                if (value == null) return false;

                var decValue = Convert.ToDecimal(value);
                var matchesFrom = !range.From.HasValue || decValue >= range.From.Value;
                var matchesTo = !range.To.HasValue || decValue < range.To.Value;

                return matchesFrom && matchesTo;
            }).ToList();

            var bucket = new Dictionary<string, object>
            {
                { "from", range.From?.ToString() ?? "*" },
                { "to", range.To?.ToString() ?? "*" },
                { "count", matchingCompanies.Count }
            };

            // Process nested aggregations
            if (node.NestedAggregations.Any())
            {
                var nestedAggs = new Dictionary<string, object>();
                foreach (var nested in node.NestedAggregations)
                {
                    var nestedVisitor = new QueryExecutionVisitor(matchingCompanies);
                    nested.Accept(nestedVisitor);
                    
                    // Merge nested aggregation results
                    foreach (var kvp in nestedVisitor.Aggregations)
                    {
                        nestedAggs[kvp.Key] = kvp.Value;
                    }
                }
                bucket["nested"] = nestedAggs;
            }

            buckets.Add(bucket);
        }

        _aggregations["range_aggregation"] = new Dictionary<string, object>
        {
            { "field", node.FieldName },
            { "buckets", buckets }
        };
    }

    public void Visit(TermAggregationNode node)
    {
        var grouped = _filteredData
            .GroupBy(c => GetFieldValue(c, node.FieldName)?.ToString() ?? "")
            .Select(g => new
            {
                Key = g.Key,
                Count = g.Count(),
                Companies = g.ToList()
            })
            .OrderByDescending(x => x.Count)
            .Take(node.Size)
            .ToList();

        var buckets = new List<object>();

        foreach (var group in grouped)
        {
            var bucket = new Dictionary<string, object>
            {
                { "key", group.Key },
                { "count", group.Count }
            };

            // Process nested aggregations
            if (node.NestedAggregations.Any())
            {
                var nestedAggs = new Dictionary<string, object>();
                foreach (var nested in node.NestedAggregations)
                {
                    var nestedVisitor = new QueryExecutionVisitor(group.Companies);
                    nested.Accept(nestedVisitor);
                    
                    // Merge nested aggregation results
                    foreach (var kvp in nestedVisitor.Aggregations)
                    {
                        nestedAggs[kvp.Key] = kvp.Value;
                    }
                }
                bucket["nested"] = nestedAggs;
            }

            buckets.Add(bucket);
        }

        _aggregations["term_aggregation"] = new Dictionary<string, object>
        {
            { "field", node.FieldName },
            { "buckets", buckets }
        };
    }

    public void Visit(StatsAggregationNode node)
    {
        var values = _filteredData
            .Select(c => GetFieldValue(c, node.FieldName))
            .Where(v => v != null)
            .Select(v => Convert.ToDecimal(v))
            .ToList();

        if (values.Any())
        {
            // Use field name in key to support multiple stats aggregations
            _aggregations[$"{node.FieldName}_stats"] = new Dictionary<string, object>
            {
                { "field", node.FieldName },
                { "count", values.Count },
                { "min", values.Min() },
                { "max", values.Max() },
                { "avg", values.Average() },
                { "sum", values.Sum() }
            };
        }
    }

    public void Visit(PercentilesAggregationNode node)
    {
        var values = _filteredData
            .Select(c => GetFieldValue(c, node.FieldName))
            .Where(v => v != null)
            .Select(v => Convert.ToDecimal(v))
            .OrderBy(v => v)
            .ToList();

        if (values.Any())
        {
            var percentileValues = new Dictionary<string, object>
            {
                { "field", node.FieldName }
            };

            foreach (var percentile in node.Percentiles)
            {
                var index = (int)Math.Ceiling(percentile / 100.0 * values.Count) - 1;
                index = Math.Max(0, Math.Min(index, values.Count - 1));
                percentileValues[$"p{percentile}"] = values[index];
            }

            _aggregations["percentiles_aggregation"] = percentileValues;
        }
    }

    public void Visit(SortNode node)
    {
        if (!node.SortFields.Any()) return;

        IOrderedEnumerable<ItalianCompany>? ordered = null;

        foreach (var sortField in node.SortFields)
        {
            if (ordered == null)
            {
                ordered = sortField.Ascending
                    ? _filteredData.OrderBy(c => GetFieldValue(c, sortField.FieldName), new ObjectComparer())
                    : _filteredData.OrderByDescending(c => GetFieldValue(c, sortField.FieldName), new ObjectComparer());
            }
            else
            {
                ordered = sortField.Ascending
                    ? ordered.ThenBy(c => GetFieldValue(c, sortField.FieldName), new ObjectComparer())
                    : ordered.ThenByDescending(c => GetFieldValue(c, sortField.FieldName), new ObjectComparer());
            }
        }

        if (ordered != null)
        {
            _filteredData = ordered.ToList();
        }
    }

    public void Visit(LimitNode node)
    {
        ResultData = _filteredData.Skip(node.Offset).Take(node.Size).ToList();
    }

    // Custom comparer for sorting objects
    private class ObjectComparer : IComparer<object?>
    {
        public int Compare(object? x, object? y)
        {
            if (x == null && y == null) return 0;
            if (x == null) return -1;
            if (y == null) return 1;

            // Try numeric comparison first
            if (decimal.TryParse(x.ToString(), out var xDec) && decimal.TryParse(y.ToString(), out var yDec))
            {
                return xDec.CompareTo(yDec);
            }

            // Fall back to string comparison
            return string.Compare(x.ToString(), y.ToString(), StringComparison.OrdinalIgnoreCase);
        }
    }
}
