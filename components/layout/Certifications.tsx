import React from "react";
import { getCertifications } from "@/lib/settings";

export default async function Certifications() {
  const certifications = await getCertifications();

  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {certifications.map((cert) => (
        <div key={cert.id} className="flex items-center gap-2">
          {cert.imagePath && cert.imagePath.trim() !== "" ? (
            <img
              src={cert.imagePath}
              alt={cert.title}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              {cert.title}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
