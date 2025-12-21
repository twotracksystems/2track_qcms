/**
 * Test cases for parseDesignation utilities
 * 
 * Run with: npx ts-node utils/parseDesignation.test.ts
 * Or compile and run: npx tsx utils/parseDesignation.test.ts
 */

import {
  normalizeText,
  parseDesignation,
  matchDimensions,
} from "./parseDesignation";

// Test runner
function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean) {
    try {
      const result = fn();
      if (result) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.error(`✗ ${name}`);
        failed++;
      }
    } catch (error) {
      console.error(`✗ ${name} - Error: ${error}`);
      failed++;
    }
  }

  function assertEqual<T>(actual: T, expected: T, message?: string): boolean {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.error(
        `  Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`
      );
      if (message) console.error(`  ${message}`);
      return false;
    }
    return true;
  }

  console.log("Running tests for normalizeText...\n");

  // Test A: normalizeText
  test("normalizeText: basic case-insensitive", () => {
    return assertEqual(normalizeText("Hello World"), "hello world");
  });

  test("normalizeText: removes punctuation", () => {
    return assertEqual(normalizeText("ACME-Corp"), "acmecorp");
  });

  test("normalizeText: collapses spaces", () => {
    return assertEqual(normalizeText("ACME   Corp"), "acme corp");
  });

  test("normalizeText: handles null/undefined", () => {
    return (
      assertEqual(normalizeText(null), "") &&
      assertEqual(normalizeText(undefined), "") &&
      assertEqual(normalizeText(""), "")
    );
  });

  test("normalizeText: removes hyphens and special chars", () => {
    return assertEqual(normalizeText("ACME-Corp & Co."), "acmecorp co");
  });

  console.log("\nRunning tests for parseDesignation...\n");

  // Test B: parseDesignation
  test("parseDesignation: standard format SP 2600 X 77.4/103.4 VV 13 mm AC13", () => {
    const result = parseDesignation("SP 2600 X 77.4/103.4 VV 13 mm AC13");
    return (
      result !== null &&
      assertEqual(result.length, 2600) &&
      assertEqual(result.inside_diameter, 77.4) &&
      assertEqual(result.outside_diameter, 103.4)
    );
  });

  test("parseDesignation: format without spaces 2600x77.4/103.4", () => {
    const result = parseDesignation("2600x77.4/103.4");
    return (
      result !== null &&
      assertEqual(result.length, 2600) &&
      assertEqual(result.inside_diameter, 77.4) &&
      assertEqual(result.outside_diameter, 103.4)
    );
  });

  test("parseDesignation: format with lowercase x", () => {
    const result = parseDesignation("1500 x 50.5/80.2");
    return (
      result !== null &&
      assertEqual(result.length, 1500) &&
      assertEqual(result.inside_diameter, 50.5) &&
      assertEqual(result.outside_diameter, 80.2)
    );
  });

  test("parseDesignation: should NOT extract '13' from '13 mm' suffix", () => {
    const result = parseDesignation("SP 2600 X 77.4/103.4 VV 13 mm AC13");
    // Should extract 2600, 77.4, 103.4, NOT 13
    return (
      result !== null &&
      result.length === 2600 &&
      result.inside_diameter === 77.4 &&
      result.outside_diameter === 103.4
    );
  });

  test("parseDesignation: returns null for invalid input", () => {
    return (
      parseDesignation(null) === null &&
      parseDesignation(undefined as any) === null &&
      parseDesignation("") === null &&
      parseDesignation("invalid text") === null
    );
  });

  test("parseDesignation: handles format with extra spaces", () => {
    const result = parseDesignation("  3000  X  100.5  /  150.8  ");
    return (
      result !== null &&
      assertEqual(result.length, 3000) &&
      assertEqual(result.inside_diameter, 100.5) &&
      assertEqual(result.outside_diameter, 150.8)
    );
  });

  test("parseDesignation: returns null if less than 3 valid numbers", () => {
    return (
      parseDesignation("2600 X 77.4") === null &&
      parseDesignation("2600") === null
    );
  });

  console.log("\nRunning tests for matchDimensions...\n");

  // Test C: matchDimensions
  test("matchDimensions: exact match", () => {
    const prod = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return matchDimensions(prod, parsed) === true;
  });

  test("matchDimensions: within tolerance", () => {
    const prod = { length: 2600.005, inside_diameter: 77.4, outside_diameter: 103.4 };
    const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return matchDimensions(prod, parsed, 0.01) === true;
  });

  test("matchDimensions: outside tolerance", () => {
    const prod = { length: 2600.02, inside_diameter: 77.4, outside_diameter: 103.4 };
    const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return matchDimensions(prod, parsed, 0.01) === false;
  });

  test("matchDimensions: returns false if parsed is null", () => {
    const prod = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return matchDimensions(prod, null) === false;
  });

  test("matchDimensions: handles null/undefined in prod", () => {
    const prod = { length: null, inside_diameter: 77.4, outside_diameter: 103.4 };
    const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return matchDimensions(prod, parsed) === false;
  });

  test("matchDimensions: custom tolerance", () => {
    const prod = { length: 2600.1, inside_diameter: 77.4, outside_diameter: 103.4 };
    const parsed = { length: 2600, inside_diameter: 77.4, outside_diameter: 103.4 };
    return (
      matchDimensions(prod, parsed, 0.05) === false &&
      matchDimensions(prod, parsed, 0.2) === true
    );
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log(`Total tests: ${passed + failed}`);
  console.log("=".repeat(50));

  return failed === 0;
}

// Run tests if executed directly
// For Node.js/TypeScript execution
if (typeof require !== "undefined" && require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests };

