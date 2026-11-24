/**
 * The More page's groups (R4 of the UI overhaul). When the header
 * shrank to Home, More, and View Site, every destination the old
 * 12-link header held moved here, grouped under three plain
 * headings: Clients, Content, Setup. The parity test in
 * tests/more-links.test.ts pins the full list, so a destination can
 * never quietly fall off the page.
 *
 * The Guide appears only under the same rule it always had: the
 * owner's account, and only until the guide is complete.
 */
export interface MoreLink {
  href: string;
  label: string;
  hint: string;
}

export interface MoreGroup {
  heading: string;
  links: MoreLink[];
}

export function getMoreGroups(showGuide: boolean): MoreGroup[] {
  const setup: MoreLink[] = [
    { href: "/admin/settings", label: "Settings", hint: "Your site's settings, including the words clients read" },
  ];
  if (showGuide) {
    setup.push({ href: "/admin/guide", label: "Guide", hint: "The step by step walkthrough" });
  }

  return [
    {
      heading: "Clients",
      links: [
        { href: "/admin/portals", label: "Portals", hint: "Your trip portals" },
        { href: "/admin/clients", label: "Clients", hint: "Everyone you work with" },
        { href: "/admin/itineraries", label: "Itinerary Library", hint: "All your itineraries" },
      ],
    },
    {
      heading: "Content",
      links: [
        { href: "/admin/posts", label: "Posts", hint: "What shows on your homepage" },
        { href: "/admin/homepage", label: "Homepage", hint: "Your welcome and how the page looks" },
        { href: "/admin/templates", label: "Templates", hint: "Layouts you can reuse for posts" },
        { href: "/admin/media", label: "Media", hint: "Your photos and files" },
        { href: "/admin/content-library", label: "Content Library", hint: "Documents you reuse" },
      ],
    },
    { heading: "Setup", links: setup },
  ];
}
