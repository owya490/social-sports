import { Link } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface EventDescriptionProps {
  title: string;
  description: string;
}

export default function EventDescription(props: EventDescriptionProps) {
  const editor = useEditor({
    editable: false,
    content: props.description,
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
    ],
  });
  return (
    <div className="w-full">
      <div className="text-2xl lg:text-3xl 2xl:text-4xl mt-7">
        <h1>{props.title}</h1>
      </div>
      <div className="space-y-3.5 text-md lg:text-lg 2xl:text-xl mt-6 mb-10">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
