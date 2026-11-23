"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("username", username);
      const result = await requestPasswordResetAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Forgot your password?
        </h1>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              If that account exists, a reset link is on its way to the
              site&apos;s email address. The link works for 1 hour.
            </p>
            <p className="text-center">
              <Link href="/admin/login" className="text-sm text-gray-500 hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter your username and we&apos;ll email you a link to set a
              new password.
            </p>
            <Input
              label="Username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" variant="solid" isLoading={isLoading} className="w-full">
              Email me a reset link
            </Button>
            <p className="text-center">
              <Link href="/admin/login" className="text-sm text-gray-500 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
