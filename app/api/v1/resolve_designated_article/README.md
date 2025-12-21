# Resolve Designated Article API

## Endpoint

**Method:** `GET`  
**Path:** `/api/v1/resolve_designated_article`  
**Query Parameters:**
- `order_id` (required) - The order ID to resolve
- `tolerance` (optional, default: 0.01) - Tolerance for dimension matching

## Request

```
GET /api/v1/resolve_designated_article?order_id=<order_id>&tolerance=<tolerance>
```

Example:
```
GET /api/v1/resolve_designated_article?order_id=123
GET /api/v1/resolve_designated_article?order_id=123&tolerance=0.05
```

## Response Structure

```json
{
  "status": "NO_PROD_RECORD" | "NO_CLIENT_MATCH" | "NO_DIMENSION_MATCH" | "SINGLE_MATCH" | "MULTIPLE_MATCHES",
  "production_record": {
    "client": "string",
    "length": number,
    "inside_diameter": number,
    "outside_diameter": number
  } | null,
  "candidates": [
    {
      "article_name": "string",
      "designated_article": "string",
      "parsed_dimensions": {
        "length": number,
        "inside_diameter": number,
        "outside_diameter": number
      } | null
    }
  ],
  "dimension_matches": [
    {
      "article_name": "string",
      "designated_article": "string",
      "parsed_dimensions": {
        "length": number,
        "inside_diameter": number,
        "outside_diameter": number
      }
    }
  ],
  "resolved_article": {
    "article_name": "string",
    "designated_article": "string"
  } | null
}
```

## Status Types

### `NO_PROD_RECORD`
- No production record found for the given OFID
- `production_record`: `null`
- `candidates`: `[]`
- `dimension_matches`: `[]`
- `resolved_article`: `null`

### `NO_CLIENT_MATCH`
- Production record found, but no articles match the client keyword
- `production_record`: Production data
- `candidates`: `[]`
- `dimension_matches`: `[]`
- `resolved_article`: `null`

### `NO_DIMENSION_MATCH`
- Articles match client keyword, but none match dimensions
- `production_record`: Production data
- `candidates`: Articles matching client keyword (with parsed dimensions)
- `dimension_matches`: `[]`
- `resolved_article`: `null`

### `SINGLE_MATCH`
- Exactly one article matches both client keyword and dimensions
- `production_record`: Production data
- `candidates`: Articles matching client keyword
- `dimension_matches`: Array with single matching article
- `resolved_article`: The resolved article (only status with this field populated)

### `MULTIPLE_MATCHES`
- Multiple articles match both client keyword and dimensions
- `production_record`: Production data
- `candidates`: Articles matching client keyword
- `dimension_matches`: Array with multiple matching articles
- `resolved_article`: `null` (ambiguous, user must choose)

## Flow

1. **order → OFID**: Read `order_fabrication_control` from `tbl_orders_form` by `order_id`
2. **OFID → production record**: Find production row(s) where `tbl_enregistrements_prod.ofid == order_fabrication_control`
3. **client keyword match**: Find candidate articles by matching prod `client` as keyword inside `tbl_article.article_name` (case-insensitive, punctuation-agnostic)
4. **parse designated_article**: Parse each candidate's `designated_article` to extract dimensions
5. **dimension-match**: Compare production dimensions with parsed dimensions using tolerance

## SQL Queries (Parameterized)

### Step 1: Read order_fabrication_control from tbl_orders_form

```sql
SELECT order_fabrication_control
FROM tbl_orders_form
WHERE id = $1;
```

**Parameter:** `$1` = `order_id`

### Step 2: Find production rows by OFID

```sql
SELECT client, length, inside_diameter, outside_diameter
FROM tbl_enregistrements_prod
WHERE ofid = $1;
```

**Parameter:** `$1` = `order_fabrication_control` (from Step 1)

### Step 3: Find candidate articles by client keyword match

The implementation uses in-memory filtering with `normalizeText()` for punctuation-agnostic matching:

```typescript
// Normalize client and article names
const normalizedClient = normalizeText(client);
const normalizedName = normalizeText(article.article_name);
// Match if normalized name contains normalized client
```

