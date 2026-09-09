import React from "react";

interface WallItemProps {
  item: {
    id: number;
    sourceType: string;
    resolvedTitle: string;
    resolvedDescription: string | null;
    resolvedType: string;
    resolvedCategory: string | null;
    resolvedFilePath: string | null;
    resolvedTextContent: string | null;
  };
}

export default function WallItemRenderer({ item }: WallItemProps) {
  const { resolvedType, resolvedTitle, resolvedDescription, resolvedFilePath, resolvedTextContent } = item;

  if (resolvedType === "pdf") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="text-4xl mb-3">📄</div>
        <h3 className="font-semibold">{resolvedTitle}</h3>
        {resolvedDescription && (
          <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
        )}
        {resolvedFilePath && (
          <a
            href={`/uploads/${resolvedFilePath}`}
            className="inline-block mt-3 text-sm text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        )}
      </div>
    );
  }

  if (resolvedType === "image") {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {resolvedFilePath && (
          <img
            src={`/uploads/${resolvedFilePath}`}
            alt={resolvedTitle}
            className="w-full h-auto"
          />
        )}
        <div className="p-4">
          <h3 className="font-semibold">{resolvedTitle}</h3>
          {resolvedDescription && (
            <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
          )}
        </div>
      </div>
    );
  }

  // Text type
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="font-semibold">{resolvedTitle}</h3>
      {resolvedDescription && (
        <p className="text-sm text-gray-600 mt-1">{resolvedDescription}</p>
      )}
      {resolvedTextContent && (
        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{resolvedTextContent}</p>
      )}
    </div>
  );
}
