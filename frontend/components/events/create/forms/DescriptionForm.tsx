"use client";
import { FormId } from "@/interfaces/FormTypes";
import { UserData } from "@/interfaces/UserTypes";
import { FULFILMENT_SESSION_ENABLED } from "@/services/src/fulfilment/fulfilmentServices";
import DescriptionRichTextEditor from "../../../editor/DescriptionRichTextEditor";
import { FormSelector } from "./FormSelector";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  description: string;
  formId: FormId | null;
};

type DescriptionFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
  user: UserData;
};

export function DescriptionForm({ description, formId, updateField, user }: DescriptionFormProps) {
  const updateDescription = (e: string) => {
    updateField({
      description: e,
    });
  };

  const updateFormId = (formId: FormId | null) => {
    updateField({
      formId: formId,
    });
  };

  return (
    <FormWrapper>
      <div className="mb-32 space-y-12">
        <div>
          <label className="text-black text-lg font-semibold">Write a Description for your event!</label>
          <div className="w-full mt-8">
            <DescriptionRichTextEditor description={description} updateDescription={updateDescription} />
          </div>
          {!FULFILMENT_SESSION_ENABLED && (
            <>
              <div className="w-full mt-8">
                <FormSelector formId={formId} updateField={updateFormId} user={user} />
              </div>
            </>
          )}
        </div>
      </div>
    </FormWrapper>
  );
}
