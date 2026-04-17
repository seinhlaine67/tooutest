// src/lib/editorConverter.ts
// Converts TipTap HTML output to your novel_blocks JSONB format

export interface NovelBlock {
  block_order: number;
  block_type: "paragraph" | "heading" | "image" | "separator" | "callout";
  content: any;
  metadata: any;
}

export function convertHTMLToBlocks(html: string): NovelBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const blocks: NovelBlock[] = [];
  let blockOrder = 0;

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      // Convert text node to paragraph
      blocks.push({
        block_order: blockOrder++,
        block_type: "paragraph",
        content: {
          type: "paragraph",
          content: [{ type: "text", text: node.textContent }],
        },
        metadata: {},
      });
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case "h1":
      case "h2":
      case "h3":
        blocks.push({
          block_order: blockOrder++,
          block_type: "heading",
          content: {
            type: "heading",
            level: parseInt(tagName[1]),
            content: convertInlineContent(element),
          },
          metadata: {},
        });
        break;

      case "p":
        blocks.push({
          block_order: blockOrder++,
          block_type: "paragraph",
          content: {
            type: "paragraph",
            content: convertInlineContent(element),
          },
          metadata: {},
        });
        break;

      case "img":
        blocks.push({
          block_order: blockOrder++,
          block_type: "image",
          content: {
            type: "image",
            attrs: {
              src: element.getAttribute("src"),
              alt: element.getAttribute("alt"),
            },
          },
          metadata: {
            caption: element.getAttribute("alt") || "",
          },
        });
        break;

      case "hr":
        blocks.push({
          block_order: blockOrder++,
          block_type: "separator",
          content: { type: "separator" },
          metadata: {},
        });
        break;

      default:
        // Recursively process children
        element.childNodes.forEach(processNode);
    }
  };

  const convertInlineContent = (element: Element) => {
    const content: any[] = [];

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        content.push({
          type: "text",
          text: node.textContent,
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const marks: any[] = [];

        if (el.tagName.toLowerCase() === "strong") marks.push({ type: "bold" });
        if (el.tagName.toLowerCase() === "em") marks.push({ type: "italic" });
        if (el.tagName.toLowerCase() === "u") marks.push({ type: "underline" });

        content.push({
          type: "text",
          text: el.textContent || "",
          marks: marks.length > 0 ? marks : undefined,
        });
      }
    });

    return content;
  };

  body.childNodes.forEach(processNode);
  return blocks;
}
