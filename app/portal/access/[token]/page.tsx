import React from "react";
import { validateMagicLink } from "@/lib/portal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function PortalAccessPage({ params }: { params: { token: string } }) {
  const link = await validateMagicLink(params.token);

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Link Expired or Invalid</h1>
          <p className="text-gray-600 mb-6">
            This access link is no longer valid. Please contact Myah for a new link.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Welcome!</h1>
        <p className="text-gray-600 mb-6">
          Click below to access your trip portal.
        </p>
        <form action={`/portal/consume/${params.token}`} method="POST">
          <Button type="submit">Continue to Portal</Button>
        </form>
      </Card>
    </div>
  );
}
