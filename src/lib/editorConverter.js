function readInlineNodes(nodes) {
  return Array.from(nodes || [])
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        return text
          ? {
              type: "text",
              text
            }
          : null;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return null;

      const element = node;
      const text = element.textContent || "";
      if (!text) return null;

      const marks = [];
      const tagName = element.tagName.toLowerCase();

      if (tagName === "strong" || tagName === "b") marks.push({ type: "bold" });
      if (tagName === "em" || tagName === "i") marks.push({ type: "italic" });
      if (tagName === "u") marks.push({ type: "underline" });

      return {
        type: "text",
        text,
        ...(marks.length ? { marks } : {})
      };
    })
    .filter(Boolean);
}

export function convertHTMLToBlocks(html) {
  if (typeof window === "undefined") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html || "", "text/html");
  const blocks = [];

  Array.from(doc.body.childNodes).forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push({
        block_order: index,
        block_type: "paragraph",
        content: {
          type: "paragraph",
          content: [{ type: "text", text: node.textContent.trim() }]
        },
        metadata: {}
      });
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (tagName === "hr") {
      blocks.push({
        block_order: index,
        block_type: "separator",
        content: { type: "separator" },
        metadata: {}
      });
      return;
    }

    if (tagName === "img") {
      blocks.push({
        block_order: index,
        block_type: "image",
        content: {
          type: "image",
          attrs: {
            src: element.getAttribute("src"),
            alt: element.getAttribute("alt") || ""
          }
        },
        metadata: {
          caption: element.getAttribute("alt") || ""
        }
      });
      return;
    }

    if (["h1", "h2", "h3"].includes(tagName)) {
      blocks.push({
        block_order: index,
        block_type: "heading",
        content: {
          type: "heading",
          level: Number(tagName.slice(1)),
          content: readInlineNodes(element.childNodes)
        },
        metadata: {}
      });
      return;
    }

    const inlineContent = readInlineNodes(element.childNodes);
    if (!inlineContent.length && element.textContent?.trim()) {
      inlineContent.push({ type: "text", text: element.textContent.trim() });
    }

    blocks.push({
      block_order: index,
      block_type: "paragraph",
      content: {
        type: "paragraph",
        content: inlineContent
      },
      metadata: {}
    });
  });

  return blocks;
}

export function convertHTMLToPlainTextBlocks(html) {
  const blocks = convertHTMLToBlocks(html);

  return blocks
    .map((block, index) => {
      const content = Array.isArray(block?.content?.content)
        ? block.content.content.map((item) => item?.text || "").join("").trim()
        : "";

      if (block.block_type === "image" || block.block_type === "separator") return null;

      return {
        body: block.block_type === "heading" ? content : content,
        sort_order: index + 1
      };
    })
    .filter((item) => item?.body);
}

export function stripHtml(value) {
  if (!value) return "";
  if (typeof window === "undefined") return value;
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return doc.body.textContent || "";
}
