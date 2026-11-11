import React from "react";
import { getAllTagsWithCounts } from "@/lib/content";
import { toggleTagFavouriteAction, deleteTagAction, mergeTagsAction, renameTagAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const tags = await getAllTagsWithCounts();
  const successMsg = searchParams.success ? decodeURIComponent(searchParams.success) : null;
  const errorMsg = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Tags</h2>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Usage</th>
              <th className="text-left px-4 py-3">Favourite</th>
              <th className="text-left px-4 py-3">Rename</th>
              <th className="text-left px-4 py-3">Merge</th>
              <th className="text-left px-4 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag: any) => (
              <tr key={tag.id} className="border-b border-gray-50">
                <td className="px-4 py-2">{tag.name}</td>
                <td className="px-4 py-2 text-gray-500">{tag.slug}</td>
                <td className="px-4 py-2">{tag.usageCount ?? 0}</td>
                <td className="px-4 py-2">
                  <form action={toggleTagFavouriteAction}>
                    <input type="hidden" name="tagId" value={tag.id} />
                    <button className={tag.isFavourite ? "text-primary" : "text-gray-400"}>
                      ★
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="text-xs text-primary cursor-pointer">Rename</summary>
                    <form action={renameTagAction} className="flex gap-1 mt-2">
                      <input type="hidden" name="tagId" value={tag.id} />
                      <input
                        type="text"
                        name="newName"
                        placeholder="New name"
                        defaultValue={tag.name}
                        className="px-2 py-1 border rounded text-xs"
                        required
                      />
                      <button className="text-xs text-primary">Save</button>
                    </form>
                  </details>
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="text-xs text-amber-600 cursor-pointer">Merge into...</summary>
                    <form action={mergeTagsAction} className="flex gap-1 mt-2">
                      <input type="hidden" name="sourceId" value={tag.id} />
                      <select name="targetId" className="px-2 py-1 border rounded text-xs" required>
                        <option value="">Select target</option>
                        {tags.filter((t: any) => t.id !== tag.id).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button className="text-xs text-amber-600">Confirm Merge</button>
                    </form>
                  </details>
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="text-xs text-red-600 cursor-pointer">Delete</summary>
                    <form action={deleteTagAction} className="mt-2">
                      <input type="hidden" name="tagId" value={tag.id} />
                      <button className="text-xs text-red-600">Confirm Delete</button>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
