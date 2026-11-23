"use server";

import { setSetting, setMultipleSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import type { WelcomeContent, WelcomeTemplateId } from "@/lib/welcome";

export async function saveHomepageCanvas(documentJson: string): Promise<void> {
  await setSetting("homepage_canvas", documentJson);
  revalidatePath("/");
}

export interface WelcomeSettingsInput {
  mode: "canvas" | "template";
  template: WelcomeTemplateId;
  content: WelcomeContent;
}

export async function saveWelcomeSettings(input: WelcomeSettingsInput): Promise<void> {
  const mode = input.mode === "template" ? "template" : "canvas";
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
    welcome_mode: mode,
    welcome_template: template,
    welcome_content: JSON.stringify(content),
  });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
