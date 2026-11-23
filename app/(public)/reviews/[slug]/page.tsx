import { redirect } from "next/navigation";

/**
 * Retired in the type overhaul (Nov 23, 2026): guides and reviews are
 * no longer separate content types — a post's template is its type,
 * and everything lives in the homepage feed. These routes bounce to
 * the homepage. (Production never had guide/review content.)
 */
export default function RetiredPage() {
  redirect("/");
}
