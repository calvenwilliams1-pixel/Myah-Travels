"use server";

import { setSetting } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export async function saveHomepageCanvas(documentJson: string): Promise<void> {
  await setSetting("homepage_canvas", documentJson);
  revalidatePath("/");
}
