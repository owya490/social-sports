import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { UserInlineDisplay } from "@/components/users/UserInlineDisplay";
import { PublicUserData } from "@/interfaces/UserTypes";

export const HeaderSectionResponse = ({
  formTitle,
  formDescription,
  organiser,
}: {
  formTitle: string;
  formDescription: string;
  organiser: PublicUserData;
}) => {
  return (
    <div className="flex bg-white p-8 rounded-xl flex-col gap-4">
      <div>
        <h1 className="font-bold text-3xl mb-2">{formTitle}</h1>
        <UserInlineDisplay organiser={organiser} />
      </div>
      <div className="font-light text-sm text-left">
        <RichTextEditorContent description={formDescription} />
      </div>
    </div>
  );
};
