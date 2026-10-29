import React from "react";
import Link from "next/link";
import { getMediaByFolderId, getMediaFolders } from "@/lib/media";
import { getFolderById } from "@/lib/folders";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import FolderTree from "@/components/admin/media/FolderTree";
import { uploadMediaAction, deleteMediaAction } from "./actions";

export const dynamic = "force-dynamic";

interface MediaPageProps {
  searchParams: { folderId?: string };
}

async function buildBreadcrumb(folderId: number): Promise<{ id: number; name: string }[]> {
  const path: { id: number; name: string }[] = [];
  let current = await getFolderById(folderId);
  let guard = 0;
  while (current && guard < 20) {
    path.unshift({ id: current.id, name: current.name });
    if (current.parentId === null) break;
    current = await getFolderById(current.parentId);
    guard++;
  }
  return path;
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const folderIdRaw = searchParams?.folderId;
  const folderId = folderIdRaw ? parseInt(folderIdRaw, 10) : null;
  const validFolderId = folderId !== null && !isNaN(folderId) ? folderId : null;

  const mediaItems = await getMediaByFolderId(validFolderId);
  const breadcrumb =
    validFolderId !== null ? await buildBreadcrumb(validFolderId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Media Library</h2>
        <span className="text-sm text-gray-500">
          {mediaItems.length} {mediaItems.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 shrink-0">
          <FolderTree />
        </aside>

        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Link href="/admin/media" className="hover:text-primary">
              All files
            </Link>
            {breadcrumb.map((b) => (
              <React.Fragment key={b.id}>
                <span className="text-gray-400">/</span>
                <Link href={`/admin/media?folderId=${b.id}`} className="hover:text-primary">
                  {b.name}
                </Link>
              </React.Fragment>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold mb-4">Upload New File</h3>
            <form action={uploadMediaAction} className="space-y-4">
              <input
                type="file"
                name="file"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Alt Text"
                  name="altText"
                  placeholder="Descriptive text"
                />
                <Input
                  label="Caption"
                  name="caption"
                  placeholder="Optional caption"
                />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          </Card>

          <Card padding="none">
            <Table
              columns={[
                {
                  header: "Preview",
                  accessor: (item: any) => (
                    item.fileType?.startsWith("image/") ? (
                      <img
                        src={`/uploads/${item.filePath}`}
                        alt={item.altText || item.fileName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <span className="text-2xl">📄</span>
                    )
                  ),
                },
                {
                  header: "Name",
                  accessor: (item: any) => item.fileName,
                },
                {
                  header: "Type",
                  accessor: (item: any) => item.fileType?.split("/")[1] || "unknown",
                },
                {
                  header: "Uploaded",
                  accessor: (item: any) =>
                    new Date(item.uploadedAt).toLocaleDateString(),
                },
                {
                  header: "Actions",
                  accessor: (item: any) => (
                    <form action={deleteMediaAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button variant="danger" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  ),
                },
              ]}
              data={mediaItems}
              keyExtractor={(item) => item.id}
              emptyMessage={
                validFolderId === null
                  ? "No media uploaded yet."
                  : "No files in this folder."
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
