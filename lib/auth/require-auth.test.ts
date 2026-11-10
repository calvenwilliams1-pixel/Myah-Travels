import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("checkSetupRequired", () => {
  it("passes when setup complete and no pending password change", async () => {
    const { checkSetupRequired } = await import("./index");
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: true, mustChangePassword: false })
    ).not.toThrow();
  });

  it("throws when setup is incomplete", async () => {
    const { checkSetupRequired, AuthError } = await import("./index");
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: false, mustChangePassword: false })
    ).toThrow(AuthError);
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: false, mustChangePassword: false })
    ).toThrow(/setup/i);
  });

  it("throws when a password change is pending", async () => {
    const { checkSetupRequired, AuthError } = await import("./index");
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: true, mustChangePassword: true })
    ).toThrow(AuthError);
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: true, mustChangePassword: true })
    ).toThrow(/setup/i);
  });

  it("throws when both flags are unmet", async () => {
    const { checkSetupRequired } = await import("./index");
    expect(() =>
      checkSetupRequired({ hasCompletedSetup: false, mustChangePassword: true })
    ).toThrow(/setup/i);
  });
});

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
});

describe("requireSession", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the first user in dev when DISABLE_AUTH=true", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DISABLE_AUTH", "true");
    const { requireSession } = await import("./index");
    const user = await requireSession();
    expect(user).toBeTruthy();
    expect(user).toHaveProperty("id");
  });
});
