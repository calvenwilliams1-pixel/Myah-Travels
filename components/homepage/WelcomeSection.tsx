import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getSetting } from "@/lib/settings";
import CanvasHomepage from "./CanvasHomepage";
import {
  resolveWelcomeContent,
  parseWelcomeTemplateId,
  type WelcomeContent,
} from "@/lib/welcome";

/**
 * The homepage welcome section (UI style plan, Pass 1b).
 *
 * Renders the canvas welcome unless the owner has switched
 * `welcome_mode` to "template" — the switch is hers, reversible, and
 * nothing is deleted either way. Templates render natively, so text
 * is full-size on phones (the canvas scales down whole; that's the
 * defect this replaces). All three templates share one content set
 * and the Pass 1a hero rules: scrim over photos, brand fallback when
 * no photo is set, next/image sizing.
 */
export default async function WelcomeSection() {
  const mode = await getSetting("welcome_mode");
  if (mode !== "template") {
    // Canvas mode keeps the exact wrapper the homepage has always
    // used, so nothing shifts until the owner flips the switch.
    return (
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <CanvasHomepage />
      </div>
    );
  }

  const [stored, canvasJson, templateRaw] = await Promise.all([
    getSetting("welcome_content"),
    getSetting("homepage_canvas"),
    getSetting("welcome_template"),
  ]);
  const { content } = resolveWelcomeContent(stored, canvasJson);
  const template = parseWelcomeTemplateId(templateRaw);

  if (template === "overlay") return <OverlayWelcome content={content} />;
  if (template === "split") return <SplitWelcome content={content} />;
  return <BannerWelcome content={content} />;
}

function WelcomeButton({ content, light }: { content: WelcomeContent; light?: boolean }) {
  if (!content.buttonLabel) return null;
  const href = content.buttonHref || "/contact";
  return (
    <Link href={href} className={light ? "btn-primary bg-white text-primary-dark hover:bg-white/90" : "btn-primary"}>
      {content.buttonLabel}
    </Link>
  );
}

function BannerWelcome({ content }: { content: WelcomeContent }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 md:pt-10">
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-gray-100">
        {content.photo ? (
          <Image
            src={content.photo}
            alt=""
            fill
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
        ) : (
          <div className="hero-fallback absolute inset-0" aria-hidden="true" />
        )}
      </div>
      <div className="mx-auto max-w-2xl py-10 text-center md:py-12">
        {content.heading && (
          <h2 className="mb-4 text-display font-semibold text-gray-900">{content.heading}</h2>
        )}
        {content.text && <p className="mb-8 leading-relaxed text-gray-700">{content.text}</p>}
        <WelcomeButton content={content} />
      </div>
    </section>
  );
}

function OverlayWelcome({ content }: { content: WelcomeContent }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative flex min-h-[430px] items-end md:min-h-[520px]">
        {content.photo ? (
          <>
            <Image
              src={content.photo}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="hero-scrim" aria-hidden="true" />
          </>
        ) : (
          <div className="hero-fallback absolute inset-0" aria-hidden="true" />
        )}
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-12 pt-24 text-center">
          {content.heading && (
            <h2 className="mb-4 text-display font-semibold text-white">{content.heading}</h2>
          )}
          {content.text && <p className="mb-8 leading-relaxed text-white/90">{content.text}</p>}
          <WelcomeButton content={content} light />
        </div>
      </div>
    </section>
  );
}

function SplitWelcome({ content }: { content: WelcomeContent }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
          {content.photo ? (
            <Image
              src={content.photo}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 576px"
              className="object-cover"
            />
          ) : (
            <div className="hero-fallback absolute inset-0" aria-hidden="true" />
          )}
        </div>
        <div>
          {content.heading && (
            <h2 className="mb-4 text-display font-semibold text-gray-900">{content.heading}</h2>
          )}
          {content.text && <p className="mb-8 leading-relaxed text-gray-700">{content.text}</p>}
          <WelcomeButton content={content} />
        </div>
      </div>
    </section>
  );
}
