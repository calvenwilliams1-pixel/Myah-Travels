"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { PALETTES } from "@/lib/theme/palettes";
import {
  changePasswordAction,
  changeUsernameAction,
  applyThemeAction,
} from "./actions";

interface SetupWizardProps {
  initialUsername: string;
  mustChangePassword: boolean;
  hasCompletedSetup: boolean;
  initialStep: number;
}

export default function SetupWizard({
  initialUsername,
  mustChangePassword,
  hasCompletedSetup,
  initialStep,
}: SetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 fields
  const [username, setUsername] = useState(initialUsername);

  const steps = [
    { num: 1, label: "Password" },
    { num: 2, label: "Username" },
    { num: 3, label: "Theme" },
  ];

  function progressBar() {
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              className={
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium " +
                (step > s.num
                  ? "bg-primary text-white"
                  : step === s.num
                  ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                  : "bg-gray-200 text-gray-500")
              }
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={"text-xs " + (step === s.num ? "font-semibold" : "text-gray-500")}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-300" />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("currentPassword", currentPassword);
    fd.append("newPassword", newPassword);
    fd.append("confirmPassword", confirmPassword);

    const result = await changePasswordAction(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Reset user (hasCompletedSetup=true) is done after password change.
    // Fresh user advances to step 2.
    if (hasCompletedSetup) {
      router.push("/admin");
      router.refresh();
    } else {
      setStep(2);
    }
  }

  function renderStep1() {
    return (
      <form onSubmit={handleStep1Submit} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {hasCompletedSetup
            ? "Your password has been reset. Please choose a new one."
            : "Choose a new password for your account."}
        </p>
        <Input
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="New password (8+ characters)"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </Button>
      </form>
    );
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("username", username);

    const result = await changeUsernameAction(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStep(3);
  }

  async function handleSkipUsername() {
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("username", initialUsername);

    const result = await changeUsernameAction(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStep(3);
  }

  function renderStep2() {
    return (
      <form onSubmit={handleStep2Submit} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          You can keep your current username or choose a new one.
        </p>
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={handleSkipUsername}
          >
            Skip
          </Button>
        </div>
      </form>
    );
  }

  async function handleThemeSelect(paletteName: string) {
    setError(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("palette", paletteName);

    const result = await applyThemeAction(fd);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Pick a colour palette for your site. You can change it later in Settings.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PALETTES.map((palette) => (
            <button
              key={palette.name}
              type="button"
              disabled={loading}
              onClick={() => handleThemeSelect(palette.name)}
              className="border border-gray-200 rounded-lg p-3 text-left hover:border-primary transition-colors disabled:opacity-50"
            >
              <div className="flex gap-1 mb-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: palette.primary }}
                />
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: palette.accent }}
                />
              </div>
              <p className="text-sm font-medium">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome, {initialUsername}
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Let's get your account set up.
        </p>

        {progressBar()}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Card>
    </div>
  );
}
