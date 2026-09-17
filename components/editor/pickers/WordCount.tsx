"use client";

import React from "react";
import type { Editor } from "@tiptap/react";

interface WordCountProps {
  editor: Editor;
}

const WORDS_PER_MINUTE = 200;

export default function WordCount({ editor }: WordCountProps) {
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const characters = editor.storage.characterCount?.characters?.() ?? 0;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));

  return (
    <div className="text-xs text-gray-400 flex items-center gap-3">
      <span>{words} {words === 1 ? "word" : "words"}</span>
      <span className="text-gray-300">·</span>
      <span>{characters} chars</span>
      <span className="text-gray-300">·</span>
      <span>{minutes} min read</span>
    </div>
  );
}
