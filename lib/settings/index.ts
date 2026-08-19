import { db } from "@/lib/db";
import { settings, certifications } from "@/drizzle/schema";
import { eq, isNull } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const result = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};
  for (const row of result) {
    settingsMap[row.key] = row.value ?? "";
  }
  return settingsMap;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.insert(settings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date().toISOString() },
    });
}

export async function setMultipleSettings(data: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(data)) {
    await setSetting(key, value);
  }
}

export async function getCertifications() {
  return db.select().from(certifications)
    .where(isNull(certifications.deletedAt))
    .orderBy(certifications.displayOrder);
}

export async function addCertification(data: {
  title: string;
  organization?: string;
  yearEarned?: string;
  imagePath?: string;
}) {
  return db.insert(certifications).values({
    title: data.title,
    organization: data.organization ?? null,
    yearEarned: data.yearEarned ?? null,
    imagePath: data.imagePath ?? null,
  }).returning();
}

export async function updateCertification(
  id: number,
  data: Partial<{
    title: string;
    organization: string;
    yearEarned: string;
    imagePath: string;
    displayOrder: number;
    isVisible: boolean;
  }>
) {
  return db.update(certifications).set(data).where(eq(certifications.id, id)).returning();
}

export async function deleteCertification(id: number) {
  return db.update(certifications)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(certifications.id, id));
}

export const DEFAULT_SETTINGS = {
  site_name: "Myah Travels",
  tagline: "Travel can be big or small and I'm here to write it all",
  primary_color: "#4a7c59",
  secondary_color: "#e8b84b",
  accent_color: "#6b9ac4",
  font_family: "Inter",
  admin_email: "myah@example.com",
  footer_text: "",
  logo_path: "",
  bio_text: "Black mom of three and wife to the mushroom king, I've always loved to travel almost as much as I love to create a new world through writing. I'm at this beautiful point in my life where I want to combine my love for both and share that with you all.",
};
