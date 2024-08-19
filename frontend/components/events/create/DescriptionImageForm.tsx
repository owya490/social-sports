import Image from "next/image";
import { useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateDescription = (e: string) => {
    updateField({
      description: e,
    });
  };

  // Validate image type
  const validateImage = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (validTypes.includes(file.type)) {
      return true;
    } else {
      setErrorMessage("Please upload a valid image file (jpg, png, gif).");
      return false;
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let validFile: File | undefined;
      let fileList = Array.from(e.target.files);
      
      for (const file of fileList) {
        if (validateImage(file)) {
          // Set the first valid file and break
          validFile = file;
          break;
        }
      }

      if (validFile) {
        setErrorMessage(null);
        setImagePreviewUrl(URL.createObjectURL(validFile));
        updateField({
          image: validFile,
        });
      }
    }
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
        <div>
          <label className="text-black text-lg font-semibold">Upload a photo as your event cover.</label>
          <p className="text-xs font-light">
            If your image upload button isn&apos;t working, try closing and reopening the browser.
          </p>
          <div className="w-full mt-8 border border-black rounded-lg relative py-3">
            <h4 className="absolute -top-3 left-3 text-sm px-1 bg-white">Image</h4>
            {imagePreviewUrl !== "" && (
              <Image src={imagePreviewUrl} width={0} height={0} alt="imagePreview" className="h-72 w-fit p-4" />
            )}
            <div className="flex flex-wrap mt-4"></div>
            <input
              className="rounded-md mt-4 ml-4"
              accept="image/*"
              type="file"
              multiple // Allow multiple files
              onChange={handleFileChange}
            />
          </div>
          {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
        </div>
      </div>
    </FormWrapper>
  );
}
