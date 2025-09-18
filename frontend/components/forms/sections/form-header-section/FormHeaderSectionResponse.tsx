import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { UserInlineDisplay } from "@/components/users/UserInlineDisplay";
import { PublicUserData } from "@/interfaces/UserTypes";

export const FormHeaderSectionResponse = ({
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
      <p className="font-light text-sm">
        {/* {formDescription} */}
        <RichTextEditorContent description={formDescription} />
      </p>
    </div>
  );
};
