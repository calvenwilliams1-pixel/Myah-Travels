"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { updateClient, softDeleteClient, anonymizeClient, mergeClients } from "@/lib/clients";
import { logActivity } from "@/lib/logging";

export async function updateClientAction(formData: FormData) {
  const user = await requireAuth();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "new");
  const notes = String(formData.get("notes") || "");

  if (!id) return { error: "No client ID" };

  await updateClient(id, { status, notes });

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "client",
    entityId: id,
    details: `Updated client status to ${status}`,
  });

  redirect(`/admin/clients/${id}`);
}

export async function deleteClientAction(formData: FormData) {
  const user = await requireAuth();
  const id = Number(formData.get("id"));

  if (!id) return;

  await softDeleteClient(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "client",
    entityId: id,
    details: "Soft deleted client",
  });

  redirect("/admin/clients");
}

export async function anonymizeClientAction(formData: FormData) {
  const user = await requireAuth();
  const id = Number(formData.get("id"));

  if (!id) return;

  await anonymizeClient(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "client",
    entityId: id,
    details: "Anonymized client (PIPEDA)",
  });

  redirect("/admin/clients");
}

export async function mergeClientsAction(primaryId: number, mergedId: number) {
  const user = await requireAuth();
  await mergeClients(primaryId, mergedId);

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "client",
    entityId: primaryId,
    details: `Merged client ${mergedId} into ${primaryId}`,
  });

  redirect(`/admin/clients/${primaryId}`);
}
