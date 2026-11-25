"use client";

import React, { useState } from "react";
import {
  WELCOME_TEMPLATES,
  type WelcomeContent,
  type WelcomeTemplateId,
} from "@/lib/welcome";
import { saveWelcomeSettings } from "./actions";

interface Props {
  initialTemplate: WelcomeTemplateId;
  initialContent: WelcomeContent;
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

/**
 * The welcome editor (Cal, 2026-11-24): designed templates only. The
 * freeform canvas editor that used to sit below this form rendered
 * the welcome too small on phones, and Cal had it dropped entirely
 * later the same day, code and all. Her welcome words and photo live
 * in these fields now; they were carried over from the canvas before
 * it went, so nothing she wrote was lost.
 *
 * The photo is a real upload now, the same /api/upload the portal
 * hero editor uses: pick a picture and its address fills in on its
 * own, instead of pasting an address by hand.
 */
export default function WelcomeSettingsForm({
  initialTemplate,
  initialContent,
}: Props) {
  const [template, setTemplate] = useState(initialTemplate);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function set<K extends keyof WelcomeContent>(key: K, value: string) {
    setContent((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "welcome");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.filePath) {
        set("photo", `/api/uploads/${data.filePath}`);
      } else {
        setUploadError("That photo didn't upload. Try again.");
      }
    } catch {
      setUploadError("That photo didn't upload. Try again.");
    }

    setUploading(false);
    e.target.value = "";
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveWelcomeSettings({ template, content });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <h2 className="mb-1 text-lg font-semibold">Welcome section</h2>
      <p className="mb-5 text-sm text-gray-600">
        This is the first thing visitors see. Pick a designed layout, add your photo and
        words. It always looks right, on phones too.
      </p>

      <div className="space-y-5">
        <div>
          <span className={labelCls}>Layout</span>
          <div className="grid gap-2 md:grid-cols-3">
            {WELCOME_TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-lg border px-4 py-3 ${
                  template === t.id ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="welcome-template"
                  checked={template === t.id}
                  onChange={() => { setTemplate(t.id); setSaved(false); }}
                  className="sr-only"
                />
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block text-sm text-gray-600">{t.blurb}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className={labelCls}>Photo</span>
          {content.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.photo}
              alt=""
              className="mb-2 h-24 w-auto rounded-lg border border-gray-200 object-cover"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <span className="inline-block min-h-[44px] rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                {uploading ? "Uploading..." : content.photo ? "Replace photo" : "Upload a photo"}
              </span>
            </label>
            <span className="text-sm text-gray-500">
              Pick a photo from your phone or computer. It fills in here on its own.
            </span>
          </div>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>

        <div>
          <label className={labelCls} htmlFor="welcome-heading">Heading</label>
          <input
            id="welcome-heading"
            className={inputCls}
            value={content.heading}
            onChange={(e) => set("heading", e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="welcome-text">Your words</label>
          <textarea
            id="welcome-text"
            className={inputCls}
            rows={4}
            value={content.text}
            onChange={(e) => set("text", e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="welcome-btn-label">Button label</label>
            <input
              id="welcome-btn-label"
              className={inputCls}
              value={content.buttonLabel}
              onChange={(e) => set("buttonLabel", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="welcome-btn-href">Button goes to</label>
            <input
              id="welcome-btn-href"
              className={inputCls}
              value={content.buttonHref}
              onChange={(e) => set("buttonHref", e.target.value)}
              placeholder="/contact"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save welcome settings"}
        </button>
        {saved && <span className="text-sm text-gray-600">Saved ✓. Check the homepage.</span>}
      </div>
    </div>
  );
}
