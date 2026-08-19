import React from "react";
import { getStorageUsage } from "@/lib/media";
import { Card } from "@/components/ui/Card";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export default async function StorageUsage() {
  const usage = await getStorageUsage();

  return (
    <Card>
      <h3 className="font-semibold mb-2">Storage</h3>
      <p className="text-2xl font-bold text-emerald-800">{formatSize(usage.totalSize)}</p>
      <p className="text-sm text-gray-500">{usage.totalFiles} files</p>
    </Card>
  );
}
