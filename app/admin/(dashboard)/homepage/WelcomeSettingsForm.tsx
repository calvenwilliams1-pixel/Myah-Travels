"use client";

import React, { useState } from "react";
import {
  WELCOME_TEMPLATES,
  type WelcomeContent,
  type WelcomeContentSource,
  type WelcomeTemplateId,
} from "@/lib/welcome";
import { saveWelcomeSettings } from "./actions";

interface Props {
  initialMode: "canvas" | "template";
  initialTemplate: WelcomeTemplateId;
  initialContent: WelcomeContent;
  contentSource: WelcomeContentSource;
  legacySummary: string;
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export default function WelcomeSettingsForm({
  initialMode,
  initialTemplate,
  initialContent,
  contentSource,
  legacySummary,
}: Props) {
  const [mode, setMode] = useState(initialMode);
  const [template, setTemplate] = useState(initialTemplate);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof WelcomeContent>(key: K, value: string) {
    setContent((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  async function onSave() {
    setSaving(true);
    try {
      await saveWelcomeSettings({ mode, template, content });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-200 p-5">
      <h2 className="mb-1 text-lg font-semibold">Welcome section</h2>
      <p className="mb-5 text-sm text-gray-600">
        This is the first thing visitors see. Use a designed template — it always looks right,
        on phones too — or keep the freeform canvas editor below.
      </p>

      {contentSource === "canvas" && (
        <p className="mb-4 rounded-lg bg-primary/10 px-4 py-3 text-sm text-gray-700">
          Good news: your current welcome photo and words fit the templates, so they&apos;ve been
          carried into the fields below. Check them, pick a layout, save, and switch over whenever
          you&apos;re ready.
        </p>
      )}
      {legacySummary && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-gray-800">Your current welcome words</p>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{legacySummary}</pre>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ve reshaped your canvas welcome, so the template starts fresh — copy anything
            you want to keep into the fields below.
          </p>
        </div>
      )}

      <div className="mb-5 space-y-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
          <input
            type="radio"
            name="welcome-mode"
            checked={mode === "template"}
            onChange={() => { setMode("template"); setSaved(false); }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Designed template (recommended)</span>
            <span className="block text-sm text-gray-600">
              Pick a layout, add your photo and words. Text stays full-size on phones.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-3">
          <input
            type="radio"
            name="welcome-mode"
            checked={mode === "canvas"}
            onChange={() => { setMode("canvas"); setSaved(false); }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">Canvas editor</span>
            <span className="block text-sm text-gray-600">
              The freeform designer below. Nothing you made there is deleted — you can switch back
              any time.
            </span>
          </span>
        </label>
      </div>

      {mode === "template" && (
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
            <label className={labelCls} htmlFor="welcome-photo">Photo</label>
            <input
              id="welcome-photo"
              className={inputCls}
              value={content.photo}
              onChange={(e) => set("photo", e.target.value)}
              placeholder="/images/welcome-banner.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              The photo&apos;s address — one you&apos;ve uploaded looks like /api/uploads/… Leave it
              as is to keep your current photo.
            </p>
            {content.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.photo} alt="" className="mt-2 h-24 w-auto rounded-lg border border-gray-200 object-cover" />
            )}
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
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save welcome settings"}
        </button>
        {saved && <span className="text-sm text-gray-600">Saved ✓ — check the homepage.</span>}
      </div>
    </div>
  );
}
