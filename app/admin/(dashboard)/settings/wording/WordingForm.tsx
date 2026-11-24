"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  WORDING_GROUPS,
  WORDING_REGISTRY,
  WORDING_BY_KEY,
  type WordingEntry,
} from "@/lib/wording/registry";
import {
  saveWordingField,
  resetWordingField,
  previewInviteEmail,
  sendTestInviteEmail,
} from "./actions";

interface FieldState {
  value: string;
  hasOverride: boolean;
}

function WordingField({
  entry,
  state,
  onSaved,
}: {
  entry: WordingEntry;
  state: FieldState;
  onSaved: (key: string, value: string, hasOverride: boolean) => void;
}) {
  const [value, setValue] = useState(state.value);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = value !== state.value;

  const save = () => {
    startTransition(async () => {
      const result = await saveWordingField(entry.key, value);
      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setIsError(false);
        setMessage(value.trim() === "" ? "Standard words restored." : "Saved.");
        onSaved(entry.key, value, value.trim() !== "");
        router.refresh();
      }
    });
  };

  const reset = () => {
    startTransition(async () => {
      const result = await resetWordingField(entry.key);
      if ("error" in result) {
        setIsError(true);
        setMessage(result.error);
      } else {
        setValue("");
        setIsError(false);
        setMessage("Standard words restored.");
        onSaved(entry.key, "", false);
        router.refresh();
      }
    });
  };

  return (
    <div className="border-t border-gray-100 py-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={`wording-${entry.key}`} className="font-medium">
          {entry.label}
        </label>
        <span className="text-xs text-gray-400">
          {state.hasOverride ? "Your words" : "Standard words"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-0.5">
        Shows on: {entry.appearsAt.join(" · ")}
      </p>
      {entry.helper && <p className="text-sm text-gray-500 mt-0.5">{entry.helper}</p>}
      {entry.behaviourNote && (
        <p className="text-sm text-gray-500 mt-0.5">
          Changing this wording does not change how the link works.
        </p>
      )}
      {entry.multiline ? (
        <textarea
          id={`wording-${entry.key}`}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40"
          rows={entry.maxLength > 200 ? 4 : 3}
          maxLength={entry.maxLength + 100}
          placeholder={entry.defaultValue}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      ) : (
        <input
          id={`wording-${entry.key}`}
          type="text"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
          maxLength={entry.maxLength + 100}
          placeholder={entry.defaultValue}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      <div className="mt-1.5 flex items-center gap-3">
        <span className="text-xs text-gray-400">
          {(value.trim() === "" ? entry.defaultValue.length : value.length)} / {entry.maxLength}
          {value.trim() === "" ? " (standard words)" : ""}
        </span>
        <Button type="button" size="sm" onClick={save} disabled={pending || !dirty}>
          Save
        </Button>
        {state.hasOverride && (
          <Button type="button" size="sm" variant="secondary" onClick={reset} disabled={pending}>
            Use standard words
          </Button>
        )}
        {message && (
          <span className={`text-sm ${isError ? "text-red-600" : "text-emerald-700"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

export default function WordingForm({
  initial,
}: {
  initial: Record<string, FieldState>;
}) {
  const [states, setStates] = useState(initial);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSaved = (key: string, value: string, hasOverride: boolean) =>
    setStates((prev) => ({ ...prev, [key]: { value, hasOverride } }));

  // Warn before leaving with unsaved edits anywhere on the page.
  const anyDirty = WORDING_REGISTRY.some(
    (entry) => (states[entry.key]?.value ?? "") !== (initial[entry.key]?.value ?? "")
  );
  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  const inviteValues = () => {
    const values: Record<string, string> = {};
    for (const entry of WORDING_REGISTRY) {
      if (entry.group !== "invite") continue;
      const v = states[entry.key]?.value ?? "";
      values[entry.key] = v.trim() === "" ? WORDING_BY_KEY[entry.key].defaultValue : v;
    }
    return values;
  };

  const showPreview = () => {
    startTransition(async () => {
      const result = await previewInviteEmail(inviteValues());
      setPreview(result);
      setPreviewMessage(null);
    });
  };

  const sendTest = () => {
    startTransition(async () => {
      const result = await sendTestInviteEmail(inviteValues());
      if ("error" in result) {
        setPreviewMessage(result.error);
      } else {
        setPreviewMessage(`Test email sent to ${result.to}. Its button uses a sample link, so it opens the expired-link page. That is on purpose.`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {WORDING_GROUPS.map((group) => (
        <Card key={group.id}>
          <h3 className="font-semibold">{group.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-2">{group.intro}</p>
          {WORDING_REGISTRY.filter((e) => e.group === group.id).map((entry) => (
            <WordingField
              key={entry.key}
              entry={entry}
              state={states[entry.key] ?? { value: "", hasOverride: false }}
              onSaved={onSaved}
            />
          ))}
          {group.id === "invite" && (
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={showPreview} disabled={pending}>
                  Preview the invite email
                </Button>
                <Button type="button" variant="secondary" onClick={sendTest} disabled={pending}>
                  Send me a test
                </Button>
                {previewMessage && <span className="text-sm text-gray-600">{previewMessage}</span>}
              </div>
              {preview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Subject: <span className="font-medium text-gray-700">{preview.subject}</span>
                  </p>
                  <iframe
                    title="Invite email preview"
                    srcDoc={preview.html}
                    className="w-full rounded-lg border border-gray-200"
                    style={{ height: 640 }}
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
