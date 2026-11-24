import React from "react";
import { validateMagicLink, getPortalById } from "@/lib/portal";
import { Button } from "@/components/ui/Button";

export default async function PortalAccessPage({ params }: { params: { token: string } }) {
  const link = await validateMagicLink(params.token);
  const portal = link ? await getPortalById(link.portalId) : null;
  const banner = portal?.heroImage || "/images/welcome-banner.jpg";

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner} alt="" className="h-44 w-full object-cover" />
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );

  if (!link || !portal) {
    return shell(
      <>
        <h1 className="text-2xl font-semibold mb-4">Link Expired or Invalid</h1>
        <p className="text-gray-600">
          This access link is no longer valid. Please contact Myah for a new link.
        </p>
      </>
    );
  }

  return shell(
    <>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
        Your portal is ready
      </p>
      <h1 className="font-display text-3xl font-semibold mb-3">
        {portal.heroTitle || portal.name}
      </h1>
      {portal.heroSubtitle && (
        <p className="text-gray-600 mb-6">{portal.heroSubtitle}</p>
      )}
      <form action={`/portal/consume/${params.token}`} method="POST">
        <Button type="submit" size="lg" className="w-full">
          Continue to Portal
        </Button>
      </form>
      <p className="text-gray-500 text-sm mt-5">
        This link is yours — you can re-open it any time.
      </p>
    </>
  );
}
