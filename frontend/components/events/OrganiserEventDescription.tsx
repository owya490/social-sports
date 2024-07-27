import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface OrganiserEventDescriptionProps {
  description: string;
}

export default function OrganiserEventDescription(props: OrganiserEventDescriptionProps) {
  const editor = useEditor({
    editable: false,
    content: props.description,
    extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight],
  });
  return (
    <div className="w-full">
      <div className="text-md lg:text-lg mt-2 mb-[-2]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
