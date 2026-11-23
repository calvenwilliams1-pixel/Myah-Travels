import { getSetting } from "@/lib/settings";
import { parsePromoDeals, type PromoDeal } from "@/lib/promos";

const OFFERS_URL = "https://www.dslaptravel.com/offers";

function DealCard({ deal, hero = false }: { deal: PromoDeal; hero?: boolean }) {
  return (
    <a
      href={deal.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-shadow hover:shadow-lg"
    >
      <span
        className={`relative block w-full bg-gray-50 ${
          hero ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[4/3]"
        }`}
      >
        {/* Flyer creative: contain, never cropped — the offer text is
            baked into the picture and must stay fully readable. */}
        <img
          src={deal.image}
          alt={deal.title || "Current travel deal"}
          loading={hero ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          View deal →
        </span>
      </span>
      {deal.title && (
        <span className="block px-4 py-3 text-sm font-medium text-gray-800">
          {deal.title}
        </span>
      )}
    </a>
  );
}

/**
 * The deals band: promo flyers synced from Myah's agency storefront,
 * shown under the welcome section. Every picture is the button — a
 * click takes the customer to that offer on the storefront, where the
 * booking happens. Renders nothing when no promos are synced.
 */
export default async function PromoDeals() {
  const deals = parsePromoDeals(await getSetting("promo_deals"));
  if (deals.length === 0) return null;
  const [hero, ...rest] = deals;

  return (
    <section className="section-y-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-h2 font-display">Featured Deals</h2>
            <p className="mt-1 text-gray-600">
              Current offers from my agency — tap any deal to see it and book.
            </p>
          </div>
          <a
            href={OFFERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            See all offers →
          </a>
        </div>
        <DealCard deal={hero} hero />
        {rest.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((deal) => (
              <DealCard key={deal.image} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
