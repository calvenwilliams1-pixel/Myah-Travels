import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("requireAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws in production even with DISABLE_AUTH=true", async () => {
    process.env.NODE_ENV = "production";
    process.env.DISABLE_AUTH = "true";
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("throws in production with DISABLE_AUTH unset", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.DISABLE_AUTH;
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("throws in dev when DISABLE_AUTH unset", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.DISABLE_AUTH;
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("returns the first user in dev when DISABLE_AUTH=true", async () => {
    process.env.NODE_ENV = "development";
    process.env.DISABLE_AUTH = "true";
    const { requireAuth } = await import("./index");
    const user = await requireAuth();
    expect(user).toBeTruthy();
    expect(user).toHaveProperty("id");
  });
});
