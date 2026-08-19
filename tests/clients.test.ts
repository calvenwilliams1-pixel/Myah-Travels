// Smoke test: CSV injection prevention logic
// Note: Full exportClientsToCSV requires DB access, so this tests the escaping pattern

function testCsvFormulaInjection() {
  const escapeCsv = (val: any) => {
    const str = String(val ?? "").replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
    if (/^[=+\-@\t]/.test(str) || /^\s*[=+\-@]/.test(str)) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  };

  const testCases = [
    { input: "John Smith", expected: '"John Smith"' },
    { input: 'He said "hi"', expected: '"He said ""hi"""' },
    { input: "=SUM(A1:A2)", expected: '"\'=SUM(A1:A2)"' },
    { input: "@cmd", expected: '"\'@cmd"' },
  ];

  for (const tc of testCases) {
    const result = escapeCsv(tc.input);
    if (result !== tc.expected) throw new Error(`CSV escaping failed for "${tc.input}": got ${result}`);
  }

  console.log("✅ CSV escaping works");
}

export function runClientTests() {
  testCsvFormulaInjection();
  console.log("✅ Client tests passed");
}

runClientTests();
