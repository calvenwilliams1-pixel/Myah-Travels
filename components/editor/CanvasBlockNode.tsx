import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CanvasBlockComponent from "./CanvasBlockComponent";

export const CanvasBlockNode = Node.create({
  name: "canvasBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      templateId: {
        default: null,
      },
      templateName: {
        default: "",
      },
      canvasJson: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-canvas-block]",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return {};
          return {
            templateId: element.getAttribute("data-template-id"),
            templateName: element.getAttribute("data-template-name"),
            canvasJson: element.getAttribute("data-canvas-json"),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-canvas-block": "",
        "data-template-id": HTMLAttributes.templateId || "",
        "data-template-name": HTMLAttributes.templateName || "",
        "data-canvas-json": HTMLAttributes.canvasJson || "",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CanvasBlockComponent);
  },
});
