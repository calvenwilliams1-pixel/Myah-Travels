import React from "react";
import { cookies } from "next/headers";
import { validatePortalSession, getPortalBySlug, getPortalNotices, getPortalDocuments, getPortalFaqs } from "@/lib/portal";
import { logActivity } from "@/lib/logging";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage({ params }: { params: { portalSlug: string } }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("portal_session")?.value;

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
          <p className="text-gray-600">Your session has expired. Please use a new access link.</p>
        </Card>
      </div>
    );
  }

  const session = await validatePortalSession(sessionId);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Session Expired</h1>
          <p className="text-gray-600">Your session has expired. Please use a new access link.</p>
        </Card>
      </div>
    );
  }

  const portal = await getPortalBySlug(params.portalSlug);

  if (!portal || portal.id !== session.portalId || !portal.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600">This portal is no longer accessible.</p>
        </Card>
      </div>
    );
  }

  await logActivity({
    userId: null,
    actionType: "portal_view",
    entityType: "portal",
    entityId: portal.id,
    details: `Portal dashboard viewed by member ${session.memberId}`,
  });

  const notices = await getPortalNotices(portal.id);
  const documents = await getPortalDocuments(portal.id);
  const faqs = await getPortalFaqs(portal.id);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">{portal.name}</h1>
        <form action="/portal/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">Logout</Button>
        </form>
      </div>

      {portal.departureDate && portal.returnDate && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Departure</p>
            <p className="text-2xl font-bold text-emerald-900">
              {new Date(portal.departureDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Return</p>
            <p className="text-2xl font-bold text-emerald-900">
              {new Date(portal.returnDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {notices.length === 0 ? (
          <p className="text-gray-500">No updates yet.</p>
        ) : (
          notices.map((notice) => (
            <Card key={notice.id} padding="md">
              <div className="flex items-center gap-2 mb-2">
                {notice.isPinned && <span>📌</span>}
                {notice.isGlobalAnnouncement && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Global</span>}
                <h3 className="font-semibold">{notice.title}</h3>
              </div>
              <p className="text-gray-700">{notice.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notice.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))
        )}
      </div>

      {documents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Documents</h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={`/uploads/${doc.filePath}`}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors"
              >
                <span>📄</span>
                <span className="font-medium text-gray-800">{doc.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <Card key={faq.id} padding="sm">
                <p className="font-medium mb-1">{faq.question}</p>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
