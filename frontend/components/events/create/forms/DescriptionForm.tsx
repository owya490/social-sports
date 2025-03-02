import { useState } from "react";
import DescriptionRichTextEditor from "../DescriptionRichTextEditor";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  description: string;
};

type DescriptionFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function DescriptionForm({ description, updateField }: DescriptionFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateDescription = (e: string) => {
    updateField({
      description: e,
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
        </div>
      </div>
    </FormWrapper>
  );
}
