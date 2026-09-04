import { db } from "@/lib/db";
import { clients, clientAttachments, clientMerges } from "@/drizzle/schema";
import { eq, and, desc, isNull, like, or } from "drizzle-orm";

export async function getClients(options?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  const conditions = [isNull(clients.deletedAt), eq(clients.isAnonymized, false)];
  
  if (options?.status) {
    conditions.push(eq(clients.status, options.status));
  }
  
  if (options?.search) {
    const searchCondition = or(
      like(clients.fullName, `%${options.search}%`),
      like(clients.email, `%${options.search}%`),
      like(clients.destination, `%${options.search}%`)
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  
  let query: any = db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt));
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
}

export async function getClientById(id: number) {
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] ?? null;
}

export async function findDuplicateClients(email?: string, phone?: string) {
  const contactConditions = [];
  
  if (email) {
    contactConditions.push(eq(clients.email, email));
  }
  
  if (phone) {
    contactConditions.push(eq(clients.phone, phone));
  }
  
  if (contactConditions.length === 0) {
    return [];
  }
  
  return db.select().from(clients).where(
    and(
      isNull(clients.deletedAt),
      eq(clients.isAnonymized, false),
      or(...contactConditions)
    )
  );
}

export async function createClient(data: {
  fullName: string;
  phone?: string;
  email?: string;
  howFound?: string;
  destination?: string;
  tripDurationDays?: number;
  departureMonthYear?: string;
  returnMonthYear?: string;
  bestTimeToContact?: string;
  consentToContact?: boolean;
  consentGivenAt?: string;
  consentIp?: string;
  consentVersion?: string;
  customStatement?: string;
}) {
  return db.insert(clients).values({
    fullName: data.fullName,
    phone: data.phone ?? null,
    email: data.email ?? null,
    howFound: data.howFound ?? null,
    destination: data.destination ?? null,
    tripDurationDays: data.tripDurationDays ?? null,
    departureMonthYear: data.departureMonthYear ?? null,
    returnMonthYear: data.returnMonthYear ?? null,
    bestTimeToContact: data.bestTimeToContact ?? null,
    consentToContact: data.consentToContact ?? false,
    consentGivenAt: data.consentGivenAt ?? null,
    consentIp: data.consentIp ?? null,
    consentVersion: data.consentVersion ?? null,
    customStatement: data.customStatement ?? null,
    status: "new",
  }).returning();
}

export async function updateClient(
  id: number,
  data: Partial<{
    fullName: string;
    phone: string;
    email: string;
    howFound: string;
    destination: string;
    tripDurationDays: number;
    departureMonthYear: string;
    returnMonthYear: string;
    bestTimeToContact: string;
    consentToContact: boolean;
    customStatement: string;
    notes: string;
    status: string;
  }>
) {
  return db.update(clients)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(clients.id, id))
    .returning();
}

export async function softDeleteClient(id: number) {
  return db.update(clients)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(clients.id, id));
}

export async function hardDeleteClient(id: number) {
  return db.delete(clients).where(eq(clients.id, id));
}

export async function anonymizeClient(id: number) {
  await db.update(clientAttachments)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(clientAttachments.clientId, id));
  
  return db.update(clients)
    .set({
      fullName: "Anonymized Client",
      phone: null,
      email: null,
      customStatement: null,
      notes: null,
      consentIp: null,
      isAnonymized: true,
      anonymizedAt: new Date().toISOString(),
    })
    .where(eq(clients.id, id))
    .returning();
}

export async function mergeClients(primaryId: number, mergedId: number) {
  if (primaryId === mergedId) return null;

  return db.transaction(async (tx) => {
    await tx.insert(clientMerges).values({
      primaryClientId: primaryId,
      mergedClientId: mergedId,
    });

    await tx.update(clientAttachments)
      .set({ clientId: primaryId })
      .where(eq(clientAttachments.clientId, mergedId));

    await tx.update(clients)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(clients.id, mergedId));

    return { success: true };
  });
}

export async function getClientAttachments(clientId: number) {
  return db.select().from(clientAttachments)
    .where(and(eq(clientAttachments.clientId, clientId), isNull(clientAttachments.deletedAt)));
}

export async function addClientAttachment(data: {
  clientId: number;
  filePath: string;
  fileName: string;
  fileType: string;
}) {
  return db.insert(clientAttachments).values({
    clientId: data.clientId,
    filePath: data.filePath,
    fileName: data.fileName,
    fileType: data.fileType,
  }).returning();
}

export async function softDeleteAttachment(id: number) {
  return db.update(clientAttachments)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(clientAttachments.id, id));
}

export async function exportClientsToCSV(): Promise<string> {
  const allClients = await getClients();
  
  const headers = [
    "ID", "Name", "Phone", "Email", "How Found", "Destination",
    "Duration", "Departure", "Return", "Best Time", "Consent",
    "Status", "Created"
  ];
  
  const escapeCsv = (val: any) => {
    const str = String(val ?? "").replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
    if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  };
  
  const rows = allClients.map((c: any) => [
    c.id,
    c.fullName,
    c.phone,
    c.email,
    c.howFound,
    c.destination,
    c.tripDurationDays,
    c.departureMonthYear,
    c.returnMonthYear,
    c.bestTimeToContact,
    c.consentToContact ? "Yes" : "No",
    c.status,
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Not available",
  ]);
  
  const csv = [
    headers.join(","),
    ...rows.map((row: any) => row.map(escapeCsv).join(",")),
  ].join("\n");
  
  return csv;
}
