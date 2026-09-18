import { hashPassword, verifyPassword, generateTotpSecret, verifyTotp } from "@/lib/auth";
import { authenticator } from "otplib";

async function testPasswordHashing() {
  const password = "test-password-123";
  const hash = await hashPassword(password);
  
  if (!hash || hash === password) throw new Error("Password hash failed");
  
  const isValid = await verifyPassword(password, hash);
  if (!isValid) throw new Error("Password verification failed");
  
  const isInvalid = await verifyPassword("wrong-password", hash);
  if (isInvalid) throw new Error("Wrong password should not verify");
  
  console.log("✅ Password hashing works");
}

async function testTotpVerification() {
  const secret = generateTotpSecret();
  const validToken = authenticator.generate(secret);
  
  const shouldPass = verifyTotp(validToken, secret);
  if (!shouldPass) throw new Error("Valid TOTP token should verify");
  
  const shouldFail = verifyTotp("000000", secret);
  if (shouldFail) throw new Error("Invalid TOTP token should not verify");
  
  console.log("✅ TOTP verification works");
}

export async function runAuthTests() {
  await testPasswordHashing();
  await testTotpVerification();
  console.log("✅ Auth tests passed");
}

runAuthTests().catch((err) => {
  console.error("❌ Auth tests failed:", err);
  process.exit(1);
});
