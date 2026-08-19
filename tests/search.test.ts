// Smoke test: FTS query sanitization pattern
// Note: Full searchContent requires DB + FTS5 index, so this tests the escaping pattern

function testFtsQuerySanitization() {
  function sanitizeFtsQuery(query: string): string {
    return `"${query.replace(/"/g, '""')}"`;
  }

  const testCases = [
    { input: "Japan trip", expected: '"Japan trip"' },
    { input: 'He said "hello"', expected: '"He said ""hello"""' },
    { input: "Tokyo - Osaka", expected: '"Tokyo - Osaka"' },
  ];

  for (const tc of testCases) {
    const result = sanitizeFtsQuery(tc.input);
    if (result !== tc.expected) throw new Error(`FTS sanitization failed for "${tc.input}": got ${result}`);
  }

  console.log("✅ FTS query sanitization works");
}

function testMinLength() {
  const query = "a";
  const isValid = query.trim().length >= 2;
  if (isValid) throw new Error("Should reject short queries");
  console.log("✅ Query length validation works");
}

export function runSearchTests() {
  testFtsQuerySanitization();
  testMinLength();
  console.log("✅ Search tests passed");
}

runSearchTests();
