import { db } from "@/lib/db";
import {
  portals,
  portalMembers,
  portalMagicLinks,
  portalSessions,
  portalNotices,
  portalDocuments,
  portalFaqs,
} from "@/drizzle/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import crypto from "crypto";
import { queueEmail, queueBulkEmails } from "@/lib/email";
import { magicLinkEmail, portalNoticeEmail, globalAnnouncementEmail } from "@/lib/email/templates";
import { logActivity } from "@/lib/logging";

// ============================================
// PORTAL CRUD
// ============================================

export async function getPortals(options?: { includeArchived?: boolean }) {
  const conditions = [isNull(portals.deletedAt)];
  if (!options?.includeArchived) {
    conditions.push(eq(portals.isActive, true));
  }
  return db.select().from(portals).where(and(...conditions)).orderBy(desc(portals.createdAt));
}

export async function getPortalById(id: number) {
  const result = await db.select().from(portals).where(eq(portals.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getPortalBySlug(slug: string) {
  const result = await db.select().from(portals)
    .where(and(eq(portals.slug, slug), isNull(portals.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.select().from(portals).where(eq(portals.slug, slug)).limit(1);
    if (existing.length === 0) return slug;
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function createPortal(data: {
  name: string;
  departureDate?: string;
  returnDate?: string;
}) {
  const baseSlug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const slug = await generateUniqueSlug(baseSlug);

  return db.insert(portals).values({
    name: data.name,
    slug,
    departureDate: data.departureDate ?? null,
    returnDate: data.returnDate ?? null,
    isActive: true,
  }).returning();
}

export async function updatePortal(
  id: number,
  data: Partial<{
    name: string;
    departureDate: string;
    returnDate: string;
    isActive: boolean;
    archivedAt: string;
  }>
) {
  return db.update(portals).set(data).where(eq(portals.id, id)).returning();
}

export async function archivePortal(id: number) {
  await db.delete(portalSessions).where(eq(portalSessions.portalId, id));
  
  await db.update(portalMagicLinks)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(portalMagicLinks.portalId, id), isNull(portalMagicLinks.usedAt), isNull(portalMagicLinks.revokedAt)));

  return db.update(portals)
    .set({ isActive: false, archivedAt: new Date().toISOString() })
    .where(eq(portals.id, id));
}

export async function softDeletePortal(id: number) {
  await db.delete(portalSessions).where(eq(portalSessions.portalId, id));
  await db.update(portalMagicLinks)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(portalMagicLinks.portalId, id));

  return db.update(portals)
    .set({ deletedAt: new Date().toISOString(), isActive: false })
    .where(eq(portals.id, id));
}

// ============================================
// MEMBER MANAGEMENT
// ============================================

export async function getPortalMembers(portalId: number) {
  return db.select().from(portalMembers)
    .where(and(eq(portalMembers.portalId, portalId), isNull(portalMembers.deletedAt)));
}

export async function addPortalMember(portalId: number, email: string, name?: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.select().from(portalMembers)
    .where(and(eq(portalMembers.portalId, portalId), eq(portalMembers.email, normalizedEmail)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].deletedAt || existing[0].name !== (name ?? existing[0].name)) {
      await db.update(portalMembers)
        .set({ deletedAt: null, name: name ?? existing[0].name })
        .where(eq(portalMembers.id, existing[0].id));
      return db.select().from(portalMembers).where(eq(portalMembers.id, existing[0].id)).limit(1);
    }
    return existing;
  }

  return db.insert(portalMembers).values({
    portalId,
    email: normalizedEmail,
    name: name ?? null,
  }).returning();
}

export async function removePortalMember(memberId: number) {
  const member = await db.select().from(portalMembers).where(eq(portalMembers.id, memberId)).limit(1);
  
  if (member.length > 0) {
    await db.delete(portalSessions).where(eq(portalSessions.memberId, memberId));
    
    await db.update(portalMagicLinks)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(portalMagicLinks.memberId, memberId), isNull(portalMagicLinks.usedAt), isNull(portalMagicLinks.revokedAt)));
  }

  return db.update(portalMembers)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(portalMembers.id, memberId));
}

export async function isMemberOfPortal(memberId: number, portalId: number): Promise<boolean> {
  const result = await db.select().from(portalMembers)
    .where(and(eq(portalMembers.id, memberId), eq(portalMembers.portalId, portalId), isNull(portalMembers.deletedAt)))
    .limit(1);
  return result.length > 0;
}

// ============================================
// MAGIC LINK MANAGEMENT
// ============================================

