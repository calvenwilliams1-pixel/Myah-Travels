import { redirect } from "next/navigation";

export default function NewGuidePage() {
  return redirect("/admin/posts/new");
}
