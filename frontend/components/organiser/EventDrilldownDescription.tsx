import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React from "react";

interface EventDrilldownDescriptionProps {
  description: string;
}

const EventDrilldownDescription = ({ description }: EventDrilldownDescriptionProps) => {
  const editor = useEditor({
    editable: false,
    content: description,
    extensions: [StarterKit, Underline, Link, Superscript, SubScript, Highlight],
  });
  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default EventDrilldownDescription;
