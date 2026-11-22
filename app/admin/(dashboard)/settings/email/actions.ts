"use server";

import { requireAuth } from "@/lib/auth";
import { retryFailedEmails } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function retryFailedEmailsAction() {
  await requireAuth();
  const count = await retryFailedEmails();
  revalidatePath("/admin/settings/email");
  redirect(
    `/admin/settings/email?success=${encodeURIComponent(
      count > 0
        ? `${count} failed email${count === 1 ? "" : "s"} moved back to the queue. They'll go out on the next send run.`
        : "No failed emails to retry."
    )}`
  );
}
