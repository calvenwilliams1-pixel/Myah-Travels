import React from "react";
import Link from "next/link";
import { getClientById, getClientAttachments } from "@/lib/clients";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { updateClientAction, deleteClientAction, anonymizeClientAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAuth();

  const client = await getClientById(Number(params.id));
  const attachments = await getClientAttachments(Number(params.id));

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{client.fullName}</h2>
          <p className="text-sm text-gray-500">
            Received: {new Date(client.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link href="/admin/clients">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Email:</strong> {client.email || "—"}</p>
          <p><strong>Phone:</strong> {client.phone || "—"}</p>
          <p><strong>How Found:</strong> {client.howFound || "—"}</p>
          <p><strong>Best Time:</strong> {client.bestTimeToContact || "—"}</p>
          <p><strong>Consent:</strong> {client.consentToContact ? "Yes" : "No"}</p>
          <p><strong>Status:</strong> {client.status}</p>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Trip Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p><strong>Destination:</strong> {client.destination || "—"}</p>
          <p><strong>Duration:</strong> {client.tripDurationDays ? `${client.tripDurationDays} days` : "—"}</p>
          <p><strong>Departure:</strong> {client.departureMonthYear || "—"}</p>
          <p><strong>Return:</strong> {client.returnMonthYear || "—"}</p>
        </div>
        {client.customStatement && (
          <div className="mt-4">
            <strong>Statement:</strong>
            <p className="mt-1 text-gray-700">{client.customStatement}</p>
          </div>
        )}
      </Card>

      {client.notes && (
        <Card>
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-gray-700">{client.notes}</p>
        </Card>
      )}

      {attachments.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-4">Attachments ({attachments.length})</h3>
          <ul className="space-y-2">
            {attachments.map((att) => (
              <li key={att.id}>
                <a href={`/uploads/${att.filePath}`} className="text-emerald-700 hover:underline">
                  📄 {att.fileName}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-4">Update</h3>
        <form action={updateClientAction} className="space-y-4">
          <input type="hidden" name="id" value={client.id} />
          
          <label className="block text-sm font-medium text-gray-700">
            Status
            <select
              name="status"
              defaultValue={client.status}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="booked">Booked</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Notes
            <textarea
              name="notes"
              rows={4}
              defaultValue={client.notes || ""}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>

          <Button type="submit" variant="secondary">Update Client</Button>
        </form>
      </Card>

      <div className="flex gap-3">
        <form action={anonymizeClientAction}>
          <input type="hidden" name="id" value={client.id} />
          <Button type="submit" variant="ghost">
            Anonymize
          </Button>
        </form>

        <form action={deleteClientAction}>
          <input type="hidden" name="id" value={client.id} />
          <Button type="submit" variant="danger">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
