import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in production even with DISABLE_AUTH=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DISABLE_AUTH", "true");
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("throws in production with DISABLE_AUTH unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DISABLE_AUTH", "");
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("throws in dev when DISABLE_AUTH unset", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DISABLE_AUTH", "");
    const { requireAuth } = await import("./index");
    await expect(requireAuth()).rejects.toThrow(/auth/i);
  });

  it("returns the first user in dev when DISABLE_AUTH=true", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DISABLE_AUTH", "true");
    const { requireAuth } = await import("./index");
    const user = await requireAuth();
    expect(user).toBeTruthy();
    expect(user).toHaveProperty("id");
  });
});
