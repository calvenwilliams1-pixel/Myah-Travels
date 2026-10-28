import React from "react";
import { requireAuth } from "@/lib/auth";
import PreviewClient from "./PreviewClient";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PreviewPostPage({
  searchParams,
}: {
  searchParams: { s?: string };
}) {
  await requireAuth();
  return <PreviewClient sessionId={searchParams.s} />;
}
