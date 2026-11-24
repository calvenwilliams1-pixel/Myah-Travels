"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  WORDING_BY_KEY,
  substituteTokens,
  validateWordingValue,
} from "@/lib/wording/registry";
import { STUDIO_SURFACES, type StudioSurfaceId } from "@/lib/wording/studio";
import { saveWordingField, resetWordingField, sendTestInviteEmail } from "./actions";

/**
 * The wording studio: instead of a form, each thing a client reads
 * is shown as a preview of itself, and the words are edited on the
 * preview. Tap a line (it has a dashed outline), change it in the
 * panel, and the preview updates as you type. Saving, validation,
 * and the standard-words fallback are the same server actions the
 * form used; only the editing surface changed.
 */

const SAMPLE_NAME = "Alex";
const SAMPLE_PORTAL = "Sample Trip";

interface WordingStudioProps {
  /** Resolved words per registry key (override, else the standard). */
  initial: Record<string, { value: string; hasOverride: boolean }>;
  siteName: string;
  primaryColor: string;
  instagramUrl: string;
  youtubeUrl: string;
  /** The sample trip expiry, formatted the way a client's email shows it. */
  sampleExpiryLabel: string;
}

export default function WordingStudio({
  initial,
  siteName,
  primaryColor,
  instagramUrl,
  youtubeUrl,
  sampleExpiryLabel,
}: WordingStudioProps) {
  const keys = useMemo(() => Object.keys(initial), [initial]);
  const [buffers, setBuffers] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.map((k) => [k, initial[k].value]))
  );
  const [saved, setSaved] = useState<Record<string, string>>(buffers);
  const [overridden, setOverridden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(keys.map((k) => [k, initial[k].hasOverride]))
  );
  const [surface, setSurface] = useState<StudioSurfaceId>("email");
  const [emailKind, setEmailKind] = useState<"trip" | "promo">("trip");
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testState, setTestState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; to: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const panelRef = useRef<HTMLDivElement>(null);

  const dirty = keys.some((k) => buffers[k] !== saved[k]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const subs = { name: SAMPLE_NAME, portal: SAMPLE_PORTAL, date: sampleExpiryLabel };
  const text = (key: string) => substituteTokens(buffers[key] ?? "", subs);

  /** Body words render the portal name bold, like the real email. */
  const bodyText = (key: string) => {
    const parts = text(key).split(SAMPLE_PORTAL);
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {i > 0 && <strong>{SAMPLE_PORTAL}</strong>}
        {part}
      </React.Fragment>
    ));
  };

  const select = (key: string) => {
    setSelected(key);
    setServerError(null);
    setSavedFlash(false);
    requestAnimationFrame(() =>
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
  };

  const seg = (key: string, base: string) => ({
    onClick: () => select(key),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        select(key);
      }
    },
    role: "button" as const,
    tabIndex: 0,
    title: "Tap to edit these words",
    "aria-label": `Edit: ${WORDING_BY_KEY[key]?.label ?? key}`,
    className: `${base} cursor-pointer rounded-sm outline-dashed outline-1 outline-offset-2 outline-gray-400/80 hover:outline-gray-500 ${
      selected === key ? "!outline-solid !outline-2 !outline-primary bg-primary/5" : ""
    }`,
  });

  const entry = selected ? WORDING_BY_KEY[selected] : null;
  const clientError =
    entry && selected ? validateWordingValue(entry, buffers[selected]) : null;
  const selectedDirty = selected ? buffers[selected] !== saved[selected] : false;

  async function handleSave() {
    if (!selected || !entry) return;
    setSaving(true);
    setServerError(null);
    const result = await saveWordingField(selected, buffers[selected]);
    setSaving(false);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    if (buffers[selected].trim() === "") {
      const standard = entry.defaultValue;
      setBuffers((b) => ({ ...b, [selected]: standard }));
      setSaved((s) => ({ ...s, [selected]: standard }));
      setOverridden((o) => ({ ...o, [selected]: false }));
    } else {
      setSaved((s) => ({ ...s, [selected]: buffers[selected] }));
      setOverridden((o) => ({ ...o, [selected]: true }));
    }
    setSavedFlash(true);
  }

  async function handleReset() {
    if (!selected || !entry) return;
    setSaving(true);
    setServerError(null);
    const result = await resetWordingField(selected);
    setSaving(false);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }
    setBuffers((b) => ({ ...b, [selected]: entry.defaultValue }));
    setSaved((s) => ({ ...s, [selected]: entry.defaultValue }));
    setOverridden((o) => ({ ...o, [selected]: false }));
    setSavedFlash(true);
  }

  async function handleTestSend() {
    setTestState({ kind: "sending" });
    const result = await sendTestInviteEmail(buffers);
    if ("error" in result) {
      setTestState({ kind: "error", message: result.error });
    } else {
      setTestState({ kind: "sent", to: result.to });
    }
  }

  const brand = primaryColor || "#4a7c59";
  const activeSurface = STUDIO_SURFACES.find((s) => s.id === surface)!;

  return (
    <div className="space-y-5">
      {/* Surface picker */}
      <div className="flex flex-wrap gap-2">
        {STUDIO_SURFACES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSurface(s.id);
              setSelected(null);
            }}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              surface === s.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:border-primary/60"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 max-w-2xl">
        {activeSurface.blurb} Tap any words with a dashed outline to change them. The
        preview updates as you type, and nothing is final until you save.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Preview */}
        <div className="w-full lg:flex-1 flex justify-center bg-gray-100 rounded-xl p-3 sm:p-5">
          {surface === "email" && (
            <div className="w-full max-w-[560px]">
              <div className="flex gap-2 mb-3">
                {(
                  [
                    ["trip", "Trip portal"],
                    ["promo", "Explore portal"],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setEmailKind(kind)}
                    className={`min-h-[40px] rounded-full px-3 py-1.5 text-sm border ${
                      emailKind === kind
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Subject:{" "}
                <span {...seg("invite_subject", "text-gray-800 font-medium")}>
                  {text("invite_subject")}
                </span>
              </p>
              <div className="bg-white rounded-2xl overflow-hidden shadow">
                <div
                  className="text-center text-white py-4 px-6"
                  style={{ backgroundColor: brand, fontFamily: "Georgia, serif", fontSize: 22 }}
                >
                  {siteName}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/welcome-banner.jpg" alt="" className="w-full block" />
                <div className="px-6 sm:px-10 py-8">
                  <p
                    {...seg(
                      "invite_eyebrow",
                      "text-xs font-bold uppercase tracking-[2px] mb-2.5"
                    )}
                    style={{ color: brand }}
                  >
                    {text("invite_eyebrow")}
                  </p>
                  <h3
                    className="text-[27px] leading-tight mb-4 text-gray-900"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {SAMPLE_PORTAL}
                  </h3>
                  <p {...seg("invite_greeting", "text-base text-gray-600 leading-relaxed mb-2")}>
                    {text("invite_greeting")}
                  </p>
                  {emailKind === "trip" ? (
                    <p {...seg("invite_body_trip", "text-base text-gray-600 leading-relaxed")}>
                      {bodyText("invite_body_trip")}
                    </p>
                  ) : (
                    <p {...seg("invite_body_promo", "text-base text-gray-600 leading-relaxed")}>
                      {bodyText("invite_body_promo")}
                    </p>
                  )}
                  <div className="text-center my-7">
                    <span
                      className="inline-block text-white px-10 py-3.5 rounded-full font-semibold"
                      style={{ backgroundColor: brand }}
                    >
                      Access Portal
                    </span>
                  </div>
                  <p
                    {...seg(
                      "invite_fallback_hint",
                      "text-xs text-gray-400 text-center leading-relaxed"
                    )}
                  >
                    {text("invite_fallback_hint")}
                  </p>
                  <p className="text-xs text-center mt-1" style={{ color: brand }}>
                    (the client&apos;s own link shows here)
                  </p>
                  {emailKind === "trip" ? (
                    <p
                      {...seg(
                        "invite_expiry_trip",
                        "text-[13px] text-gray-400 text-center leading-relaxed mt-6"
                      )}
                    >
                      {text("invite_expiry_trip")}
                    </p>
                  ) : (
                    <p
                      {...seg(
                        "invite_expiry_promo",
                        "text-[13px] text-gray-400 text-center leading-relaxed mt-6"
                      )}
                    >
                      {text("invite_expiry_promo")}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 px-6 py-5 text-center">
                  {(instagramUrl || youtubeUrl) && (
                    <p className="text-[13px] text-gray-500 mb-1.5">
                      Follow along:{" "}
                      {[instagramUrl && "Instagram", youtubeUrl && "YouTube"]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    © {new Date().getFullYear()} {siteName}.{" "}
                    <span {...seg("invite_footer_reason", "")}>{text("invite_footer_reason")}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestSend}
                  disabled={testState.kind === "sending"}
                  className="min-h-[44px] rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary/60 disabled:opacity-50"
                >
                  {testState.kind === "sending" ? "Sending..." : "Send me a test email"}
                </button>
                {testState.kind === "sent" && (
                  <span className="text-sm text-gray-600">
                    Test sent to {testState.to}. It uses the words as they are now, saved or
                    not.
                  </span>
                )}
                {testState.kind === "error" && (
                  <span className="text-sm text-red-600">{testState.message}</span>
                )}
              </div>
            </div>
          )}

          {surface === "access" && (
            <div className="w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/welcome-banner.jpg" alt="" className="w-full block" />
              <div className="px-6 py-7 text-center">
                <p
                  {...seg("invite_eyebrow", "text-xs font-bold uppercase tracking-[2px] mb-2")}
                  style={{ color: brand }}
                >
                  {text("invite_eyebrow")}
                </p>
                <h3
                  className="text-2xl text-gray-900 mb-5"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {SAMPLE_PORTAL}
                </h3>
                <div
                  className="w-full text-white font-semibold py-3.5 rounded-lg"
                  style={{ backgroundColor: brand }}
                >
                  Continue to Portal
                </div>
                <p {...seg("access_note", "text-sm text-gray-500 leading-relaxed mt-5")}>
                  {text("access_note")}
                </p>
              </div>
            </div>
          )}

          {surface === "deadlink" && (
            <div className="w-full max-w-[420px] bg-white rounded-2xl shadow px-6 py-8 text-center">
              <h3 {...seg("deadlink_heading", "text-xl font-semibold text-gray-900 mb-3")}>
                {text("deadlink_heading")}
              </h3>
              <p {...seg("deadlink_body", "text-sm text-gray-600 leading-relaxed")}>
                {text("deadlink_body")}
              </p>
            </div>
          )}

          {surface === "session" && (
            <div className="w-full max-w-[420px] bg-white rounded-2xl shadow px-6 py-8 text-center">
              <h3 {...seg("session_heading", "text-xl font-semibold text-gray-900 mb-3")}>
                {text("session_heading")}
              </h3>
              <p {...seg("session_body", "text-sm text-gray-600 leading-relaxed")}>
                {text("session_body")}
              </p>
            </div>
          )}

          {surface === "about" && (
            <div className="w-full max-w-[560px] bg-white rounded-2xl shadow px-6 sm:px-10 py-8">
              <h3
                className="text-2xl text-gray-900 mb-4"
                style={{ fontFamily: "Georgia, serif" }}
              >
                About
              </h3>
              <p {...seg("bio_text", "text-base text-gray-600 leading-relaxed")}>
                {text("bio_text")}
              </p>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div
          ref={panelRef}
          className="w-full lg:w-96 shrink-0 bg-white border border-gray-200 rounded-xl p-5 lg:sticky lg:top-24"
        >
          {!entry || !selected ? (
            <p className="text-sm text-gray-600">
              Nothing picked yet. Tap any words with a dashed outline in the preview and
              they will open here for editing.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-800">{entry.label}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    overridden[selected]
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {overridden[selected] ? "Your words" : "Standard words"}
                </span>
              </div>
              {entry.helper && <p className="text-sm text-gray-500">{entry.helper}</p>}
              {entry.behaviourNote && (
                <p className="text-sm text-gray-500">{entry.behaviourNote}</p>
              )}
              {entry.multiline ? (
                <textarea
                  value={buffers[selected]}
                  onChange={(e) =>
                    setBuffers((b) => ({ ...b, [selected]: e.target.value }))
                  }
                  rows={5}
                  maxLength={entry.maxLength + 200}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={buffers[selected]}
                  onChange={(e) =>
                    setBuffers((b) => ({ ...b, [selected]: e.target.value }))
                  }
                  maxLength={entry.maxLength + 200}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {entry.allowedTokens.length > 0
                    ? `You can use ${entry.allowedTokens.join(", ")} and they fill themselves in.`
                    : ""}
                  {entry.requiredTokens.length > 0
                    ? ` ${entry.requiredTokens.join(", ")} has to stay.`
                    : ""}
                </span>
                <span>
                  {buffers[selected].length}/{entry.maxLength}
                </span>
              </div>
              {(clientError || serverError) && (
                <p className="text-sm text-red-600">{serverError ?? clientError}</p>
              )}
              {savedFlash && !selectedDirty && (
                <p className="text-sm text-primary">Saved. Clients see these words now.</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedDirty || !!clientError}
                  className="min-h-[44px] rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                {(overridden[selected] || buffers[selected] !== entry.defaultValue) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="min-h-[44px] rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/60 disabled:opacity-50"
                  >
                    Use the standard words
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Saving an empty box brings the standard words back, so a line never shows
                up blank.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
