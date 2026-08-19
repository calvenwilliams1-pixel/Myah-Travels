import { db } from "@/lib/db";
import { media, posts, guides, reviews, settings, certifications } from "@/drizzle/schema";
import { eq, isNull, like, desc, and, or } from "drizzle-orm";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOC_SIZE = 20 * 1024 * 1024;

export function sanitizeFolderName(folder: string): string {
  const sanitized = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized || "general";
}

export function isAllowedExtension(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return true;
  return ALLOWED_DOC_EXTENSIONS.includes(ext);
}

export function validateFileSize(fileName: string, fileSize: number): boolean {
  const ext = path.extname(fileName).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return fileSize <= MAX_IMAGE_SIZE;
  }
  return fileSize <= MAX_DOC_SIZE;
}

export async function saveFile(
  file: File,
  folder: string = "general"
): Promise<{ success: boolean; filePath?: string; fileType?: string; error?: string }> {
  try {
    const safeFolder = sanitizeFolderName(folder);
    
    if (!isAllowedExtension(file.name)) {
      return { success: false, error: "File type not allowed" };
    }

    if (!validateFileSize(file.name, file.size)) {
      return { success: false, error: "File size exceeds limit" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const detectedType = await fileTypeFromBuffer(buffer);
    
    if (detectedType) {
      const detectedExt = `.${detectedType.ext}`;
      const claimedExt = path.extname(file.name).toLowerCase();
      
      if (detectedExt !== claimedExt && !(claimedExt === ".jpg" && detectedExt === ".jpeg")) {
        return { success: false, error: "File content does not match extension" };
      }
    } else {
      return { success: false, error: "Unrecognized file format" };
    }

    const folderPath = path.join(UPLOADS_DIR, safeFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const baseName = safeName.replace(/\.[^.]+$/, "");
    const fileName = `${timestamp}-${baseName}`;

    if (detectedType.mime.startsWith("image/")) {
      const optimized = await sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const webpFileName = `${fileName}.webp`;
      const webpPath = path.join(folderPath, webpFileName);
      await fs.promises.writeFile(webpPath, optimized);

      const relativePath = path.join(safeFolder, webpFileName).replace(/\\/g, "/");
      return { success: true, filePath: relativePath, fileType: "image/webp" };
    }

    const docFileName = `${fileName}${path.extname(file.name).toLowerCase()}`;
    const docPath = path.join(folderPath, docFileName);
    await fs.promises.writeFile(docPath, buffer);

    const relativePath = path.join(safeFolder, docFileName).replace(/\\/g, "/");
    return { success: true, filePath: relativePath, fileType: detectedType.mime };
  } catch (error) {
    console.error("Failed to save file:", error);
    return { success: false, error: String(error) };
  }
}

export async function addMediaRecord(data: {
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  folder: string;
  altText?: string;
  caption?: string;
}) {
  return db.insert(media).values({
    filePath: data.filePath,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
    folder: sanitizeFolderName(data.folder),
    altText: data.altText ?? null,
    caption: data.caption ?? null,
  }).returning();
}

export async function getMediaByFolder(folder?: string) {
  const conditions = [isNull(media.deletedAt)];
  
  if (folder) {
    conditions.push(eq(media.folder, sanitizeFolderName(folder)));
  }
  
  return db.select().from(media).where(and(...conditions)).orderBy(desc(media.uploadedAt));
}

export async function getMediaById(id: number) {
  const result = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getMediaFolders() {
  const result = await db.select({ folder: media.folder }).from(media).where(isNull(media.deletedAt));
  const folders = new Set<string>();
  for (const row of result) {
    if (row.folder) {
      folders.add(row.folder);
    }
  }
  return Array.from(folders).sort();
}

export async function updateMediaRecord(
  id: number,
  data: Partial<{
    altText: string;
    caption: string;
    folder: string;
  }>
) {
  const updateData: any = { ...data };
  if (data.folder) {
    updateData.folder = sanitizeFolderName(data.folder);
  }
  return db.update(media).set(updateData).where(eq(media.id, id)).returning();
}

export async function isMediaInUse(mediaId: number): Promise<{ used: boolean; locations: string[] }> {
  const mediaRecord = await getMediaById(mediaId);
  if (!mediaRecord) return { used: false, locations: [] };

  const locations: string[] = [];
  const filePath = mediaRecord.filePath;

  const postsWithMedia = await db
    .select({ title: posts.title, featuredImage: posts.featuredImage })
    .from(posts)
    .where(and(isNull(posts.deletedAt), or(like(posts.content, `%${filePath}%`), eq(posts.featuredImage, filePath))));
  
  for (const post of postsWithMedia) {
    locations.push(post.featuredImage === filePath ? `Post (featured): ${post.title}` : `Post: ${post.title}`);
  }

  const guidesWithMedia = await db
    .select({ title: guides.title, headerImage: guides.headerImage })
    .from(guides)
    .where(and(isNull(guides.deletedAt), or(like(guides.content, `%${filePath}%`), eq(guides.headerImage, filePath))));
  
  for (const guide of guidesWithMedia) {
    locations.push(guide.headerImage === filePath ? `Guide (image): ${guide.title}` : `Guide: ${guide.title}`);
  }

  const reviewsWithMedia = await db
    .select({ title: reviews.title, featuredImage: reviews.featuredImage })
    .from(reviews)
    .where(and(isNull(reviews.deletedAt), or(like(reviews.content, `%${filePath}%`), eq(reviews.featuredImage, filePath))));
  
  for (const review of reviewsWithMedia) {
    locations.push(review.featuredImage === filePath ? `Review (featured): ${review.title}` : `Review: ${review.title}`);
  }

  const settingsWithMedia = await db
    .select()
    .from(settings)
    .where(like(settings.value, `%${filePath}%`));
  
  for (const setting of settingsWithMedia) {
    locations.push(`Setting: ${setting.key}`);
  }

  const certsWithMedia = await db
    .select()
    .from(certifications)
    .where(and(isNull(certifications.deletedAt), eq(certifications.imagePath, filePath)));
  
  for (const cert of certsWithMedia) {
    locations.push(`Certification: ${cert.title}`);
  }

  return { used: locations.length > 0, locations };
}

export async function softDeleteMedia(id: number): Promise<{ success: boolean; error?: string }> {
  const { used, locations } = await isMediaInUse(id);

  if (used) {
    return {
      success: false,
      error: `This media is used in ${locations.length} location(s): ${locations.slice(0, 3).join(", ")}`,
    };
  }

  await db.update(media)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(media.id, id));

  return { success: true };
}

export async function hardDeleteMedia(id: number) {
  const mediaRecord = await getMediaById(id);
  if (!mediaRecord) return;

  const fullPath = path.join(UPLOADS_DIR, mediaRecord.filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  await db.delete(media).where(eq(media.id, id));
}

export async function getStorageUsage(): Promise<{
  totalFiles: number;
  totalSize: number;
}> {
  const allMedia = await db.select().from(media).where(isNull(media.deletedAt));
  
  const filePromises = allMedia.map(async (item) => {
    const fullPath = path.join(UPLOADS_DIR, item.filePath);
    try {
      const stats = await fs.promises.stat(fullPath);
      return stats.size;
    } catch {
      return 0;
    }
  });
  
  const sizes = await Promise.all(filePromises);
  const totalSize = sizes.reduce((sum, size) => sum + size, 0);

  return {
    totalFiles: allMedia.length,
    totalSize,
  };
}
