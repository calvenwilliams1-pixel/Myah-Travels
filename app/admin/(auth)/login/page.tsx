"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function finishLogin(data: { requiresSetup?: boolean }) {
    router.push(data.requiresSetup ? "/admin/setup" : "/admin");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.success && data.requiresTotp) {
        // Password accepted — a code is still required before a session exists.
        setNeedsTotp(true);
        return;
      }

      if (data.success) {
        finishLogin(data);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, trustDevice }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }

      if (data.success) {
        finishLogin(data);
      }
    } catch (err) {
      console.error("TOTP verification error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          MyCalTravels Admin
        </h1>

        {needsTotp ? (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter the 6-digit code from your authenticator app.
            </p>
            <Input
              label="Authentication code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Trust this device for 30 days (skip the code on this device)
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" variant="solid" isLoading={isLoading} className="w-full">
              Verify
            </Button>
            <button
              type="button"
              className="w-full text-sm text-gray-500 hover:underline"
              onClick={() => {
                setNeedsTotp(false);
                setCode("");
                setError(null);
              }}
            >
              Back to login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="submit" variant="solid" isLoading={isLoading} className="w-full">
              Continue
            </Button>
            <p className="text-center">
              <a href="/admin/forgot-password" className="text-sm text-gray-500 hover:underline">
                Forgot your password?
              </a>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
