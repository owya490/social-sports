"use client";

import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { ListBulletIcon, LinkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import "./EventHubDescriptionEditor.css";

/**
 * Stripped TipTap for Event Hub edit: no sticky toolbar.
 * Bold / italic / list / link appear only on text selection via BubbleMenu.
 */

type EventHubDescriptionEditorProps = {
  description: string;
  updateDescription: (html: string) => void;
  placeholder?: string;
};

export function EventHubDescriptionEditor({
  description,
  updateDescription,
  placeholder = "Who should come? What’s the event about?",
}: EventHubDescriptionEditorProps) {
  const editor = useEditor({
    editable: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-foreground underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: description,
    editorProps: {
      attributes: {
        class:
          "event-hub-prose min-h-[7.5rem] max-w-none px-3 py-2.5 text-base sm:text-sm text-foreground font-sans leading-relaxed focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      updateDescription(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (description !== current) {
      editor.commands.setContent(description, false);
    }
  }, [description, editor]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="relative rounded-xl border border-border bg-background focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120, placement: "top" }}
        className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-1 shadow-[0_8px_28px_rgba(10,10,10,0.12)]"
      >
        <BubbleButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="text-xs font-bold">B</span>
        </BubbleButton>
        <BubbleButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="text-xs italic">I</span>
        </BubbleButton>
        <BubbleButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListBulletIcon className="h-3.5 w-3.5" aria-hidden />
        </BubbleButton>
        <BubbleButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" aria-hidden />
        </BubbleButton>
      </BubbleMenu>
      <EditorContent editor={editor} className="event-hub-description-editor" />
    </div>
  );
}

function BubbleButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus ${
        active ? "bg-surface-muted text-foreground" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
