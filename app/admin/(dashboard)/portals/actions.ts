"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  createPortal,
  archivePortal,
  softDeletePortal,
  addPortalMember,
  removePortalMember,
  sendMagicLinkEmails,
  createPortalNotice,
} from "@/lib/portal";
import { logActivity } from "@/lib/logging";

export async function createPortalAction(formData: FormData) {
  const user = await requireAuth();

  const name = String(formData.get("name") || "");
  const departureDate = String(formData.get("departureDate") || "");
  const returnDate = String(formData.get("returnDate") || "");

  if (!name) return { error: "Portal name is required" };

  const portal = await createPortal({
    name,
    departureDate: departureDate || undefined,
    returnDate: returnDate || undefined,
  });

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "portal",
    entityId: portal[0]?.id,
    details: `Created portal: ${name}`,
  });

  redirect(`/admin/portals/${portal[0]?.id}`);
}

export async function addMemberAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));
  const email = String(formData.get("email") || "");

  if (!portalId || !email) return { error: "Email required" };

  await addPortalMember(portalId, email);

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "portal_member",
    entityId: portalId,
    details: `Added member: ${email}`,
  });

  redirect(`/admin/portals/${portalId}`);
}

export async function removeMemberAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));
  const memberId = Number(formData.get("memberId"));

  await removePortalMember(memberId);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "portal_member",
    entityId: memberId,
    details: "Removed member",
  });

  redirect(`/admin/portals/${portalId}`);
}

export async function sendMagicLinksAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));

  await sendMagicLinkEmails(portalId);

  await logActivity({
    userId: Number(user.id),
    actionType: "email_sent",
    entityType: "portal",
    entityId: portalId,
    details: "Sent magic links to all members",
  });

  redirect(`/admin/portals/${portalId}`);
}

export async function addNoticeAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const isPinned = formData.get("isPinned") === "on";
  const isGlobalAnnouncement = formData.get("isGlobalAnnouncement") === "on";

  if (!title || !content) return { error: "Title and content required" };

  await createPortalNotice(portalId, { title, content, isPinned, isGlobalAnnouncement });

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "portal_notice",
    entityId: portalId,
    details: `Posted notice: ${title}`,
  });

  redirect(`/admin/portals/${portalId}`);
}

export async function archivePortalAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));

  await archivePortal(portalId);

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "portal",
    entityId: portalId,
    details: "Archived portal",
  });

  redirect("/admin/portals");
}

export async function deletePortalAction(formData: FormData) {
  const user = await requireAuth();
  const portalId = Number(formData.get("portalId"));

  await softDeletePortal(portalId);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "portal",
    entityId: portalId,
    details: "Soft deleted portal",
  });

  redirect("/admin/portals");
}
