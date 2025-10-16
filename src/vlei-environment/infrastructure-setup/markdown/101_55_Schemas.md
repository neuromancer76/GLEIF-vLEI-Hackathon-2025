# ACDC Schemas: Defining Verifiable Structures

<div class="alert alert-primary">
  <b>🎯 OBJECTIVE</b><hr>
  Explain the role of schemas in defining ACDC structures, how they leverage Self-Addressing Identifiers (SAIDs) for verifiability, discover the structure of an ACDC schema, and learn how to create and process a basic schema. Understand that ACDCs are <b>ordered field maps</b> which means that order of attributes in any produced JSON must use a deterministic order that is canonically defined in the JSON schema.
  <br/>
</div>

## Purpose of Schemas

Before we can issue or verify an Authentic Chained Data Container (ACDC) we need a blueprint that describes exactly what information it should contain and how that information should be structured. This blueprint is called a **Schema**.

Schemas serve several purposes:

* **Structure and Validation:** They define the names, data types, and constraints for the data within an ACDC. This allows recipients to validate that a received ACDC contains the expected information in the correct format.
* **Interoperability:** When different parties agree on a common schema, they can reliably exchange and understand ACDCs for a specific purpose (e.g., everyone knows what fields to expect in a "Membership Card" ACDC).
* **Verifiability:** As we'll see, ACDC schemas themselves are cryptographically verifiable, ensuring the blueprint hasn't been tampered with.

<div class="alert alert-info">
    <b>🔒 Security Note</b><hr>
    Security is a major reason why ACDC schemas are necessary and also why ACDC schemas must be immutable. Using immutable schemas to describe all ACDCs prevents any type of malleability attack and ensures that recipients always know precisely the kind of data to expect from an ACDC.
</div>

### Ordering of attributes

It is essential to understand that ACDCs are **ordered field maps**, which means that the order in which fields appear in the JSON of an ACDC must be specific and deterministic. This design constraint is non-existent in much of the Javascript world and many other credential formats, and its an essential part of what makes ACDC secure. A deterministic ordering of fields must be used in order to enable cryptographic verifiability. A non-deterministic field order would mean digest (hashing) verification would fail because attribute order would be unpredictable. So, while initially seeming inconvenient, the ordered field maps provide predictability and cryptographic verifiability.

<div class="alert alert-info">
    <b>🔒 Security Note</b><hr>
    It also happens that using ordered field maps protects against data malleability attacks. If strict insertion order was not preserved or required then an attacker could inject JSON into an ACDC being shared and possibly cause undefined, unknown, or unintended behavior for the recipient of an ACDC.
</div>

#### Canonical ordering of ACDC attributes

This order is set by the JSON schema document, as in the **canonical ordering** of data attributes in an ACDC is defined by the JSON schema document, **not lexicographical order**. Admittedly, ordering of attributes in JSON is not yet standard practice in the JSON and Javascript worlds, yet is essential from a security perspective. 

##### Python and ordered dicts

