import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import "../../styles/components/RichTextEditor.css";

export default function RichTextEditor({ initialContent, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write your story here..."
      }),
      Image.configure({
        inline: true,
        allowBase64: true
      })
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) onChange(html);
    }
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      <div className="rte-toolbar">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`rte-toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={`rte-toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
          className={`rte-toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          title="Underline"
        >
          <u>U</u>
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("left").run(); }}
          className={`rte-toolbar-btn ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
          title="Align Left"
        >
          <i className="fa-solid fa-align-left" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("center").run(); }}
          className={`rte-toolbar-btn ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
          title="Center"
        >
          <i className="fa-solid fa-align-center" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign("right").run(); }}
          className={`rte-toolbar-btn ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
          title="Align Right"
        >
          <i className="fa-solid fa-align-right" />
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
          className={`rte-toolbar-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          className={`rte-toolbar-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
          title="Heading 2"
        >
          H2
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`rte-toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          title="Bullet List"
        >
          <i className="fa-solid fa-list-ul" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={`rte-toolbar-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          title="Numbered List"
        >
          <i className="fa-solid fa-list-ol" />
        </button>

        <div className="rte-divider" />

        <button
          type="button"
          onClick={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run(); }}
          className="rte-toolbar-btn"
          title="Horizontal Rule"
        >
          —
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const url = window.prompt("Enter image URL:");
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="rte-toolbar-btn"
          title="Insert Image"
        >
          <i className="fa-regular fa-image" />
        </button>
      </div>

      <div className="rte-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
