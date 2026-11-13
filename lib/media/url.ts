export function buildPublicUrl(filePath: string): string {
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/uploads/")) return filePath;   // legacy, will 401 via route
  if (filePath.startsWith("/api/uploads/")) return filePath;
  if (filePath.startsWith("/")) return filePath;
  return `/api/uploads/${filePath}`;
}
