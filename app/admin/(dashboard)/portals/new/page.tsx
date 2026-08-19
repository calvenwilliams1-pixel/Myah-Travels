import React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createPortalAction } from "../actions";

export default function NewPortalPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">New Portal</h2>

      <Card>
        <form action={createPortalAction} className="space-y-6">
          <Input
            label="Portal Name *"
            name="name"
            required
            placeholder="Smith Family Disney Trip"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                DEPARTURE DATE
              </label>
              <input
                type="date"
                name="departureDate"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-lg font-medium"
              />
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <label className="block text-sm font-semibold text-emerald-800 mb-2">
                RETURN DATE
              </label>
              <input
                type="date"
                name="returnDate"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-lg font-medium"
              />
            </div>
          </div>

          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
            ⚠️ Magic links will expire 3 days after the return date.
          </p>

          <Button type="submit">Create Portal</Button>
        </form>
      </Card>
    </div>
  );
}
