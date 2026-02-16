/**
 * Utility functions for formatting numbers
 */

/**
 * Formats a number to display 2 decimal places only if there are decimal values.
 * If the number is an integer, it displays without decimals.
 * If the number has decimals, it formats to a maximum of 2 decimal places.
 * 
 * @param value - The number, string, null, or undefined to format
 * @returns Formatted string representation of the number, or empty string if invalid
 * 
 * @example
 * formatNumberWithDecimals(5) // "5"
 * formatNumberWithDecimals(5.5) // "5.5"
 * formatNumberWithDecimals(5.55) // "5.55"
 * formatNumberWithDecimals(5.555) // "5.56" (rounded)
 * formatNumberWithDecimals(null) // ""
 */
export function formatNumberWithDecimals(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  
  // Convert to number
  const numValue = typeof value === "number" ? value : parseFloat(String(value));
  
  // Check if it's a valid number
  if (isNaN(numValue) || !Number.isFinite(numValue)) {
    return "";
  }
  
  // If it's an integer, return without decimals
  if (Number.isInteger(numValue)) {
    return numValue.toString();
  }
  
  // Format to 2 decimal places, then remove trailing zeros
  const formatted = numValue.toFixed(2);
  // Remove trailing zeros and decimal point if not needed
  return parseFloat(formatted).toString();
}

/**
 * Formats a number for display with a fallback value for null/undefined.
 * Uses formatNumberWithDecimals but returns a fallback string for null values.
 * 
 * @param value - The number, string, null, or undefined to format
 * @param fallback - The string to return if value is null/undefined/invalid (default: "—")
 * @returns Formatted string or fallback
 */
export function formatNumber(value?: string | number | null, fallback: string = "—"): string {
  const formatted = formatNumberWithDecimals(value);
  return formatted === "" ? fallback : formatted;
}
