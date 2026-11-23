import { describe, it, expect } from "vitest";
import {
  loginRateLimit,
  loginUsernameRateLimit,
  resetLoginRateLimits,
  resetRateLimit,
} from "./index";

// The limiter store is module-level and in-memory; every test uses its
// own keys so tests stay independent within the shared store.
const runId = Date.now().toString(36);
const ip = (n: number) => `203.0.113.${n}-${runId}`;
const user = (name: string) => `${name}-${runId}`;

describe("loginRateLimit (per IP)", () => {
  it("allows 5 attempts, then blocks", () => {
    const key = ip(1);
    for (let i = 0; i < 5; i++) {
      expect(loginRateLimit(key).success).toBe(true);
    }
    expect(loginRateLimit(key).success).toBe(false);
  });

  it("tracks IPs independently", () => {
    expect(loginRateLimit(ip(2)).success).toBe(true);
  });
});

describe("loginUsernameRateLimit (per username)", () => {
  it("allows 10 attempts across any IPs, then blocks", () => {
    const name = user("target");
    for (let i = 0; i < 10; i++) {
      expect(loginUsernameRateLimit(name).success).toBe(true);
    }
    expect(loginUsernameRateLimit(name).success).toBe(false);
  });

  it("is case-insensitive and trims whitespace", () => {
    const name = user("casey");
    for (let i = 0; i < 10; i++) loginUsernameRateLimit(name);
    expect(loginUsernameRateLimit(`  ${name.toUpperCase()} `).success).toBe(false);
  });

  it("tracks usernames independently", () => {
    expect(loginUsernameRateLimit(user("someone-else")).success).toBe(true);
  });
});

describe("resetLoginRateLimits", () => {
  it("clears both counters so a proven user starts fresh", () => {
    const key = ip(3);
    const name = user("resettable");
    for (let i = 0; i < 5; i++) loginRateLimit(key);
    for (let i = 0; i < 10; i++) loginUsernameRateLimit(name);
    expect(loginRateLimit(key).success).toBe(false);
    expect(loginUsernameRateLimit(name).success).toBe(false);

    resetLoginRateLimits(key, name);

    expect(loginRateLimit(key).success).toBe(true);
    expect(loginUsernameRateLimit(name).success).toBe(true);
  });

  it("resetting an unknown key is a no-op", () => {
    expect(() => resetRateLimit("never-seen", "login")).not.toThrow();
  });
});
