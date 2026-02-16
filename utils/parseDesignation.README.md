# Parse Designation Utilities

## Overview

Three utility functions for parsing and matching designated articles:

1. **normalizeText** - Normalizes text for keyword matching
2. **parseDesignation** - Extracts dimensions from designated_article strings
3. **matchDimensions** - Compares production dimensions with parsed dimensions

## Functions

### A) normalizeText(str: string | null | undefined): string

Normalizes text for keyword matching:
- Case-insensitive (converts to lowercase)
- Removes punctuation
- Collapses multiple spaces into single space
- Trims whitespace

**Example:**
```typescript
normalizeText("ACME-Corp & Co.") // Returns: "acmecorp co"
normalizeText("Hello   World")   // Returns: "hello world"
```

### B) parseDesignation(designated_article: string | null | undefined)

Extracts dimensions from designated_article string:
- **length**
- **inside_diameter**
- **outside_diameter**

**Pattern:** `[length] X [inside_diameter]/[outside_diameter] [optional suffixes]`

**Rules:**
- Ignores prefixes like "SP", "VV", "mm", "AC13", etc.
- Only extracts the 3 main dimension values
- Returns `null` if not confidently found
- **Does NOT extract small numbers from suffixes** (e.g., "13" from "13 mm")

**Examples:**
```typescript
parseDesignation("SP 2600 X 77.4/103.4 VV 13 mm AC13")
// Returns: { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 }

parseDesignation("2600x77.4/103.4")
// Returns: { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 }

parseDesignation("invalid text")
// Returns: null
```

### C) matchDimensions(prod, parsed, tolerance=0.01): boolean

Compares production dimensions with parsed dimensions using float-safe comparison.

**Parameters:**
- `prod`: Production data with `length`, `inside_diameter`, `outside_diameter` (can be null/undefined)
- `parsed`: Parsed dimensions from `parseDesignation` (can be null)
- `tolerance`: Tolerance for floating point comparison (default: 0.01)

**Returns:** `true` if all dimensions match within tolerance, `false` otherwise

**Example:**
```typescript
const prod = { length: 2600.005, inside_diameter: 77.4, outside_diameter: 103.4 };
const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
matchDimensions(prod, parsed, 0.01) // Returns: true (within tolerance)
```

## Test Cases

### normalizeText Tests (5 tests)
1. ✓ Basic case-insensitive conversion
2. ✓ Removes punctuation
3. ✓ Collapses multiple spaces
4. ✓ Handles null/undefined/empty strings
5. ✓ Removes hyphens and special characters

### parseDesignation Tests (7 tests)
1. ✓ Standard format: "SP 2600 X 77.4/103.4 VV 13 mm AC13"
2. ✓ Format without spaces: "2600x77.4/103.4"
3. ✓ Format with lowercase x: "1500 x 50.5/80.2"
4. ✓ **Does NOT extract '13' from '13 mm' suffix** (critical test)
5. ✓ Returns null for invalid input
6. ✓ Handles format with extra spaces
7. ✓ Returns null if less than 3 valid numbers

### matchDimensions Tests (6 tests)
1. ✓ Exact match
2. ✓ Within tolerance
3. ✓ Outside tolerance
4. ✓ Returns false if parsed is null
5. ✓ Handles null/undefined in prod
6. ✓ Custom tolerance

**Total: 18 tests, all passing**

## Running Tests

```bash
npm run test:parseDesignation
```

Or directly:
```bash
npx tsx utils/parseDesignation.test.ts
```

## Key Features

✅ **Punctuation-agnostic matching** - Handles variations like "ACME-Corp" vs "ACME Corp"  
✅ **Robust parsing** - Handles multiple format variations  
✅ **Safe extraction** - Does NOT accidentally extract "13" from "13 mm"  
✅ **Float-safe comparison** - Uses tolerance for dimension matching  
✅ **Null-safe** - Handles null/undefined inputs gracefully  





