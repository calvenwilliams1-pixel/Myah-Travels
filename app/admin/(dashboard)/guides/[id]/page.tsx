import { redirect } from "next/navigation";

/**
 * Retired in the type overhaul (Nov 23, 2026): guides and reviews are
 * no longer separate content types — a post's template is its type.
 * Everything is written as a post now.
 */
export default function RetiredPage() {
  redirect("/admin/posts");
}
