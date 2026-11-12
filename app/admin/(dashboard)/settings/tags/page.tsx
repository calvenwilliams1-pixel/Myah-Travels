import React from "react";
import { getAllTagsWithCounts } from "@/lib/content";
import { getAliasMap } from "@/lib/tags/aliases";
import {
  toggleTagFavouriteAction,
  deleteTagAction,
  mergeTagsAction,
  renameTagAction,
  addAliasAction,
  removeAliasAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const [tags, aliasMap] = await Promise.all([
    getAllTagsWithCounts(),
    getAliasMap(),
  ]);
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-3 py-3">Name</th>
              <th className="text-left px-3 py-3">Slug</th>
              <th className="text-left px-3 py-3">Usage</th>
              <th className="text-left px-3 py-3">Alias</th>
              <th className="text-left px-3 py-3">Fav</th>
              <th className="text-left px-3 py-3">Rename</th>
              <th className="text-left px-3 py-3">Merge</th>
              <th className="text-left px-3 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag: any) => {
              const aliasEntry = aliasMap.get(tag.id);
              const isAlias = !!aliasEntry?.isAliasOf;
              const hasAliases = (aliasEntry?.aliasesOf?.length ?? 0) > 0;

              // Candidates for "make X an alias of this tag":
              //   - X not this tag
              //   - X not already an alias
              //   - X doesn't already have aliases
              //   - this tag is not itself an alias (flat model)
              const aliasChildCandidates = isAlias
                ? []
                : tags.filter((t: any) => {
                    if (t.id === tag.id) return false;
                    const tEntry = aliasMap.get(t.id);
                    if (tEntry?.isAliasOf) return false;
                    if ((tEntry?.aliasesOf?.length ?? 0) > 0) return false;
                    return true;
                  });

              return (
                <tr key={tag.id} className="border-b border-gray-50 align-top">
                  <td className="px-3 py-2">{tag.name}</td>
                  <td className="px-3 py-2 text-gray-500">{tag.slug}</td>
                  <td className="px-3 py-2">{tag.usageCount ?? 0}</td>
                  <td className="px-3 py-2 text-xs">
                    {isAlias && (
                      <div className="text-gray-700">
                        <span className="font-medium">→ alias of #{aliasEntry!.isAliasOf!.name}</span>
                        <form action={removeAliasAction} className="inline ml-2">
                          <input type="hidden" name="aliasId" value={tag.id} />
                          <button className="text-red-600 hover:underline" title="Remove alias">
                            remove
                          </button>
                        </form>
                      </div>
                    )}
                    {hasAliases && (
                      <div className="text-gray-700 space-y-1">
                        {aliasEntry!.aliasesOf.map((a) => (
                          <div key={a.id}>
                            <span>#{a.name}</span>
                            <form action={removeAliasAction} className="inline ml-2">
                              <input type="hidden" name="aliasId" value={a.id} />
                              <button className="text-red-600 hover:underline" title="Remove alias">
                                remove
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isAlias && (
                      <details className="mt-1">
                        <summary className="text-primary cursor-pointer">
                          {hasAliases ? "Add another alias" : "Add alias"}
                        </summary>
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] text-gray-600">
                            Tags that redirect here when filtering:
                          </p>
                          {aliasChildCandidates.length > 0 ? (
                            <form action={addAliasAction} className="flex gap-1">
                              <input type="hidden" name="canonicalId" value={tag.id} />
                              <select
                                name="aliasId"
                                className="px-2 py-1 border rounded text-xs flex-1 min-w-0"
                                required
                                defaultValue=""
                              >
                                <option value="">Select tag…</option>
                                {aliasChildCandidates.map((t: any) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                              <button className="text-xs text-primary whitespace-nowrap">Add</button>
                            </form>
                          ) : (
                            <div className="text-xs text-gray-500">No available tags</div>
                          )}
                          <p className="text-[10px] text-gray-400 leading-snug">
                            Example: if <span className="font-medium">#tokyotrip</span> is an alias of <span className="font-medium">#{tag.name}</span>, then filtering by <span className="font-medium">#tokyotrip</span> finds content tagged <span className="font-medium">#{tag.name}</span>.
                          </p>
                        </div>
                      </details>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <form action={toggleTagFavouriteAction}>
                      <input type="hidden" name="tagId" value={tag.id} />
                      <button className={tag.isFavourite ? "text-primary" : "text-gray-400"}>
                        ★
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
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
                  <td className="px-3 py-2">
                    <details>
                      <summary className="text-xs text-amber-600 cursor-pointer">Merge into…</summary>
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
                  <td className="px-3 py-2">
                    <details>
                      <summary className="text-xs text-red-600 cursor-pointer">Delete</summary>
                      <form action={deleteTagAction} className="mt-2">
                        <input type="hidden" name="tagId" value={tag.id} />
                        <button className="text-xs text-red-600">Confirm Delete</button>
                      </form>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
