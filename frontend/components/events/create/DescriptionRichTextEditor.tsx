import { MantineProvider } from "@mantine/core";
import { Link, RichTextEditor } from "@mantine/tiptap";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import SubScript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function DescriptionRichTextEditor({
  description,
  updateDescription,
}: {
  description: string;
  updateDescription: (e: string) => void;
}) {
  const editor = useEditor({
    editable: true,
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write your description in here!" }),
    ],
    content: description,
    onUpdate: ({ editor }) => {
      updateDescription(editor.getHTML());
    },
  });

  // Function to determine if the screen is small
  const isSmallScreen = () => window.innerWidth <= 768;

  return (
    <MantineProvider>
      <RichTextEditor editor={editor} className="list-style-circle min-h-[24rem]">
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Highlight />
            <RichTextEditor.ClearFormatting />
            {isSmallScreen() ? null : (
              <>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
                <RichTextEditor.H4 />
              </>
            )}
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            {isSmallScreen() ? null : (
              <>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Hr />
                <RichTextEditor.BulletList />
                <RichTextEditor.Subscript />
                <RichTextEditor.Superscript />
              </>
            )}
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            {isSmallScreen() ? null : (
              <>
                <RichTextEditor.Link />
                <RichTextEditor.Unlink />
              </>
            )}
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            {isSmallScreen() ? null : (
              <>
                <RichTextEditor.AlignLeft />
                <RichTextEditor.AlignCenter />
                <RichTextEditor.AlignRight />
              </>
            )}
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
    </MantineProvider>
  );
}
