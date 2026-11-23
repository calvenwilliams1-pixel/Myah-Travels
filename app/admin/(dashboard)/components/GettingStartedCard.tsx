import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getGuideSteps } from "@/lib/guide";

/**
 * Dashboard getting-started checklist. Steps tick themselves off from
 * the real state of the site; the first unfinished step is highlighted
 * with its button. When everything is done it folds down to one line.
 */
export default async function GettingStartedCard() {
  const steps = await getGuideSteps();
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const currentId = steps.find((s) => !s.done)?.id;

  if (allDone) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          You&rsquo;re all set — your site is up and running.
        </p>
        <Link
          href="/admin/guide"
          className="text-sm font-medium text-primary hover:underline"
        >
          Revisit the guide
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-lg font-semibold">Start here — your first trip</h2>
        <span className="text-sm text-gray-500">
          {doneCount} of {steps.length} done
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="divide-y divide-gray-100">
        {steps.map((step, i) => {
          const isCurrent = step.id === currentId;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 py-3 ${isCurrent ? "" : ""}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  step.done
                    ? "bg-green-100 text-green-700"
                    : isCurrent
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium ${
                    step.done ? "text-gray-400 line-through" : "text-gray-800"
                  }`}
                >
                  {step.title}
                </p>
                {isCurrent && (
                  <p className="text-sm text-gray-500">{step.line}</p>
                )}
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {step.actionLabel}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm text-gray-500">
        Prefer pictures?{" "}
        <Link href="/admin/guide" className="font-medium text-primary hover:underline">
          Open the guide
        </Link>{" "}
        — same steps, one at a time.
      </p>
    </Card>
  );
}
