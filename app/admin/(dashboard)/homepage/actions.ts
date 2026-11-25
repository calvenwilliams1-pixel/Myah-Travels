"use server";

import { setSetting, setMultipleSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import type { WelcomeContent, WelcomeTemplateId } from "@/lib/welcome";

/**
 * Kept on purpose (Cal, 2026-11-24): the canvas editor is hidden from
 * the Homepage Editor page, not deleted. This action, the CanvasEditor
 * component and the stored canvas document all stay, so the canvas
 * welcome can be brought back without rebuilding anything.
 */
export async function saveHomepageCanvas(documentJson: string): Promise<void> {
  await setSetting("homepage_canvas", documentJson);
  revalidatePath("/");
}

export interface WelcomeSettingsInput {
  template: WelcomeTemplateId;
  content: WelcomeContent;
}

export async function saveWelcomeSettings(input: WelcomeSettingsInput): Promise<void> {
  const template =
    input.template === "overlay" || input.template === "split" ? input.template : "banner";
  const content: WelcomeContent = {
    photo: (input.content.photo || "").slice(0, 500),
    heading: (input.content.heading || "").slice(0, 200),
    text: (input.content.text || "").slice(0, 1000),
    buttonLabel: (input.content.buttonLabel || "").slice(0, 60),
    buttonHref: (input.content.buttonHref || "").slice(0, 300),
  };
  await setMultipleSettings({
    // The editor offers designed templates only now; saving here
    // always lands the welcome in template mode.
    welcome_mode: "template",
    welcome_template: template,
    welcome_content: JSON.stringify(content),
  });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
