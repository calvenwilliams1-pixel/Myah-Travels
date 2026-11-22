import React from "react";
import { getEmailQueueCounts, getFailedEmails } from "@/lib/email";
import { retryFailedEmailsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmailQueuePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const [counts, failed] = await Promise.all([
    getEmailQueueCounts(),
    getFailedEmails(),
  ]);
  const successMsg = searchParams.success ? decodeURIComponent(searchParams.success) : null;
  const errorMsg = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  const cards = [
    { label: "Pending", value: counts.pending, hint: "Waiting for the next send run" },
    { label: "Processing", value: counts.processing, hint: "Being sent right now (stuck ones recover automatically after 15 minutes)" },
    { label: "Sent", value: counts.sent, hint: "Delivered to the email provider" },
    { label: "Failed", value: counts.failed, hint: "Gave up after 3 attempts — retry below" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Email Queue</h2>
      <p className="text-sm text-gray-500">
        Everything the site emails — portal magic links, inquiry notifications — goes
        through this queue. The send job runs every minute; if counts stop moving,
        check that the server cron job and the Resend API key are in place.
      </p>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-3">Failed emails</h3>
        {failed.length === 0 ? (
          <p className="text-sm text-gray-500">None. Every email has gone out or is still trying.</p>
        ) : (
          <>
            <form action={retryFailedEmailsAction} className="mb-4">
              <button
                type="submit"
                className="px-4 py-2 rounded bg-[var(--color-primary)] text-white text-sm font-medium"
              >
                Retry all failed
              </button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">To</th>
                    <th className="py-2 pr-4 font-medium">Subject</th>
                    <th className="py-2 pr-4 font-medium">Attempts</th>
                    <th className="py-2 pr-4 font-medium">Last error</th>
                    <th className="py-2 font-medium">Queued</th>
                  </tr>
                </thead>
                <tbody>
                  {failed.map((email) => (
                    <tr key={email.id} className="border-b border-gray-100 align-top">
                      <td className="py-2 pr-4">{email.toEmail}</td>
                      <td className="py-2 pr-4">{email.subject}</td>
                      <td className="py-2 pr-4">{email.attempts ?? 0}</td>
                      <td className="py-2 pr-4 text-red-600">{email.errorMessage || "—"}</td>
                      <td className="py-2">{email.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
