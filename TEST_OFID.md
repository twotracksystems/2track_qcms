# Testing OFID 910825

## Option 1: Using the Test Endpoint (Recommended)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Call the test endpoint:**
   ```bash
   curl "http://localhost:3000/api/v1/test_resolve_by_ofid?ofid=910825"
   ```

   Or open in browser:
   ```
   http://localhost:3000/api/v1/test_resolve_by_ofid?ofid=910825
   ```

## Option 2: Find Order ID First, Then Test Resolver

1. **Find the order_id for OFID 910825:**
   - Query `tbl_orders_form` where `order_fabrication_control = '910825'`
   - Get the `id` field

2. **Call the resolver endpoint:**
   ```bash
   curl "http://localhost:3000/api/v1/resolve_designated_article?order_id=<order_id>"
   ```

## Option 3: Direct Database Query

If you have database access, you can run:

```sql
-- Find order with OFID
SELECT id, order_fabrication_control 
FROM tbl_orders_form 
WHERE order_fabrication_control = '910825';

-- Check production records
SELECT client, length, inside_diameter, outside_diameter
FROM tbl_enregistrements_prod
WHERE ofid = '910825';

-- Then use the order_id to test the resolver endpoint
```

## Expected Results

The resolver will:
1. Find the order with OFID 910825
2. Get production records for that OFID
3. Match articles by client keyword
4. Parse designated_article dimensions
5. Match dimensions with tolerance
6. Return status and resolved article (if single match)

## Response Structure

```json
{
  "status": "SINGLE_MATCH" | "MULTIPLE_MATCHES" | "NO_PROD_RECORD" | "NO_CLIENT_MATCH" | "NO_DIMENSION_MATCH",
  "production_record": { ... },
  "candidates": [ ... ],
  "dimension_matches": [ ... ],
  "resolved_article": { ... }  // Only when SINGLE_MATCH
}
```





