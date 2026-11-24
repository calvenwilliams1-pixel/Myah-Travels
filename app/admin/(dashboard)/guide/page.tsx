import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getGuideSteps, isGuideOwner } from "@/lib/guide";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide | MyCalTravels Admin",
};

const GOOD_TO_KNOW = [
  {
    title: "Everything saves as you type",
    line: "There's no Save button to hunt for. If your phone dies mid-sentence, your words are kept — the editor even offers to restore them.",
  },
  {
    title: "Travellers never need a password",
    line: "Each person gets their own private link by email. The link is their key, and it stops working a few days after the trip ends.",
  },
  {
    title: "New trip requests find you",
    line: "When someone fills in the trip form on your site, you get an email and they appear under Clients. Nothing to check every day.",
  },
];

export default async function GuidePage() {
  // The guide belongs to the owner's account only; on any other
  // account it is not active at all. And once every step is done the
  // guide is finished — there is nothing left to show, so the page
  // itself goes away too and lands back on the dashboard.
  const user = await getCurrentUser();
  if (!isGuideOwner(user?.username)) {
    redirect("/admin");
  }

  const steps = await getGuideSteps();
  const doneCount = steps.filter((s) => s.done).length;

  if (doneCount === steps.length) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Your guide</h1>
        <p className="text-gray-500 mt-1">
          Six small steps. Do them in order, tap the button on each one, and
          this page ticks them off as you go. {doneCount} of {steps.length} done
          so far.
        </p>
      </div>

      {steps.map((step, i) => (
        <Card key={step.id} className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
              step.done ? "bg-green-100 text-green-700" : "bg-primary text-white"
            }`}
          >
            {step.done ? "✓" : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className={`text-lg font-semibold ${
                step.done ? "text-gray-500 line-through" : ""
              }`}
            >
              {step.title}
            </h2>
            <p className="text-gray-600 mt-1">{step.line}</p>
            {!step.done && (
              <Link
                href={step.href}
                className="inline-block mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                {step.actionLabel}
              </Link>
            )}
            {step.done && (
              <p className="mt-2 text-sm font-medium text-green-700">Done</p>
            )}
          </div>
        </Card>
      ))}

      <div>
        <h2 className="text-lg font-semibold mb-3">Good to know</h2>
        <div className="space-y-3">
          {GOOD_TO_KNOW.map((item) => (
            <Card key={item.title} padding="sm">
              <p className="font-medium text-gray-800">{item.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{item.line}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
