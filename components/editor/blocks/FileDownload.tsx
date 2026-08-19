"use client";

import React from "react";

interface FileDownloadProps {
  fileName: string;
  fileUrl: string;
  fileSize?: string;
}

export default function FileDownload({
  fileName,
  fileUrl,
  fileSize,
}: FileDownloadProps) {
  return (
    <a
      href={fileUrl}
      download={fileName}
      className="flex items-center gap-3 my-4 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
        📄
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800">{fileName}</p>
        {fileSize && <p className="text-sm text-gray-500">{fileSize}</p>}
      </div>
      <span className="text-emerald-700 font-medium">Download</span>
    </a>
  );
}
