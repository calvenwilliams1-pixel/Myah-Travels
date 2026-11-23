"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordAction } from "./actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("new_password", newPassword);
      formData.set("confirm_password", confirmPassword);
      const result = await resetPasswordAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Your password has been changed. You can sign in with it now.
        </p>
        <Link href="/admin/login" className="block">
          <Button variant="solid" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New Password"
        name="new_password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        autoFocus
      />
      <p className="text-xs text-gray-500 -mt-2">Minimum 8 characters</p>
      <Input
        label="Confirm New Password"
        name="confirm_password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" variant="solid" isLoading={isLoading} className="w-full">
        Set new password
      </Button>
    </form>
  );
}
