import React from "react";
import { getMediaByFolder, getMediaFolders } from "@/lib/media";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { uploadMediaAction, deleteMediaAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const mediaItems = await getMediaByFolder();
  const folders = await getMediaFolders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Media Library</h2>
        <span className="text-sm text-gray-500">
          {mediaItems.length} files
        </span>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Upload New File</h3>
        <form action={uploadMediaAction} className="space-y-4">
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Folder"
              name="folder"
              placeholder="general"
              defaultValue="general"
            />
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

      {folders.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {folders.map((folder) => (
            <span key={folder} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {folder}
            </span>
          ))}
        </div>
      )}

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
              header: "Folder",
              accessor: (item: any) => item.folder || "general",
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
                  <Button variant="danger" size="sm" type="submit">Delete</Button>
                </form>
              ),
            },
          ]}
          data={mediaItems}
          keyExtractor={(item) => item.id}
          emptyMessage="No media uploaded yet."
        />
      </Card>
    </div>
  );
}