function getMagicLinkExpiry(portal: { returnDate?: string | null }): Date {
  if (portal.returnDate) {
    const expiry = new Date(portal.returnDate + "T23:59:59");
    expiry.setDate(expiry.getDate() + 3);
    return expiry;
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
}

export async function generateMagicLink(
  portalId: number,
  memberId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<string | null> {
  const portal = await getPortalById(portalId);
  if (!portal) return null;

  const belongsToPortal = await isMemberOfPortal(memberId, portalId);
  if (!belongsToPortal) return null;

  await db.update(portalMagicLinks)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(
      eq(portalMagicLinks.memberId, memberId),
      isNull(portalMagicLinks.usedAt),
      isNull(portalMagicLinks.revokedAt)
    ));

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = getMagicLinkExpiry(portal).toISOString();

  await db.insert(portalMagicLinks).values({
    portalId,
    memberId,
    token,
    expiresAt,
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
  });

  return token;
}

export async function validateMagicLink(token: string) {
  const result = await db.select().from(portalMagicLinks)
    .where(and(
      eq(portalMagicLinks.token, token),
      isNull(portalMagicLinks.usedAt),
      isNull(portalMagicLinks.revokedAt)
    ))
    .limit(1);

  if (result.length === 0) return null;

  const link = result[0];

  if (new Date(link.expiresAt) < new Date()) {
    return null;
  }

  return link;
}

export async function consumeMagicLink(token: string) {
  const link = await validateMagicLink(token);
  if (!link) return null;

  await db.update(portalMagicLinks)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(portalMagicLinks.id, link.id));

  const portal = await getPortalById(link.portalId);
  
  let sessionExpiry: Date;
  if (portal?.returnDate) {
    sessionExpiry = new Date(portal.returnDate + "T23:59:59");
    sessionExpiry.setDate(sessionExpiry.getDate() + 3);
  } else {
    sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
  }

  const sessionId = crypto.randomBytes(32).toString("base64url");

  await db.insert(portalSessions).values({
    id: sessionId,
    portalId: link.portalId,
    memberId: link.memberId,
    expiresAt: sessionExpiry.toISOString(),
  });

  await logActivity({
    userId: null,
    actionType: "portal_access",
    entityType: "portal",
    entityId: link.portalId,
    details: `Magic link consumed for member ${link.memberId}`,
  });

  return {
    sessionId,
    portalId: link.portalId,
    memberId: link.memberId,
  };
}

export async function sendMagicLinkEmails(portalId: number) {
  const portal = await getPortalById(portalId);
  if (!portal) return;

  const members = await getPortalMembers(portalId);
  const emails = [];

  for (const member of members) {
    const token = await generateMagicLink(portalId, member.id);
    if (!token) continue;

    const linkUrl = `${process.env.SITE_URL || "http://localhost:3000"}/portal/access/${token}`;
    const email = magicLinkEmail(member.name, portal.name, linkUrl);
    emails.push({ toEmail: member.email, subject: email.subject, body: email.html });
  }

  await queueBulkEmails(emails);
}

// ============================================
// NOTICES
// ============================================

export async function getPortalNotices(portalId: number) {
  return db.select().from(portalNotices)
    .where(and(eq(portalNotices.portalId, portalId), isNull(portalNotices.deletedAt)))
    .orderBy(desc(portalNotices.createdAt));
}

export async function createPortalNotice(
  portalId: number,
  data: { title: string; content: string; isPinned?: boolean; isGlobalAnnouncement?: boolean }
) {
  const notice = await db.insert(portalNotices).values({
    portalId,
    title: data.title,
    content: data.content,
    isPinned: data.isPinned ?? false,
    isGlobalAnnouncement: data.isGlobalAnnouncement ?? false,
  }).returning();

  const portal = await getPortalById(portalId);
  const members = await getPortalMembers(portalId);

  if (data.isGlobalAnnouncement) {
    const allMembers = await db.select().from(portalMembers).where(isNull(portalMembers.deletedAt));
    const seenEmails = new Set<string>();
    const emails = [];
    for (const member of allMembers) {
      if (member.optOutGlobalAnnouncement) continue;
      const normalizedEmail = member.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) continue;
      seenEmails.add(normalizedEmail);
      
      const email = globalAnnouncementEmail(member.name, data.title, data.content);
      emails.push({ toEmail: member.email, subject: email.subject, body: email.html });
    }
    await queueBulkEmails(emails);
  } else if (portal) {
    const emails = [];
    for (const member of members) {
      const portalUrl = `${process.env.SITE_URL || "http://localhost:3000"}/portal/${portal.slug}`;
      const email = portalNoticeEmail(member.name, portal.name, data.title, data.content, portalUrl);
      emails.push({ toEmail: member.email, subject: email.subject, body: email.html });
    }
    await queueBulkEmails(emails);
  }

  return notice[0];
}

// ============================================
// DOCUMENTS
// ============================================

export async function getPortalDocuments(portalId: number) {
  return db.select().from(portalDocuments)
    .where(and(eq(portalDocuments.portalId, portalId), isNull(portalDocuments.deletedAt)))
    .orderBy(desc(portalDocuments.uploadedAt));
}

export async function addPortalDocument(
  portalId: number,
  data: { title: string; filePath: string; fileName: string; fileType: string }
) {
  return db.insert(portalDocuments).values({
    portalId,
    title: data.title,
    filePath: data.filePath,
    fileName: data.fileName,
    fileType: data.fileType,
  }).returning();
}

// ============================================
// FAQS
// ============================================

export async function getPortalFaqs(portalId: number) {
  return db.select().from(portalFaqs)
    .where(and(eq(portalFaqs.portalId, portalId), isNull(portalFaqs.deletedAt)))
    .orderBy(portalFaqs.createdAt);
}

export async function addPortalFaq(
  portalId: number,
  data: { question: string; answer: string }
) {
  return db.insert(portalFaqs).values({
    portalId,
    question: data.question,
    answer: data.answer,
  }).returning();
}

// ============================================
// SESSION VALIDATION
// ============================================

export async function validatePortalSession(sessionId: string) {
  const result = await db.select().from(portalSessions)
    .where(eq(portalSessions.id, sessionId))
    .limit(1);

  if (result.length === 0) return null;

  const session = result[0];

  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }

  return session;
}

export async function destroyPortalSession(sessionId: string) {
  return db.delete(portalSessions).where(eq(portalSessions.id, sessionId));
}
