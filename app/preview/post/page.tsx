import React from "react";
import { requireAuth } from "@/lib/auth";
import ThemeProvider from "@/components/theme/ThemeProvider";
import PreviewClient from "./PreviewClient";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PreviewPostPage({
  searchParams,
}: {
  searchParams: { s?: string };
}) {
  await requireAuth();
  return (
    <ThemeProvider>
      <PreviewClient sessionId={searchParams.s} />
    </ThemeProvider>
  );
}
