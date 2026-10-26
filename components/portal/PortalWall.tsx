import React from "react";
import HeroBanner from "@/components/portal/HeroBanner";
import WallItemRenderer from "@/components/portal/WallItemRenderer";
import ItineraryGlanceView from "@/components/portal/glance/ItineraryGlanceView";
import PortalPrintSetup from "@/components/portal/PortalPrintSetup";
import type { GlanceData } from "@/lib/itineraries/derive";

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
  glance?: GlanceData;
  derivedError?: boolean;
}

interface PortalWallProps {
  portal: PortalWallPortal;
  items: PortalWallItem[];
  mode?: "client" | "admin-preview";
}

export default function PortalWall({
  portal,
  items,
  mode = "client",
}: PortalWallProps) {
  const hasInlineDerivedTile = items.some(
    (i) => i.sourceType === "itinerary_glance" && i.glance && !i.derivedError
  );

  const subtitle =
    portal.heroSubtitle ||
    (portal.departureDate && portal.returnDate
      ? portal.departureDate + " - " + portal.returnDate
      : undefined);

  return (
    <div
      className="min-h-screen bg-gray-50"
      data-has-inline-tile={hasInlineDerivedTile ? "true" : "false"}
    >
      <PortalPrintSetup enabled={hasInlineDerivedTile} />
      <div data-portal-chrome>
        <HeroBanner
          title={portal.heroTitle || portal.name}
          subtitle={subtitle}
          image={portal.heroImage}
          preset={portal.heroPreset || "minimal"}
        />
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-gray-500">No content yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const isGlance = item.sourceType === "itinerary_glance";

              if (isGlance) {
                if (!item.glance || item.derivedError) {
                  return (
                    <div
                      key={item.id}
                      data-wall-item
                      data-variant="glance"
                      className="md:col-span-2 p-6 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500"
                    >
                      Summary unavailable
                    </div>
                  );
                }
                return (
                  <div
                    key={item.id}
                    data-wall-item
                    data-variant="glance"
                    className="md:col-span-2"
                  >
                    <ItineraryGlanceView glance={item.glance} />
                  </div>
                );
              }

              if (
                item.sourceType !== "itinerary" &&
                item.sourceType !== "library" &&
                item.sourceType !== "portal_specific"
              ) {
                console.warn(
                  `[PortalWall] unknown sourceType "${item.sourceType}" for item ${item.id} — skipping`
                );
                return null;
              }

              return (
                <div key={item.id} data-wall-item data-variant="full">
                  <WallItemRenderer
                    item={{ ...item, portalSlug: portal.slug }}
                    mode={mode}
                    portalId={portal.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div data-portal-chrome className="text-center py-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Contact Myah: myah@mycaltravels.com
        </p>
      </div>
    </div>
  );
}
