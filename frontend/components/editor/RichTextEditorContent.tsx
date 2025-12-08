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
  return (
    <div className="[&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p]:my-2 [&_.ProseMirror_a]:text-blue-600 [&_.ProseMirror_a]:underline [&_.ProseMirror_a:hover]:text-blue-800">
      <EditorContent editor={editor} />
    </div>
  );
};
