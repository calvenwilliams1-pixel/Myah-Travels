"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface ForgetPersonButtonProps {
  personId: number;
  personLabel: string;
}

export default function ForgetPersonButton({ personId, personLabel }: ForgetPersonButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleForget() {
    const confirmed = confirm(
      "Forget " + personLabel + "?\n\n" +
      "This permanently deletes the person record, all their notes, and their trip history. " +
      "It cannot be undone. Portal memberships are preserved but will no longer link to a person."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    await fetch("/api/people/" + personId, { method: "DELETE" });
    setIsDeleting(false);
    router.push("/admin/clients");
  }

  return (
    <Button variant="danger" onClick={handleForget} disabled={isDeleting}>
      {isDeleting ? "Forgetting..." : "Forget this client"}
    </Button>
  );
}
