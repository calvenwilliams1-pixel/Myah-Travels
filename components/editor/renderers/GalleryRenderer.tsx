"use client";

import React, { useState, useRef, useEffect } from "react";
import { GalleryData, TemplateStyle, GalleryStyle, GalleryColumns, GalleryAspect, GalleryGap, GalleryCaptionDisplay } from "@/types/blocks";

interface GalleryRendererProps {
  data: GalleryData;
  style: TemplateStyle;
}

interface ResolvedLayout {
  style: GalleryStyle;
  columns: GalleryColumns;
  aspect: GalleryAspect;
  gap: GalleryGap;
  captionDisplay: GalleryCaptionDisplay;
}

function resolveLayout(data: GalleryData): ResolvedLayout {
  return {
    style: data.style ?? "grid",
    columns: data.columns ?? 3,
    aspect: data.aspect ?? "landscape",
    gap: data.gap ?? "medium",
    captionDisplay: data.captionDisplay ?? "below",
  };
}

const GAP_PX: Record<GalleryGap, string> = {
  small: "8px",
  medium: "16px",
  large: "24px",
};

const ASPECT_RATIO: Record<GalleryAspect, string | undefined> = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
  auto: undefined,
};

interface LightboxProps {
  images: { url: string; caption: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}

function GalleryLightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (index !== null && !dlg.open) {
      dlg.showModal();
    } else if (index === null && dlg.open) {
      dlg.close();
    }
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate((index + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate((index - 1 + images.length) % images.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onNavigate]);

  if (index === null) {
    return <dialog ref={dialogRef} onClose={onClose} />;
  }

  const img = images[index];
  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      style={{
        border: "none",
        padding: 0,
        background: "rgba(0,0,0,0.92)",
        maxWidth: "100vw",
        maxHeight: "100vh",
        width: "100vw",
        height: "100vh",
        margin: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "48px 64px",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: "16px", right: "16px",
            background: "rgba(255,255,255,0.15)", color: "#fff",
            border: "none", borderRadius: "50%", width: "40px", height: "40px",
            fontSize: "20px", cursor: "pointer",
          }}
        >×</button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onNavigate((index - 1 + images.length) % images.length)}
              aria-label="Previous"
              style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "none", borderRadius: "50%", width: "48px", height: "48px",
                fontSize: "24px", cursor: "pointer",
              }}
            >‹</button>
            <button
              type="button"
              onClick={() => onNavigate((index + 1) % images.length)}
              aria-label="Next"
              style={{
                position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "none", borderRadius: "50%", width: "48px", height: "48px",
                fontSize: "24px", cursor: "pointer",
              }}
            >›</button>
          </>
        )}
        <img
          src={img.url}
          alt={img.caption || "Gallery image"}
          style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
        />
        {img.caption && (
          <p style={{ color: "#fff", marginTop: "16px", fontSize: "14px", textAlign: "center" }}>
            {img.caption}
          </p>
        )}
      </div>
    </dialog>
  );
}

interface LayoutProps {
  images: { url: string; caption: string }[];
  layout: ResolvedLayout;
  style: TemplateStyle;
  onOpen: (index: number) => void;
}

function Caption({ caption, layout, style }: { caption: string; layout: ResolvedLayout; style: TemplateStyle }) {
  if (!caption || layout.captionDisplay === "hidden") return null;
  if (layout.captionDisplay === "overlay") {
    return (
      <figcaption style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 10px 8px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
        color: "#fff", fontSize: "12px", fontFamily: style.fontFamily,
      }}>{caption}</figcaption>
    );
  }
  return (
    <figcaption style={{ fontSize: "12px", color: style.bodyColor, marginTop: "4px", fontFamily: style.fontFamily }}>
      {caption}
    </figcaption>
  );
}

function GridLayout({ images, layout, style, onOpen }: LayoutProps) {
  const aspect = ASPECT_RATIO[layout.aspect];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
      gap: GAP_PX[layout.gap],
      margin: style.galleryMargin,
    }} className="gallery-grid">
      {images.map((img, i) => (
        <figure key={i} style={{ margin: 0, position: layout.captionDisplay === "overlay" ? "relative" : undefined, cursor: "zoom-in" }}>
          <img
            src={img.url}
            alt={img.caption || "Gallery image " + (i + 1)}
            onClick={() => onOpen(i)}
            style={{
              width: "100%",
              aspectRatio: aspect,
              height: aspect ? undefined : "auto",
              objectFit: "cover",
              borderRadius: style.galleryBorderRadius,
              display: "block",
            }}
          />
          <Caption caption={img.caption} layout={layout} style={style} />
        </figure>
      ))}
    </div>
  );
}

