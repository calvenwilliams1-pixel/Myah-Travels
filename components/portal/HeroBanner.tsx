import React from "react";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  preset: string;
}

const PRESETS: Record<string, string> = {
  minimal: "bg-white text-gray-900",
  coastal: "bg-gradient-to-r from-blue-400 to-cyan-300 text-white",
  dark: "bg-gray-900 text-white",
  desert: "bg-gradient-to-r from-amber-300 to-orange-400 text-amber-900",
  alpine: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
  tropical: "bg-gradient-to-r from-teal-400 to-rose-400 text-white",
  editorial: "bg-slate-800 text-white",
  sunset: "bg-gradient-to-r from-rose-400 to-orange-400 text-white",
};

export default function HeroBanner({ title, subtitle, image, preset }: HeroBannerProps) {
  if (image) {
    return (
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img
          src={image.startsWith("/") ? image : `/uploads/${image}`}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
            {subtitle && <p className="text-lg mt-2">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  }

  const presetClass = PRESETS[preset] || PRESETS.minimal;

  return (
    <div className={`w-full py-16 text-center ${presetClass}`}>
      <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
      {subtitle && <p className="text-lg mt-2 opacity-80">{subtitle}</p>}
    </div>
  );
}
