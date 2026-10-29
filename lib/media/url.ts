export function buildPublicUrl(filePath: string): string {
  return filePath.startsWith("/") ? filePath : `/uploads/${filePath}`;
}
