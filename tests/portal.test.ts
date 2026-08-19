import { getMagicLinkExpiry } from "@/lib/portal";

function testExpiryCalculation() {
  // Test with returnDate (should be returnDate + 3 days)
  const portal = { returnDate: "2026-08-22" };
  const expiry = getMagicLinkExpiry(portal);
  
  const expected = new Date("2026-08-25T23:59:59");
  
  if (expiry.toISOString() !== expected.toISOString()) {
    throw new Error(`Expiry mismatch: ${expiry.toISOString()} vs ${expected.toISOString()}`);
  }
  
  console.log("✅ Expiry calculation with return date works");
}

function testExpiryFallback() {
  // Test with no returnDate (should be ~30 days from now)
  const portal = { returnDate: null };
  const expiry = getMagicLinkExpiry(portal);
  
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  // Should be between 29 and 31 days from now
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < 29 || diffDays > 31) {
    throw new Error(`Fallback expiry incorrect: ${diffDays} days from now`);
  }
  
  console.log("✅ Expiry fallback works");
}

export function runPortalTests() {
  testExpiryCalculation();
  testExpiryFallback();
  console.log("✅ Portal tests passed");
}

runPortalTests();
