"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { loginAction, verifyTotpAction } from "./actions";

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await loginAction(username, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.requiresTotp) {
      setStep("totp");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await verifyTotpAction(username, totpCode);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Myah Travels Admin
        </h1>

        {step === "credentials" && (
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" isLoading={isLoading} className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === "totp" && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app.
            </p>
            <Input
              label="Authenticator Code"
              name="totp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" isLoading={isLoading} className="w-full">
              Verify
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
