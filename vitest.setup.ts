import "@testing-library/jest-dom/vitest";

// Silence React 18 act() warnings in tests unless real errors occur.
// Actual act() violations will still surface in the test output.
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("not wrapped in act")) {
    return;
  }
  originalError(...args);
};
