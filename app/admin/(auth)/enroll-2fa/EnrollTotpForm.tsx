"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function EnrollTotpForm() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/enroll-2fa/start", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setSecret(d.secret);
        setOtpauthUrl(d.otpauthUrl);
      })
      .catch(() => setError("Failed to start enrollment"));
  }, []);

  async function confirm() {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator");
      return;
    }
    setIsSaving(true);
    setError(null);
    const res = await fetch("/api/auth/enroll-2fa/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Invalid code");
      setIsSaving(false);
      return;
    }
    router.push("/admin");
  }

  if (!secret) {
    return <p className="text-sm text-gray-500">Generating secret...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Manual entry secret:</p>
        <p className="font-mono text-sm break-all">{secret}</p>
      </div>

      {otpauthUrl && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">
            Or if you prefer to copy the otpauth URL into your authenticator:
          </p>
          <p className="font-mono text-xs break-all">{otpauthUrl}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          6-digit code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-mono text-lg tracking-widest"
          placeholder="000000"
          autoComplete="one-time-code"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={confirm} disabled={isSaving || code.length !== 6}>
        {isSaving ? "Confirming..." : "Enable 2FA"}
      </Button>
    </div>
  );
}
