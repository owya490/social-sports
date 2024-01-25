import { Input } from "@material-tailwind/react";
import Image from "next/image";
import { useState } from "react";
import DescriptionRichTextEditor from "./DescriptionRichTextEditor";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  description: string;
  image: File | undefined;
};

type DescriptionImageFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function DescriptionImageForm({
  description,
  image,
  updateField,
}: DescriptionImageFormProps) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

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
            <Image
              src={imagePreviewUrl}
              width={0}
              height={0}
              alt="imagePreview"
              className="h-32 w-32"
            />
            <Input
              label="Image"
              crossOrigin={undefined}
              className="rounded-md"
              size="lg"
              accept="image/*"
              type="file"
              onChange={(e) => {
                if (e.target.files !== null) {
                  setImagePreviewUrl(URL.createObjectURL(e.target.files![0]));
                  updateField({
                    image: e.target.files![0],
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}
