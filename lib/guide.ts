import { db } from "@/lib/db";
import {
  portals,
  portalMembers,
  itineraries,
  portalItems,
  posts,
} from "@/drizzle/schema";
import { count, isNotNull, isNull, eq, asc } from "drizzle-orm";
import { getSetting } from "@/lib/settings";

export interface GuideStep {
  id: string;
  title: string;
  line: string;
  actionLabel: string;
  href: string;
  done: boolean;
}

/**
 * The getting-started steps, with `done` detected from the real state of
 * the site (a portal exists, a traveller was added, and so on) — the
 * guide ticks itself off as the owner actually does the work.
 */
export async function getGuideSteps(): Promise<GuideStep[]> {
  const [portalRows, memberRows, itineraryRows, wallRows, postRows, homepageCanvas, welcomeContent, firstPortal] =
    await Promise.all([
      db.select({ c: count() }).from(portals).where(isNull(portals.deletedAt)),
      db.select({ c: count() }).from(portalMembers),
      db.select({ c: count() }).from(itineraries).where(isNull(itineraries.deletedAt)),
      db
        .select({ c: count() })
        .from(portalItems)
        .where(isNotNull(portalItems.itineraryId)),
      db
        .select({ c: count() })
        .from(posts)
        .where(eq(posts.status, "published")),
      getSetting("homepage_canvas"),
      getSetting("welcome_content"),
      db
        .select({ id: portals.id })
        .from(portals)
        .where(isNull(portals.deletedAt))
        .orderBy(asc(portals.id))
        .limit(1),
    ]);

  const hasPortal = (portalRows[0]?.c ?? 0) > 0;
  const portalId = firstPortal[0]?.id;
  const portalHref = portalId ? `/admin/portals/${portalId}` : "/admin/portals/new";

  return [
    {
      id: "portal",
      title: "Create a portal",
      line: "One portal for each trip or group. It's the private page your travellers will see.",
      actionLabel: "Create a portal",
      href: "/admin/portals/new",
      done: hasPortal,
    },
    {
      id: "travellers",
      title: "Add your travellers",
      line: "Add each person with their email. They get their own private link automatically — no passwords for them to remember.",
      actionLabel: hasPortal ? "Open your portal" : "See the portals",
      href: portalHref,
      done: (memberRows[0]?.c ?? 0) > 0,
    },
    {
      id: "itinerary",
      title: "Build the itinerary",
      line: "Add the days, flights and plans. It saves as you type — you can't lose your work.",
      actionLabel: hasPortal ? "Open the itinerary" : "Open the itinerary library",
      href: portalId ? `/admin/portals/${portalId}/itinerary` : "/admin/itineraries",
      done: (itineraryRows[0]?.c ?? 0) > 0,
    },
    {
      id: "share",
      title: "Share it on the wall",
      line: "Put the itinerary on the portal's wall, and your travellers can see it the moment they open their link.",
      actionLabel: "Open your portal",
      href: portalHref,
      done: (wallRows[0]?.c ?? 0) > 0,
    },
    {
      id: "homepage",
      title: "Make the homepage yours",
      line: "Your welcome photo and your words at the top of your site. Pick a layout you like — it always looks right, on phones too.",
      actionLabel: "Open the Homepage editor",
      href: "/admin/homepage",
      done: !!homepageCanvas || !!welcomeContent,
    },
    {
      id: "post",
      title: "Write your first post",
      line: "Posts show up on your homepage for everyone to read, sorted by the template you wrote them with.",
      actionLabel: "Write a post",
      href: "/admin/posts/new",
      done: (postRows[0]?.c ?? 0) > 0,
    },
  ];
}
