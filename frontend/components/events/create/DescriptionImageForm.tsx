import { Input } from "@material-tailwind/react";
import DescriptionRichTextEditor from "./DescriptionRichTextEditor";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  description: string;
};

type DescriptionImageFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function DescriptionImageForm({
  description,
  updateField,
}: DescriptionImageFormProps) {
  const updateDescription = (e: string) => {
    updateField({
      description: e,
    });
  };

  return (
    <FormWrapper>
      <div className="mb-32 space-y-12">
        <div>
          <label className="text-black text-lg font-semibold">
            Write a Description for your event!
          </label>
          <div className="w-full mt-8">
            <DescriptionRichTextEditor
              description={description}
              updateDescription={updateDescription}
            />
          </div>
        </div>
        <div>
          <label className="text-black text-lg font-semibold">
            Upload a photo as your event cover.
          </label>
          <div className="w-full mt-8">
            <Input
              label="Price"
              crossOrigin={undefined}
              className="rounded-md"
              size="lg"
              type="file"
            />
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}
