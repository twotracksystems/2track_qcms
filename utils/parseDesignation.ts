/**
 * Utility functions for parsing and matching designated articles
 */

/**
 * A) normalizeText - Normalizes text for keyword matching
 * - Case-insensitive (converts to lowercase)
 * - Removes punctuation
 * - Collapses multiple spaces into single space
 * - Trims whitespace
 */
export function normalizeText(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * B) parseDesignation - Extracts dimensions from designated_article string
 * 
 * Extracts:
 * - length
 * - inside_diameter
 * - outside_diameter
 * 
 * From strings like: "SP 2600 X 77.4/103.4 VV 13 mm AC13"
 * 
 * Rules:
 * - Ignore prefixes like "SP", "VV", "mm", "AC13", etc.
 * - Extract the 3 main dimension values
 * - Pattern: [length] X [inside_diameter]/[outside_diameter] [optional suffixes]
 * - Return null if not confidently found
 * 
 * @param designated_article - The designated article string to parse
 * @returns Object with length, inside_diameter, outside_diameter, or null if parsing fails
 */
export function parseDesignation(
  designated_article: string | null | undefined
): { length: number; inside_diameter: number; outside_diameter: number } | null {
  if (!designated_article || typeof designated_article !== "string") {
    return null;
  }

  // Remove common prefixes and suffixes that might interfere
  // Pattern: SP, VV, mm, AC followed by numbers, etc.
  let cleaned = designated_article.trim();
  // Support European decimal commas across the full designation
  cleaned = cleaned.replace(/,/g, ".");

  // Try to match pattern: [number] X [number]/[number] or [number] X [number] / [number]
  // Also handle variations like: [number]x[number]/[number] (no spaces)
  
  // Pattern 1: "2600 X 77.4/103.4" or "2600x77.4/103.4"
  // Match: number, optional X (case insensitive), number, /, number
  const pattern1 = /(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/;
  const match1 = cleaned.match(pattern1);
  
  if (match1) {
    const length = parseFloat(match1[1]);
    const inside_diameter = parseFloat(match1[2]);
    const outside_diameter = parseFloat(match1[3]);
    
    // Validate that we got valid numbers
    if (
      !isNaN(length) &&
      !isNaN(inside_diameter) &&
      !isNaN(outside_diameter) &&
      length > 0 &&
      inside_diameter > 0 &&
      outside_diameter > 0
    ) {
      return { length, inside_diameter, outside_diameter };
    }
  }

  // Pattern 2: Try to find three consecutive numbers that make sense
  // Look for pattern: number number/number or number number number
  // But be careful not to match "13 mm" or other suffixes
  
  // Extract all numbers from the string
  const numbers = cleaned.match(/\d+(?:\.\d+)?/g);
  
  if (numbers && numbers.length >= 3) {
    // Filter out small numbers that are likely suffixes (like "13" from "13 mm")
    // Assume dimensions are typically > 10 for length and > 1 for diameters
    const significantNumbers = numbers
      .map((n) => parseFloat(n))
      .filter((n) => !isNaN(n) && n > 0);
    
    if (significantNumbers.length >= 3) {
      // Try to find the pattern: length X inside/outside
      // Look for the X separator
      const xIndex = cleaned.toLowerCase().indexOf("x");
      
      if (xIndex > 0) {
        // Split at X
        const beforeX = cleaned.substring(0, xIndex);
        const afterX = cleaned.substring(xIndex + 1);
        
        const beforeNumbers = beforeX.match(/\d+(?:\.\d+)?/g);
        const afterNumbers = afterX.match(/\d+(?:\.\d+)?/g);
        
        if (beforeNumbers && afterNumbers && afterNumbers.length >= 2) {
          const length = parseFloat(beforeNumbers[beforeNumbers.length - 1]);
          const inside_diameter = parseFloat(afterNumbers[0]);
          const outside_diameter = parseFloat(afterNumbers[1]);
          
          if (
            !isNaN(length) &&
            !isNaN(inside_diameter) &&
            !isNaN(outside_diameter) &&
            length > 0 &&
            inside_diameter > 0 &&
            outside_diameter > 0
          ) {
            return { length, inside_diameter, outside_diameter };
          }
        }
      }
      
      // Fallback: if we have at least 3 significant numbers, take first 3
      // But only if they're reasonably large (to avoid "13 mm" issue)
      if (
        significantNumbers[0] > 10 &&
        significantNumbers[1] > 1 &&
        significantNumbers[2] > 1
      ) {
        return {
          length: significantNumbers[0],
          inside_diameter: significantNumbers[1],
          outside_diameter: significantNumbers[2],
        };
      }
    }
  }

  // If we can't confidently parse, return null
  return null;
}

/**
 * C) matchDimensions - Compares production dimensions with parsed dimensions
 * 
 * Performs float-safe comparison using tolerance.
 * 
 * @param prod - Production data with length, inside_diameter, outside_diameter
 * @param parsed - Parsed dimensions from designated_article
 * @param tolerance - Tolerance for floating point comparison (default: 0.01)
 * @returns true if all dimensions match within tolerance
 */
export function matchDimensions(
  prod: {
    length?: number | null;
    inside_diameter?: number | null;
    outside_diameter?: number | null;
  },
  parsed: {
    length: number;
    inside_diameter: number;
    outside_diameter: number;
  } | null,
  tolerance: number = 0.01
): boolean {
  if (!parsed) {
    return false;
  }

  // Helper function for float comparison
  const withinTolerance = (a: number | null | undefined, b: number): boolean => {
    if (a === null || a === undefined || isNaN(a)) {
      return false;
    }
    return Math.abs(a - b) <= tolerance;
  };

  return (
    withinTolerance(prod.length, parsed.length) &&
    withinTolerance(prod.inside_diameter, parsed.inside_diameter) &&
    withinTolerance(prod.outside_diameter, parsed.outside_diameter)
  );
}





