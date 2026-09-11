import React from "react";
import HeroBanner from "@/components/portal/HeroBanner";
import WallItemRenderer from "@/components/portal/WallItemRenderer";

export interface PortalWallPortal {
  id: number;
  name: string;
  slug: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  heroPreset: string | null;
  departureDate: string | null;
  returnDate: string | null;
}

export interface PortalWallItem {
  id: number;
  sourceType: string;
  resolvedTitle: string;
  resolvedDescription: string | null;
  resolvedType: string;
  resolvedCategory: string | null;
  resolvedFilePath: string | null;
  resolvedTextContent: string | null;
  itineraryId?: number | null;
}

interface PortalWallProps {
  portal: PortalWallPortal;
  items: PortalWallItem[];
}

export default function PortalWall({ portal, items }: PortalWallProps) {
  const subtitle =
    portal.heroSubtitle ||
    (portal.departureDate && portal.returnDate
      ? portal.departureDate + " - " + portal.returnDate
      : undefined);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroBanner
        title={portal.heroTitle || portal.name}
        subtitle={subtitle}
        image={portal.heroImage}
        preset={portal.heroPreset || "minimal"}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-gray-500">No content yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <WallItemRenderer key={item.id} item={{ ...item, portalSlug: portal.slug }} />
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Contact Myah: myah@mycaltravels.com
        </p>
      </div>
    </div>
  );
}
