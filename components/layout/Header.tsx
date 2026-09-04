import React from "react";
import Link from "next/link";
import Navigation from "./Navigation";
import MobileMenu from "./MobileMenu";

interface HeaderProps {
  siteName?: string;
  logoPath?: string;
}

export default function Header({ siteName = "MyCalTravels", logoPath }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between relative">
        <Link href="/" aria-label="Go to homepage" className="flex items-center gap-2">
          {logoPath && logoPath.trim() !== "" ? (
            <img
              src={logoPath}
              alt={siteName}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-xl font-semibold text-[var(--color-primary)]">
              {siteName}
            </span>
          )}
        </Link>

        <Navigation />
        <MobileMenu />
      </div>
    </header>
  );
}
