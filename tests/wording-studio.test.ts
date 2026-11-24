import { describe, it, expect } from "vitest";
import { WORDING_REGISTRY } from "@/lib/wording/registry";
import { STUDIO_SURFACES, keysMissingFromStudio } from "@/lib/wording/studio";

// The studio replaced the form-style wording page. These pins keep
// every registry word reachable in the studio, so a future registry
// addition cannot ship without a surface to edit it on.
describe("Wording studio surfaces", () => {
  it("covers every registry key", () => {
    expect(keysMissingFromStudio()).toEqual([]);
  });

  it("the email surface holds exactly the invite group keys", () => {
    const email = STUDIO_SURFACES.find((s) => s.id === "email")!;
    const inviteKeys = WORDING_REGISTRY.filter((e) => e.group === "invite").map(
      (e) => e.key
    );
    expect([...email.keys].sort()).toEqual([...inviteKeys].sort());
  });

  it("invite_eyebrow is on both the email and the access page", () => {
    const on = (id: string) =>
      STUDIO_SURFACES.find((s) => s.id === id)!.keys.includes("invite_eyebrow");
    expect(on("email")).toBe(true);
    expect(on("access")).toBe(true);
  });

  it("every surface key is a real registry key", () => {
    const known = new Set(WORDING_REGISTRY.map((e) => e.key));
    for (const surface of STUDIO_SURFACES) {
      for (const key of surface.keys) {
        expect(known.has(key)).toBe(true);
      }
    }
  });
});
