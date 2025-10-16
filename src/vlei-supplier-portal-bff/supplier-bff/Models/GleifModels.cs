namespace supplier_bff.Models;

/// <summary>
/// Response model for GLEIF LEI Records API
/// </summary>
public class GleifLeiRecordsResponse
{
    public GleifMeta Meta { get; set; } = new();
    public GleifLinks Links { get; set; } = new();
    public List<GleifLeiRecord> Data { get; set; } = new();
}

public class GleifMeta
{
    public GleifGoldenCopy GoldenCopy { get; set; } = new();
    public GleifPagination Pagination { get; set; } = new();
}

public class GleifGoldenCopy
{
    public DateTime PublishDate { get; set; }
}

public class GleifPagination
{
    public int CurrentPage { get; set; }
    public int PerPage { get; set; }
    public int From { get; set; }
    public int To { get; set; }
    public int Total { get; set; }
    public int LastPage { get; set; }
}

public class GleifLinks
{
    public string? First { get; set; }
    public string? Last { get; set; }
}

public class GleifLeiRecord
{
    public string Type { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public GleifAttributes Attributes { get; set; } = new();
    public GleifRelationships Relationships { get; set; } = new();
    public GleifRecordLinks Links { get; set; } = new();
}

public class GleifAttributes
{
    public string Lei { get; set; } = string.Empty;
    public GleifEntity Entity { get; set; } = new();
    public GleifRegistration Registration { get; set; } = new();
    public List<string> Bic { get; set; } = new();
    public string? Mic { get; set; }
    public string? Ocid { get; set; }
    public string? Qcc { get; set; }
    public List<string> Spglobal { get; set; } = new();
    public string ConformityFlag { get; set; } = string.Empty;
}

public class GleifEntity
{
    public GleifLegalName LegalName { get; set; } = new();
    public List<GleifOtherName> OtherNames { get; set; } = new();
    public List<object> TransliteratedOtherNames { get; set; } = new();
    public GleifAddress LegalAddress { get; set; } = new();
    public GleifAddress HeadquartersAddress { get; set; } = new();
    public GleifRegisteredAt RegisteredAt { get; set; } = new();
    public string RegisteredAs { get; set; } = string.Empty;
    public string Jurisdiction { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public GleifLegalForm LegalForm { get; set; } = new();
    public GleifAssociatedEntity AssociatedEntity { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public GleifExpiration Expiration { get; set; } = new();
    public GleifSuccessorEntity SuccessorEntity { get; set; } = new();
    public List<object> SuccessorEntities { get; set; } = new();
    public DateTime CreationDate { get; set; }
    public string? SubCategory { get; set; }
    public List<object> OtherAddresses { get; set; } = new();
    public List<object> EventGroups { get; set; } = new();
}

public class GleifLegalName
{
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

public class GleifOtherName
{
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class GleifAddress
{
    public string Language { get; set; } = string.Empty;
    public List<string> AddressLines { get; set; } = new();
    public string? AddressNumber { get; set; }
    public string? AddressNumberWithinBuilding { get; set; }
    public string? MailRouting { get; set; }
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
}

public class GleifRegisteredAt
{
    public string Id { get; set; } = string.Empty;
    public string? Other { get; set; }
}

public class GleifLegalForm
{
    public string Id { get; set; } = string.Empty;
    public string? Other { get; set; }
}

public class GleifAssociatedEntity
{
    public string? Lei { get; set; }
    public string? Name { get; set; }
}

public class GleifExpiration
{
    public DateTime? Date { get; set; }
    public string? Reason { get; set; }
}

public class GleifSuccessorEntity
{
    public string? Lei { get; set; }
    public string? Name { get; set; }
}

public class GleifRegistration
{
    public DateTime InitialRegistrationDate { get; set; }
    public DateTime LastUpdateDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime NextRenewalDate { get; set; }
    public string ManagingLou { get; set; } = string.Empty;
    public string CorroborationLevel { get; set; } = string.Empty;
    public GleifRegisteredAt ValidatedAt { get; set; } = new();
    public string ValidatedAs { get; set; } = string.Empty;
    public List<object> OtherValidationAuthorities { get; set; } = new();
}

public class GleifRelationships
{
    // Simplified for now - can be expanded if needed
}

public class GleifRecordLinks
{
    public string? Self { get; set; }
}

/// <summary>
/// Simplified company data extracted from GLEIF response
/// </summary>
public class CompanyData
{
    public string Lei { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public CompanyAddress PrimaryAddress { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public string Jurisdiction { get; set; } = string.Empty;
    public DateTime? CreationDate { get; set; }
    public List<string> AlternativeNames { get; set; } = new();
}

public class CompanyAddress
{
    public List<string> AddressLines { get; set; } = new();
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string FormattedAddress { get; set; } = string.Empty;
}