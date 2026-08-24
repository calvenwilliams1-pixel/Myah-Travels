import React from "react";
import Link from "next/link";
import Certifications from "./Certifications";
import { getAllSettings } from "@/lib/settings";

export default async function Footer() {
  const settings = await getAllSettings();
  const year = new Date().getFullYear();

  const instagramUrl = settings.instagram_url || "https://instagram.com";
  const youtubeUrl = settings.youtube_url || "https://youtube.com";

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">
              {settings.site_name || "Myah Travels"}
            </h3>
            <p className="text-sm text-gray-600">
              {settings.tagline || "Travel can be big or small and I'm here to write it all"}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/videos" className="text-gray-600 hover:text-emerald-700">Videos</Link></li>
              <li><Link href="/about" className="text-gray-600 hover:text-emerald-700">About</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-emerald-700">FAQ</Link></li>
              <li><Link href="/privacy" className="text-gray-600 hover:text-emerald-700">Privacy Policy</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-emerald-700">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Connect</h4>
            <div className="flex gap-4 mb-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-pink-600 text-sm"
                aria-label="Visit our Instagram page"
              >
                Instagram
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-red-600 text-sm"
                aria-label="Visit our YouTube channel"
              >
                YouTube
              </a>
            </div>
            <Certifications />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {year} {settings.site_name || "Myah Travels"}. All rights reserved.
          </p>
          {settings.footer_text && (
            <p className="text-xs text-gray-400 mt-1">{settings.footer_text}</p>
          )}
          <Link
            href="/admin/login"
            className="inline-block mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Admin login"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