Also, as of Python 3.7 the [`json`](https://docs.python.org/3/library/json.html) built-in package preserves input (insertion) and output order of `dict` structs used for JSON serialization and deserialization, meaning insertion order is preserved.

##### Javascript and ordered Maps

As of ECMAScript 2015 the [Map implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), used for JSON serialization and deserialization, uses insertion order to create a predictable ordering of fields, meaning any modern Javascript implementation will preserve insertion order. 

#### Other languages

If you use a different language implementation of KERI, ACDC, or CESR then you must ensure it preserves insertion order of attributes for ACDC validation to succeed.

<div class="alert alert-warning">
    <b>⚠️ Validation Warning</b><hr>
    ACDCs must have ordered field maps in order to be reliably verifiable. Any change to the order of fields that is not also consistent with the schema will result in a validation failure.
</div>

## Writing ACDC Schemas

ACDC schemas are written using the **JSON Schema** specification. If you're familiar with JSON Schema, you'll find ACDC schemas very similar, with a few KERI-specific conventions.

The main parts of a typical ACDC schema include metadata, properties, metadata of the properties, attributes, edges, and rules. Each of these main parts are previewed below in an abbreviated schema document.

### Sample Schema for an ACDC

As a demonstration the below schema is titled "Sample Schema" which is a label of the type of credential that this schema describes. This particular schema does not have any edges, the "e" section, or rules, the "r" section. An upcoming training will explore those sections. Whitespace below was added for readability. Actual JSON Schemas use no extra whitespace.

```json
{
    "$id"           : "EJgBEKtba5ewUgG3k268YadY2eGBRrsVF6fF6tLyoRni",
    "$schema"       : "http://json-schema.org/draft-07/schema#",
    "title"         : "Sample Schema",
    "description"   : "A very basic credential schema for demonstration.",
    "type"          : "object",
    "credentialType": "SampleCredential",
    "version": "1.0.0",
    "properties": {
        "v" : {...},
        "d" : {...},
        "u" : {...},
        "i" : {...},
        "ri": {...},
        "s" : {...},
        "a" : {...}
    },
    "additionalProperties": false,
    "required": ["v","d","i","ri","s","a"]
}
```

#### Schema Metadata (Top Level)

These attributes describes the schema document itself.
* `$id`: This field holds the SAID of the entire schema file once processed. It's not a URL like in standard JSON Schema. It's computed after all internal SAIDs are calculated.
* `$schema`: Specifies the JSON Schema version (e.g., `"http://json-schema.org/draft-07/schema#"`)
* `title`, `description`: Human-readable name and explanation
* `type`: Usually `"object"` for the top level of an ACDC schema
* `credentialType`: A specific name for this type of credential
* `version`: A semantic version for this specific credential type (e.g., `"1.0.0"`) to manage schema evolution (Distinct from the ACDC instance's `v` field).
* `additionalProperties`: Controls whether the ACDC may have extra properties in addition to what is defined in the JSON Schema. The default is true. If false then adding any properties beyond those defined in the schema will cause a validation error.
* `required`: declares the attributes of the "properties" section that must have data values defined in the ACDC. If any of the required properties are missing in the resulting ACDC JSON, then validation will fail.

#### `properties` section (Top Level)

Inside the top level "properties" attribute there are two groups of fields including ACDC metadata and ACDC data attributes (payload). These fields define what appears in the ACDC's envelope and payload.

```json
{
  ...
  "properties": {
    "v":  {"description": "Credential Version String","type": "string"},
    "d":  {"description": "Credential SAID",          "type": "string"},
    "u":  {"description": "One time use nonce",       "type": "string"},
    "i":  {"description": "Issuer AID",               "type": "string"},
    "rd": {"description": "Registry SAID",            "type": "string"},
    "s":  {"description": "Schema SAID",              "type": "string"},
    "a": {...},
    "e": {...},
    "r": {...},
  },
  ...
}
```

The metadata attributes include "v", "d", "u", "i", "rd", and "s" attributes.

The data attributes, or ACDC payload, include the "a", "e", and "r" attributes.

Each are explained below.

##### ACDC Metadata Fields

The ACDC metadata fields describe data that shows up at the top level of an ACDC and describe the ACDC itself, such as who issued the credential, what schema it has, and any privacy-preserving attributes.

* `v`: ACDC version/serialization - a CESR version string describing the version of the CESR and ACDC protocols used to encode this ACDC.
* `d`: ACDC SAID - The self-addressing identifier (digest) of the issued ACDC.
* `u`: salty nonce - an optional nonce used to blind the properties section during a privacy-preserving graduated disclosure negotiation.
* `i`: Issuer AID - The AID prefix of the identifier who issued this ACDC.
* `rd`: Registry SAID - Formerly the "ri" attribute; the SAID of the credential registry of the issuer who issued this ACDC.
* `s`: Schema SAID - The SAID of the JSON schema document that describes the data in this ACDC and that will be used to validate the data going into or being pulled out of this ACDC.
  
### ACDC Properties Payload Sections

The actual data stored inside of an ACDC including data attributes, chained credentials (edges), and any rules (legal language) defined for an ACDC. The reason chained credentials are stored in what is called an "edge" section is because chained ACDCs form a graph where the nodes are credentials and the edges are pointers between credential nodes in the graph.

```json
{
  ...
  "properties": {
    ...
    "a": {...},
    "e": {...},
    "r": {...},
  },
  ...
}
```

* `a`: Defines the structure for the **attributes block**, which holds the actual data or claims being made by the credential.
* `e`: Defines any links to chained credentials, known as edges.
* `r`: Defines any legal rules for a credential such as a terms of service or a legal disclaimer for a credential. This is where **Ricardian Contracts** enter in to an ACDC.

The attribute section is where most of the action happens and is typically the largest section of a credential. We break it down next.

#### ACDC Attributes Payload Section

The "a" or attributes section of an ACDC payload is where the data for a credential is stored. This data may be stored in one of two ways, in the "compacted" and blinded form as a SAID, or in the "un-compacted" form where the data attribute names and values are un-blinded and visible. The blinding and un-blinding process are used to control negotiation of information disclosure during the graduated disclosure process, ACDC's form of selective disclosure.

```json
{
  ...
  "properties": {
    ...  
    "a": {
      "oneOf": [
        { "description": "Attributes block SAID", "type": "string"},
        { "$id": "ED614TseulOlXWhFNsOcKIKt9Na0gCByugqyKVsva-gl",
          "description": "Attributes block",      "type": "object",  
          ...
        }
      ]
    },
    ...  
  },
  ...    
}
```

The attributes of the "a" section ACDC are as follows:

* **`oneOf`**: This standard JSON Schema keyword indicates that the value for the `a` block in an actual ACDC instance can be *one of* the following two formats:
    1.  **Compacted Form (String):**
        * `{"description": "Attributes block SAID", "type": "string"}`
          * This option defines the *compact* representation. Instead of including the full attributes object, the ACDC can simply contain a single string value: the SAID of the attributes block itself. This SAID acts as a verifiable reference to the full attribute data, which might be stored elsewhere. **(We won't cover compact ACDCs in this material.)**
    2.  **Un-compacted Form (Object):**
        * `{"$id": "", "description": "Attributes block", "type": "object", ...}`
          * This option defines the full or un-compacted representation, where the ACDC includes the complete attributes object directly.
      
##### Inside an un-compacted ACDC attributes section

You can easily identify an un-compacted ACDC attributes section because it has both an "$id" and a "properties" attribute where all the data is stored. A few metadata attributes go along with this.

```json
{
  ...
  "properties": {
    ...  
    "a": {
      "oneOf": [
        {
          "$id": "ED614TseulOlXWhFNsOcKIKt9Na0gCByugqyKVsva-gl",
          "description": "Attributes block",
          "type": "object",
          "properties": {
            "d":     {"description": "Attributes data SAID",       "type": "string"},
            "i":     {"description": "Issuee AID",                 "type": "string"},
            "dt":    {"description": "Issuance date time",         "type": "string", "format": "date-time"},
            "claim": {"description": "The simple claim being made","type": "string"}
          },
          "additionalProperties": false,
          "required": ["d","i","dt","claim"]
        }
      ]
    },
    ...  
  },
  ...    
}
```

This schema describes a JSON object that looks like the following:
```json
{
    "d": "ENSOVw2kLhPSNbCWlOir8BEB2N2NDskgBNDbx7L1qJsk",
    "i": "EOc_QXByf6e-4_q80tG4Kay-MOw2GYqkbiifvepIYmKi",
    "dt": "2025-06-11T21:29:49.537000+00:00",
    "claim": "some claim value"
}
```

A lot of schema definition for a simple credential!

Each of the attributes are defined as follows:
* **`$id`**: This field will hold the SAID calculated for *this specific attributes block structure* after the schema is processed (`SAIDified`). Initially empty `""` when writing the schema.
* **`description`**: Human-readable description of this block.
* **`type`: `"object"`**: Specifies that this form is a JSON object.
* **`properties`**: Defines the fields contained within the attributes object:
    * **`d`**: Holds the SAID calculated from the *actual data* within the attributes block
    * **`i`**: The AID of the **Issuee** or subject of the credential – the entity the claims are *about*.
    * **`dt`**: An ISO 8601 date-time string indicating when the credential was issued.
    * **`claim`** (and other custom fields): These are the specific data fields defined by your schema. In this example, `"claim"` is a string representing the custom information this credential conveys. You would define all your specific credential attributes here.
* **`additionalProperties`, `required`:** Standard JSON Schema fields controlling whether extra properties are allowed and which defined properties must be present. (see the complete schema [here](config/schemas/sample_schema.bak.json))

<div class="alert alert-info">
  <b>ℹ️ NOTE</b><hr>
    The ACDC schema definition allows for optional payload blocks called <code>e</code> (edges) and <code>r</code> (rules).
    <ul>
        <li>The <code>e</code> section defines links (edges) to other ACDCs, creating verifiable chains of related credentials. For more details see <a href="https://trustoverip.github.io/tswg-acdc-specification/#edge-section"><b>edges</b></a>.</li>
        <li>The <code>r</code> section allows embedding machine-readable rules or legal prose, such as Ricardian Contracts, directly into the credential. For more details see <a href="https://trustoverip.github.io/tswg-acdc-specification/#rules-section"><b>rules</b></a>.</li>
</div>

### Writing your ACDC Schema

To write your schema, most of the customization will happen inside the payload attributes block (`a`). Here you can add claims according to specific needs. When you chain credentials you will use the "e" section. And when you set rules for your credentials you will use the "r" section. We get into each of these subjects in upcoming trainings.

### Full Schema Example

The below sample schema illustrates a complete, sample credential that only has attributes, no edges, and no rules. Whitespace has been somewhat trimmed and in some places added for readability and conciseness. When you use JSON schemas then the formatting will significantly expand the line count of a schema beyond what is shown below.

```json
{
  "$id": "EJgBEKtba5ewUgG3k268YadY2eGBRrsVF6fF6tLyoRni",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Sample Schema",
  "description": "A very basic credential schema for demonstration.",
  "type": "object",
  "credentialType": "SampleCredential",
  "version": "1.0.0",
  "properties": {
    "v":  { "description": "Credential Version String", "type": "string" },
    "d":  { "description": "Credential SAID",           "type": "string" },
    "u":  { "description": "One time use nonce",        "type": "string" },
    "i":  { "description": "Issuer AID",                "type": "string" },
    "ri": { "description": "Registry SAID",             "type": "string" },
    "s":  { "description": "Schema SAID",               "type": "string" },
    "a":  {
      "oneOf": [
        { "description": "Attributes block SAID",       "type": "string" },
        {
          "$id": "ED614TseulOlXWhFNsOcKIKt9Na0gCByugqyKVsva-gl",
          "description": "Attributes block",            "type": "object",
          "properties": {
            "d":     { "description": "Attributes data SAID",        "type": "string" },
            "i":     { "description": "Issuee AID",                  "type": "string" },
            "dt":    { "description": "Issuance date time",          "type": "string", "format": "date-time" },
            "claim": { "description": "The simple claim being made", "type": "string" }
          },
          "additionalProperties": false,
          "required": [ "d", "i", "dt", "claim" ]
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": [ "v", "d", "i", "ri", "s", "a" ]
}
```

If you want to see a production-grade credential schema that has both edges and rules, you may review the [GLEIF vLEI Official Organizational Role (OOR)](https://github.com/WebOfTrust/schema/blob/main/vLEI/legal-entity-official-organizational-role-vLEI-credential.schema.json) credential schema.


<div class="alert alert-primary">
  <b>📝 SUMMARY</b><hr>
An ACDC Schema acts as an ordered, verifiable blueprint defining the structure, data types, rules, and canonical ordering for attributes within an Authentic Chained Data Container (ACDC). Written using the JSON Schema specification, they ensure ACDCs have the expected format (validation) and enable different parties to understand exchanged credentials (interoperability). 
<br><br>
Key components include: 
    <li>top-level metadata (like the schema's SAID in <code>$id</code>, <code>title</code>, <code>credentialType</code>, <code>version</code>)</li> 
    <li>a properties section defining the ACDC envelope fields (<code>v</code>, <code>d</code>, <code>i</code>, <code>s</code>, etc.)</li> 
    <li>a payload section. The main payload section is attributes (<code>a</code>), containing issuer/issuee info and custom claims, with optional sections for edges (<code>e</code>) linking other ACDCs, and rules (<code>r</code>).</li>

**Remember**, all fields contained within an ACDC must be ordered according to **insertion order**, not lexicographic (alphabetical) order. This is essential for both cryptographic verifiability and security.  
</div>

[<- Prev (ACDC)](101_50_ACDC.ipynb) | [Next (Saidify schema) ->](101_60_Saidify_schema.ipynb)
