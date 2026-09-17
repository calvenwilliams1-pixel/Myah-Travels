"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddMemberFormProps {
  portalId: number;
  action: (formData: FormData) => void | Promise<void>;
}

export default function AddMemberForm({ portalId, action }: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);

  async function handleEmailBlur() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setLookupMessage(null);
      return;
    }

    setLookupPending(true);
    try {
      const res = await fetch("/api/people/lookup?email=" + encodeURIComponent(trimmed));
      const data = await res.json();
      if (data.person) {
        // Returning client — fill name if empty
        if (!name.trim() && data.person.canonicalName) {
          setName(data.person.canonicalName);
        }
        setLookupMessage("Returning client" + (data.person.canonicalName ? " — " + data.person.canonicalName : ""));
      } else {
        setLookupMessage("New client");
      }
    } catch {
      setLookupMessage(null);
    }
    setLookupPending(false);
  }

  return (
    <form action={action} className="flex flex-col gap-3 mb-4">
      <input type="hidden" name="portalId" value={portalId} />
      <div className="flex gap-3">
        <Input
          name="email"
          type="email"
          placeholder="member@email.com"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLookupMessage(null);
          }}
          onBlur={handleEmailBlur}
        />
        <Input
          name="name"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="secondary">Add</Button>
      </div>
      <div aria-live="polite" className="text-xs">
        {lookupPending && <p className="text-gray-400">Looking up...</p>}
        {!lookupPending && lookupMessage && (
          <p className={lookupMessage.startsWith("Returning") ? "text-primary" : "text-gray-500"}>
            {lookupMessage}
          </p>
        )}
      </div>
    </form>
  );
}
