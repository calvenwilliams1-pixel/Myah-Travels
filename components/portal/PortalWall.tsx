import React from "react";
import HeroBanner from "@/components/portal/HeroBanner";
import WallItemRenderer from "@/components/portal/WallItemRenderer";
import ItineraryGlanceView from "@/components/portal/glance/ItineraryGlanceView";
import DayByDayView from "@/components/portal/day-by-day/DayByDayView";
import PortalPrintSetup from "@/components/portal/PortalPrintSetup";
import type { GlanceData, DayByDayState } from "@/lib/itineraries/derive";

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
  isVisible?: boolean;
  glance?: GlanceData;
  dayByDay?: DayByDayState;
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
  const isClient = mode === "client";
  const visibleItems = isClient ? items.filter((i) => i.isVisible !== false) : items;

  const todayItems = visibleItems.filter(
    (i) =>
      i.sourceType === "itinerary_today" &&
      i.dayByDay &&
      i.dayByDay.state !== "no-window" &&
      !i.derivedError
  );
  const glanceItem = visibleItems.find(
    (i) => i.sourceType === "itinerary_glance" && i.glance && !i.derivedError
  );
  const glanceBroken = visibleItems.some(
    (i) => i.sourceType === "itinerary_glance" && (!i.glance || i.derivedError)
  );

  // Grid items = everything except itinerary_glance (which is the sidebar)
  const gridItems = visibleItems.filter(
    (i) => i.sourceType !== "itinerary_glance" && i.sourceType !== "itinerary_today"
  );

  const hasGlance = !!glanceItem || glanceBroken;
  const hasInlineDerivedTile = hasGlance || todayItems.length > 0;

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

      {/* Day by Day banner — renders each itinerary_today item attached to this portal */}
      {todayItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="space-y-4">
            {todayItems.map((item) => (
              <div key={item.id} data-wall-item data-variant="today">
                {item.dayByDay ? (
                  <DayByDayView
                    dayByDay={item.dayByDay}
                    itineraryTitle={item.resolvedTitle}
                  />
                ) : (
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
                    Today's plan unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto py-8 px-4">
        {visibleItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-gray-500">No content yet. Check back soon!</p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6">
            {/* Grid column */}
            <div>
              {/* Mobile: glance renders inline above grid */}
              {hasGlance && (
                <div className={`lg:hidden mb-6 relative ${!isClient && glanceItem && glanceItem.isVisible === false ? "opacity-40" : ""}`} data-wall-item data-variant="glance">
                  {!isClient && glanceItem && glanceItem.isVisible === false && (
                    <span className="absolute top-2 right-2 z-10 text-xs bg-gray-800 text-white px-2 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                  {glanceItem ? (
                    <ItineraryGlanceView glance={glanceItem.glance!} />
                  ) : (
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
                      Summary unavailable
                    </div>
                  )}
                </div>
              )}

              {/* Grid */}
              {gridItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tiles yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gridItems.map((item) => {
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

                    const hiddenInAdmin = !isClient && item.isVisible === false;

                    return (
                      <div
                        key={item.id}
                        data-wall-item
                        data-variant="full"
                        className={hiddenInAdmin ? "opacity-40 relative" : "relative"}
                      >
                        {hiddenInAdmin && (
                          <span className="absolute top-2 right-2 z-10 text-xs bg-gray-800 text-white px-2 py-0.5 rounded">
                            Hidden
                          </span>
                        )}
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

            {/* Desktop: glance sidebar sticky right */}
            {hasGlance && (
              <aside
                className="hidden lg:block"
                data-wall-item
                data-variant="glance"
              >
                <div className={`sticky top-4 relative ${!isClient && glanceItem && glanceItem.isVisible === false ? "opacity-40" : ""}`}>
                  {!isClient && glanceItem && glanceItem.isVisible === false && (
                    <span className="absolute top-2 right-2 z-10 text-xs bg-gray-800 text-white px-2 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                  {glanceItem ? (
                    <ItineraryGlanceView glance={glanceItem.glance!} />
                  ) : (
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
                      Summary unavailable
                    </div>
                  )}
                </div>
              </aside>
            )}
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
