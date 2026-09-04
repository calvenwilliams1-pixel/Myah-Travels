import React from "react";
import { BlockData, Template } from "@/types/blocks";
import { getTemplateStyle } from "@/lib/blocks/styles";
import TitleRenderer from "./TitleRenderer";
import BodyRenderer from "./BodyRenderer";
import CalloutRenderer from "./CalloutRenderer";
import HeroRenderer from "./HeroRenderer";
import ImageRenderer from "./ImageRenderer";
import GalleryRenderer from "./GalleryRenderer";
import QuickFactsRenderer from "./QuickFactsRenderer";
import QuoteRenderer from "./QuoteRenderer";
import ProsConsRenderer from "./ProsConsRenderer";
import VerdictRenderer from "./VerdictRenderer";

interface PostRendererProps {
  blocks: BlockData[];
  template: Template;
}

export default function PostRenderer({ blocks, template }: PostRendererProps) {
  const style = getTemplateStyle(template.themeVariant);

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <h1
        className="text-2xl font-semibold mb-6"
        style={{ color: style.headingColor, fontFamily: style.fontFamily }}
      >
        Preview: {template.name}
      </h1>

      <div>
        {blocks.map((block) => {
          switch (block.type) {
            case "title":
              return <TitleRenderer key={block.id} data={block.data} style={style} />;
            case "body":
              return <BodyRenderer key={block.id} data={block.data} style={style} />;
            case "callout":
              return <CalloutRenderer key={block.id} data={block.data} style={style} />;
            case "hero":
              return <HeroRenderer key={block.id} data={block.data} style={style} />;
            case "image":
              return <ImageRenderer key={block.id} data={block.data} style={style} />;
            case "gallery":
              return <GalleryRenderer key={block.id} data={block.data} style={style} />;
            case "quickFacts":
              return <QuickFactsRenderer key={block.id} data={block.data} style={style} />;
            case "quote":
              return <QuoteRenderer key={block.id} data={block.data} style={style} />;
            case "prosCons":
              return <ProsConsRenderer key={block.id} data={block.data} style={style} />;
            case "verdict":
              return <VerdictRenderer key={block.id} data={block.data} style={style} />;
            default: {
              const _exhaustive: never = block;
              return null;
            }
          }
        })}
      </div>
    </div>
  );
}
