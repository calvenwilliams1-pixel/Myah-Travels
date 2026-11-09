import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SetupWizard from "./SetupWizard";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/admin/login");
  if (user.hasCompletedSetup && !user.mustChangePassword) redirect("/admin");

  return (
    <SetupWizard
      initialUsername={user.username}
      mustChangePassword={!!user.mustChangePassword}
      hasCompletedSetup={!!user.hasCompletedSetup}
      initialStep={user.mustChangePassword ? 1 : 2}
    />
  );
}
