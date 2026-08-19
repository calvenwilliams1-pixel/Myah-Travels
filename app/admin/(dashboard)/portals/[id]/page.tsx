import React from "react";
import { getPortalById, getPortalMembers, getPortalNotices, getPortalDocuments, getPortalFaqs } from "@/lib/portal";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { addMemberAction, removeMemberAction, sendMagicLinksAction, addNoticeAction, archivePortalAction, deletePortalAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PortalDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();

  const portal = await getPortalById(Number(params.id));
  const members = await getPortalMembers(Number(params.id));
  const notices = await getPortalNotices(Number(params.id));
  const documents = await getPortalDocuments(Number(params.id));
  const faqs = await getPortalFaqs(Number(params.id));

  if (!portal) {
    return <div>Portal not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{portal.name}</h2>
          <p className="text-sm text-gray-500">
            Departure: {portal.departureDate || "—"} · Return: {portal.returnDate || "—"}
          </p>
        </div>
        <div className="flex gap-3">
          <form action={archivePortalAction}>
            <input type="hidden" name="portalId" value={portal.id} />
            <Button variant="ghost" type="submit">Archive</Button>
          </form>
          <form action={deletePortalAction}>
            <input type="hidden" name="portalId" value={portal.id} />
            <Button variant="danger" type="submit">Delete</Button>
          </form>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Members ({members.length})</h3>
        <form action={addMemberAction} className="flex gap-3 mb-4">
          <input type="hidden" name="portalId" value={portal.id} />
          <Input name="email" type="email" placeholder="member@email.com" required />
          <Button type="submit" variant="secondary">Add</Button>
        </form>
        <form action={sendMagicLinksAction} className="mb-4">
          <input type="hidden" name="portalId" value={portal.id} />
          <Button type="submit">Send Magic Links</Button>
        </form>
        {members.length > 0 && (
          <Table
            columns={[
              { header: "Name", accessor: (m: any) => m.name || "—" },
              { header: "Email", accessor: (m: any) => m.email },
              {
                header: "Actions",
                accessor: (m: any) => (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="portalId" value={portal.id} />
                    <input type="hidden" name="memberId" value={m.id} />
                    <Button variant="danger" size="sm" type="submit">Remove</Button>
                  </form>
                ),
              },
            ]}
            data={members}
            keyExtractor={(m) => m.id}
            emptyMessage="No members yet."
          />
        )}
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Post Notice</h3>
        <form action={addNoticeAction} className="space-y-4">
          <input type="hidden" name="portalId" value={portal.id} />
          <Input name="title" placeholder="Notice title" required />
          <textarea
            name="content"
            rows={3}
            placeholder="Notice content"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPinned" /> Pinned
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isGlobalAnnouncement" /> Global Announcement
            </label>
          </div>
          <Button type="submit">Post Notice</Button>
        </form>
      </Card>

      {notices.length > 0 && (
        <Card padding="none">
          <Table
            columns={[
              { header: "Title", accessor: (n: any) => n.title },
              { header: "Pinned", accessor: (n: any) => n.isPinned ? "📌" : "—" },
              { header: "Global", accessor: (n: any) => n.isGlobalAnnouncement ? "🌍" : "—" },
              { header: "Posted", accessor: (n: any) => new Date(n.createdAt).toLocaleDateString() },
            ]}
            data={notices}
            keyExtractor={(n) => n.id}
            emptyMessage="No notices yet."
          />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Documents ({documents.length})</h3>
          {documents.length > 0 ? (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a href={`/uploads/${doc.filePath}`} className="text-emerald-700 hover:underline">
                    📄 {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No documents yet.</p>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">FAQs ({faqs.length})</h3>
          {faqs.length > 0 ? (
            <ul className="space-y-2">
              {faqs.map((faq) => (
                <li key={faq.id}>
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No FAQs yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
