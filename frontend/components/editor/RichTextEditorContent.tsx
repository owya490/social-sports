import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, UseEditorOptions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const RichTextEditorContent = ({
  description,
  options,
}: {
  description: string;
  options?: UseEditorOptions;
}) => {
  const editor = useEditor({
    editable: false,
    content: description,
    extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight],
    ...options,
  });
  return <EditorContent editor={editor} />;
};
