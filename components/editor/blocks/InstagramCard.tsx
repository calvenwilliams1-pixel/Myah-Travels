"use client";

import React from "react";

interface InstagramCardProps {
  url: string;
  caption?: string;
}

export default function InstagramCard({ url, caption }: InstagramCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block my-4 border border-gray-200 rounded-lg overflow-hidden hover:border-emerald-500 transition-colors"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
          IG
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">
            {caption || "View on Instagram"}
          </p>
          <p className="text-sm text-gray-500">instagram.com</p>
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </a>
  );
}
