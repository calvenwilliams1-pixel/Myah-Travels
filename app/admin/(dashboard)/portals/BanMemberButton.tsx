"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { banMemberAction } from "./actions";

export default function BanMemberButton({
  portalId,
  memberId,
}: {
  portalId: number;
  memberId: number;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const reasonRef = React.useRef<HTMLInputElement>(null);

  function handleClick() {
    const reason = window.prompt(
      "Reason for banning this member? (optional — leave blank for none)"
    );
    if (reason === null) return; // user cancelled
    if (reasonRef.current) reasonRef.current.value = reason;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={banMemberAction}>
      <input type="hidden" name="portalId" value={portalId} />
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="reason" ref={reasonRef} />
      <Button variant="danger" size="sm" type="button" onClick={handleClick}>
        Ban
      </Button>
    </form>
  );
}
