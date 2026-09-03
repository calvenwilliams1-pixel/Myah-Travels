import { redirect } from "next/navigation";

export default function NewReviewPage() {
  return redirect("/admin/posts/new");
}
