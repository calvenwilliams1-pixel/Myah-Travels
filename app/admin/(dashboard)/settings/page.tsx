import React from "react";
import { getAllSettings, getCertifications } from "@/lib/settings";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { saveSettingsAction, addCertificationAction, deleteCertificationAction } from "./actions";
import { Table } from "@/components/ui/Table";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAllSettings();
  const certs = await getCertifications();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <form action={saveSettingsAction} className="space-y-6">
        <Card>
          <h3 className="font-semibold mb-4">Site Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Site Name"
              name="site_name"
              defaultValue={settings.site_name || ""}
            />
            <Input
              label="Tagline"
              name="tagline"
              defaultValue={settings.tagline || ""}
            />
            <Input
              label="Admin Email"
              name="admin_email"
              type="email"
              defaultValue={settings.admin_email || ""}
            />
            <Input
              label="Logo Path (upload via Media Library first)"
              name="logo_path"
              defaultValue={settings.logo_path || ""}
              placeholder="/uploads/general/logo.webp"
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Primary Color"
              name="primary_color"
              type="color"
              defaultValue={settings.primary_color || "#4a7c59"}
            />
            <Input
              label="Secondary Color"
              name="secondary_color"
              type="color"
              defaultValue={settings.secondary_color || "#e8b84b"}
            />
            <Input
              label="Accent Color"
              name="accent_color"
              type="color"
              defaultValue={settings.accent_color || "#6b9ac4"}
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Typography</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Font Family
              <select
                name="font_family"
                defaultValue={settings.font_family || "Inter"}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Inter">Inter</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="Lato">Lato</option>
                <option value="Source Sans Pro">Source Sans Pro</option>
              </select>
            </label>
            <Input
              label="Footer Text"
              name="footer_text"
              defaultValue={settings.footer_text || ""}
            />
          </div>
        </Card>

        <Button type="submit">Save Settings</Button>
      </form>

      <Card>
        <h3 className="font-semibold mb-4">Certifications</h3>
        
        <form action={addCertificationAction} className="flex gap-3 mb-4">
          <Input name="title" placeholder="Certification Title" required />
          <Input name="organization" placeholder="Organization" />
          <Input name="yearEarned" placeholder="Year" />
          <Button type="submit" variant="secondary">Add</Button>
        </form>

        {certs.length > 0 ? (
          <Table
            columns={[
              { header: "Title", accessor: (cert: any) => cert.title },
              { header: "Organization", accessor: (cert: any) => cert.organization || "—" },
              { header: "Year", accessor: (cert: any) => cert.yearEarned || "—" },
              {
                header: "Actions",
                accessor: (cert: any) => (
                  <form action={deleteCertificationAction}>
                    <input type="hidden" name="id" value={cert.id} />
                    <Button variant="danger" size="sm" type="submit">Delete</Button>
                  </form>
                ),
              },
            ]}
            data={certs}
            keyExtractor={(cert) => cert.id}
            emptyMessage="No certifications added."
          />
        ) : (
          <p className="text-gray-500 text-sm">No certifications yet.</p>
        )}
      </Card>
    </div>
  );
}
