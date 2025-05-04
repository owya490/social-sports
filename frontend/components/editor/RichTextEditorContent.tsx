import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const RichTextEditorContent = ({ description }: { description: string }) => {
  const editor = useEditor({
    editable: false,
    content: description,
    extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight],
  });
  return <EditorContent editor={editor} />;
};
