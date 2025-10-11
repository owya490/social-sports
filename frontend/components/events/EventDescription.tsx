import { RichTextEditorContent } from "../editor/RichTextEditorContent";

interface EventDescriptionProps {
  title: string;
  description: string;
}

export default function EventDescription(props: EventDescriptionProps) {
  return (
    <div className="w-full">
      <div className="text-2xl lg:text-2xl 2xl:text-3xl font-semibold mt-7">
        <h1>Event Description</h1>
      </div>
      <div className="space-y-3.5 text-md lg:text-lg 2xl:text-xl mt-6 mb-10">
        <RichTextEditorContent description={props.description} />
      </div>
    </div>
  );
}
