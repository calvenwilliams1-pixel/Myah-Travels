import ThemeProvider from "@/components/theme/ThemeProvider";

// The portal tree needs the site theme too: shared components (the
// Button, itinerary accents) read var(--color-primary) and friends,
// which only exist inside ThemeProvider. Without this layout those
// elements rendered unstyled — the access page's Continue button was
// white text on a transparent background, i.e. invisible.
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
