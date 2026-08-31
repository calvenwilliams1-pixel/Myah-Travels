import React from "react";
import { getAllTagsWithCounts } from "@/lib/content";
import { toggleTagFavouriteAction, deleteTagAction, mergeTagsAction, renameTagAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await getAllTagsWithCounts();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Tags</h2>

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
                    <button className={tag.isFavourite ? "text-emerald-600" : "text-gray-400"}>
                      ★
                    </button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <form action={renameTagAction} className="flex gap-1">
                    <input type="hidden" name="tagId" value={tag.id} />
                    <input type="text" name="newName" placeholder="Rename" className="px-2 py-1 border rounded text-xs" />
                    <button className="text-xs text-emerald-700">Save</button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <form
                    action={mergeTagsAction}
                    onSubmit={(e) => {
                      const targetId = (e.currentTarget.elements.namedItem("targetId") as HTMLSelectElement)?.value;
                      if (!targetId) {
                        e.preventDefault();
                        alert("Please select a tag to merge into.");
                        return;
                      }
                      if (!confirm(`Merge "#${tag.name}" into the selected tag? This will delete "#${tag.name}".`)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex gap-1"
                  >
                    <input type="hidden" name="sourceId" value={tag.id} />
                    <select name="targetId" className="px-2 py-1 border rounded text-xs">
                      <option value="">Merge into...</option>
                      {tags.filter((t: any) => t.id !== tag.id).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button className="text-xs text-amber-600">Merge</button>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <form action={deleteTagAction}>
                    <input type="hidden" name="tagId" value={tag.id} />
                    <button className="text-xs text-red-600">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