**SQL equivalent (conceptual):**
```sql
SELECT article_name, designated_article
FROM tbl_article
WHERE regexp_replace(LOWER(article_name), '[^\w\s]', '', 'g') 
      LIKE '%' || regexp_replace(LOWER($1), '[^\w\s]', '', 'g') || '%';
```

### Step 4 & 5: Parse and match dimensions

These steps are performed in-memory using:
- `parseDesignation()` - Extracts dimensions from `designated_article` string
- `matchDimensions()` - Compares production dimensions with parsed dimensions using tolerance

## Logging

The endpoint logs at each step (safe, no huge payloads):
- `START` - Request initiation
- `STEP_1` - Fetching order_fabrication_control
- `STEP_2` - Fetching production records
- `STEP_3` - Matching articles by client keyword
- `STEP_4` - Parsing designated_article
- `STEP_5` - Matching dimensions
- `COMPLETE` - Final status and summary

## Example Responses

### NO_PROD_RECORD
```json
{
  "status": "NO_PROD_RECORD",
  "production_record": null,
  "candidates": [],
  "dimension_matches": [],
  "resolved_article": null
}
```

### SINGLE_MATCH
```json
{
  "status": "SINGLE_MATCH",
  "production_record": {
    "client": "ACME Corp",
    "length": 2600,
    "inside_diameter": 77.4,
    "outside_diameter": 103.4
  },
  "candidates": [
    {
      "article_name": "ACME Corp Article 1",
      "designated_article": "SP 2600 X 77.4/103.4 VV 13 mm AC13",
      "parsed_dimensions": {
        "length": 2600,
        "inside_diameter": 77.4,
        "outside_diameter": 103.4
      }
    }
  ],
  "dimension_matches": [
    {
      "article_name": "ACME Corp Article 1",
      "designated_article": "SP 2600 X 77.4/103.4 VV 13 mm AC13",
      "parsed_dimensions": {
        "length": 2600,
        "inside_diameter": 77.4,
        "outside_diameter": 103.4
      }
    }
  ],
  "resolved_article": {
    "article_name": "ACME Corp Article 1",
    "designated_article": "SP 2600 X 77.4/103.4 VV 13 mm AC13"
  }
}
```

### MULTIPLE_MATCHES
```json
{
  "status": "MULTIPLE_MATCHES",
  "production_record": {
    "client": "ACME Corp",
    "length": 2600,
    "inside_diameter": 77.4,
    "outside_diameter": 103.4
  },
  "candidates": [
    {
      "article_name": "ACME Corp Article 1",
      "designated_article": "SP 2600 X 77.4/103.4 VV 13 mm AC13",
      "parsed_dimensions": { "length": 2600, "inside_diameter": 77.4, "outside_diameter": 103.4 }
    },
    {
      "article_name": "ACME Corp Article 2",
      "designated_article": "2600x77.4/103.4",
      "parsed_dimensions": { "length": 2600, "inside_diameter": 77.4, "outside_diameter": 103.4 }
    }
  ],
  "dimension_matches": [
    {
      "article_name": "ACME Corp Article 1",
      "designated_article": "SP 2600 X 77.4/103.4 VV 13 mm AC13",
      "parsed_dimensions": { "length": 2600, "inside_diameter": 77.4, "outside_diameter": 103.4 }
    },
    {
      "article_name": "ACME Corp Article 2",
      "designated_article": "2600x77.4/103.4",
      "parsed_dimensions": { "length": 2600, "inside_diameter": 77.4, "outside_diameter": 103.4 }
    }
  ],
  "resolved_article": null
}
```

## Testing

Test different scenarios:
- **Missing OFID**: Order without `order_fabrication_control` → `NO_PROD_RECORD`
- **No production record**: Valid OFID but no matching production → `NO_PROD_RECORD`
- **Weird client**: Production with client that doesn't match any articles → `NO_CLIENT_MATCH`
- **No dimension match**: Articles match client but dimensions don't match → `NO_DIMENSION_MATCH`
- **Single match**: One article matches both client and dimensions → `SINGLE_MATCH`
- **Multiple matches**: Multiple articles match both client and dimensions → `MULTIPLE_MATCHES`
