import Image from "next/image";
import DescriptionRichTextEditor from "./DescriptionRichTextEditor";
import { FormWrapper } from "./forms/FormWrapper";

type BasicData = {
  description: string;
  image: File | undefined;
  imagePreviewUrl: string;
  setImagePreviewUrl: (v: string) => void;
};

type DescriptionImageFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function DescriptionImageForm({
  description,
  imagePreviewUrl,
  setImagePreviewUrl,
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
          <div className="w-full mt-8 border border-black rounded-lg relative py-3">
            <h4 className="absolute -top-3 left-3 text-sm px-1 bg-white">
              Image
            </h4>
            {imagePreviewUrl !== "" && (
              <Image
                src={imagePreviewUrl}
                width={0}
                height={0}
                alt="imagePreview"
                className="h-72 w-fit p-4"
              />
            )}
            <input
              className="rounded-md ml-4"
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