function MasonryLayout({ images, layout, style, onOpen }: LayoutProps) {
  return (
    <div style={{
      columnCount: layout.columns,
      columnGap: GAP_PX[layout.gap],
      margin: style.galleryMargin,
    }} className="gallery-masonry">
      {images.map((img, i) => (
        <figure key={i} style={{
          margin: `0 0 ${GAP_PX[layout.gap]} 0`,
          breakInside: "avoid",
          position: layout.captionDisplay === "overlay" ? "relative" : undefined,
          cursor: "zoom-in",
        }}>
          <img
            src={img.url}
            alt={img.caption || "Gallery image " + (i + 1)}
            onClick={() => onOpen(i)}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: style.galleryBorderRadius,
            }}
          />
          <Caption caption={img.caption} layout={layout} style={style} />
        </figure>
      ))}
    </div>
  );
}

function CarouselLayout({ images, layout, style, onOpen }: LayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  function scrollTo(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setCurrent(index);
  }

  return (
    <div style={{ position: "relative", margin: style.galleryMargin }}>
      <div
        ref={scrollRef}
        className="gallery-carousel"
        style={{
          display: "flex",
          gap: GAP_PX[layout.gap],
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "thin",
        }}
      >
        {images.map((img, i) => (
          <figure key={i} style={{
            margin: 0,
            flex: "0 0 auto",
            width: "min(80%, 480px)",
            scrollSnapAlign: "start",
            position: layout.captionDisplay === "overlay" ? "relative" : undefined,
            cursor: "zoom-in",
          }}>
            <img
              src={img.url}
              alt={img.caption || "Gallery image " + (i + 1)}
              onClick={() => onOpen(i)}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: style.galleryBorderRadius,
              }}
            />
            <Caption caption={img.caption} layout={layout} style={style} />
          </figure>
        ))}
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to image ${i + 1}`}
              style={{
                width: "8px", height: "8px", borderRadius: "50%",
                border: "none", cursor: "pointer", padding: 0,
                background: i === current ? style.bodyColor : "#d1d5db",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroThenGridLayout({ images, layout, style, onOpen }: LayoutProps) {
  const [hero, ...rest] = images;
  const aspect = ASPECT_RATIO[layout.aspect];
  return (
    <div style={{ margin: style.galleryMargin }}>
      <figure style={{
        margin: 0,
        position: layout.captionDisplay === "overlay" ? "relative" : undefined,
        cursor: "zoom-in",
        marginBottom: GAP_PX[layout.gap],
      }}>
        <img
          src={hero.url}
          alt={hero.caption || "Gallery hero"}
          onClick={() => onOpen(0)}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "min(60vh, 500px)",
            objectFit: "cover",
            borderRadius: style.galleryBorderRadius,
            display: "block",
          }}
        />
        <Caption caption={hero.caption} layout={layout} style={style} />
      </figure>
      {rest.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
          gap: GAP_PX[layout.gap],
        }} className="gallery-grid">
          {rest.map((img, i) => (
            <figure key={i} style={{
              margin: 0,
              position: layout.captionDisplay === "overlay" ? "relative" : undefined,
              cursor: "zoom-in",
            }}>
              <img
                src={img.url}
                alt={img.caption || "Gallery image " + (i + 2)}
                onClick={() => onOpen(i + 1)}
                style={{
                  width: "100%",
                  aspectRatio: aspect,
                  height: aspect ? undefined : "auto",
                  objectFit: "cover",
                  borderRadius: style.galleryBorderRadius,
                  display: "block",
                }}
              />
              <Caption caption={img.caption} layout={layout} style={style} />
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GalleryRenderer({ data, style }: GalleryRendererProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (data.images.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#9ca3af",
          border: "1px dashed #d1d5db",
          borderRadius: style.galleryBorderRadius,
          margin: style.galleryMargin,
          fontFamily: style.fontFamily,
        }}
      >
        Gallery placeholder
      </div>
    );
  }

  const layout = resolveLayout(data);
  const layoutProps: LayoutProps = {
    images: data.images,
    layout,
    style,
    onOpen: (i) => setLightboxIndex(i),
  };

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media print {
          .gallery-carousel { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; }
          .gallery-carousel figure { width: 100% !important; }
          .gallery-grid figure, .gallery-masonry figure { break-inside: avoid; }
          dialog { display: none !important; }
        }
      `}</style>
      {layout.style === "grid" && <GridLayout {...layoutProps} />}
      {layout.style === "masonry" && <MasonryLayout {...layoutProps} />}
      {layout.style === "carousel" && <CarouselLayout {...layoutProps} />}
      {layout.style === "hero-then-grid" && <HeroThenGridLayout {...layoutProps} />}
      <GalleryLightbox
        images={data.images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(next) => setLightboxIndex(next)}
      />
    </>
  );
}
