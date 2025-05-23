import { MantineProvider } from "@mantine/core";
import { Link, RichTextEditor } from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./custom-styles.css"; // Import custom styles

export default function DescriptionRichTextEditor({
  description,
  updateDescription,
}: {
  description: string;
  updateDescription: (e: string) => void;
}) {
  const editor = useEditor({
    editable: true,
    extensions: [StarterKit, Link, Underline, Highlight, TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: description,
    onUpdate: ({ editor }) => {
      updateDescription(editor.getHTML());
    },
  });

  const isSmallScreen = () => window.innerWidth <= 768;

  return (
    <MantineProvider>
      <RichTextEditor editor={editor} className="">
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

        <RichTextEditor.Content className="custom-bullet-list" />
      </RichTextEditor>
    </MantineProvider>
  );
}
