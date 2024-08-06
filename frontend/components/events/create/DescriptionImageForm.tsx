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
  const [previousImages, setPreviousImages] = useState<string[]>([]);

  // useEffect(() => {
  //   // Fetch previous images from Firebase and set them in state
  //   // fetchPreviousImagesFromFirebase().then((images) => {
  //     setPreviousImages(images);
  // //   });
  // }, []);

  const updateDescription = (e: string) => {
    updateField({
      description: e,
    });
  };

  // const fetchPreviousImagesFromFirebase = async () => {
  //   // Fetch previous images from Firebase and return their URLs
  //   // Example: You can use Firebase Firestore or Firebase Realtime Database to store image URLs
  //   const images = await fetch('YOUR_FIREBASE_IMAGE_URLS_ENDPOINT');
  //   const data = await images.json();
  //   return data.urls;
  // };

  // const handleImageSelection = (imageUrl: string) => {
  //   // Set the selected image URL as the preview URL
  //   setImagePreviewUrl(imageUrl);
  //   // Optionally, you can set the image field in your form data
  //   updateField({
  //     image: undefined, // Clear the image field since the user selected a previous image
  //   });
  // };

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
            <div className="flex flex-wrap mt-4">
              {/* {previousImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="cursor-pointer mr-4 mb-4"
                  onClick={() => handleImageSelection(imageUrl)}
                >
                  <Image
                    src={imageUrl}
                    width={100}
                    height={100}
                    alt={`Previous Image ${index}`}
                    className="rounded-md"
                  />
                </div>
              ))} */}
            </div>
            <input
              className="rounded-md mt-4 ml-4"
              accept="image/*"
              type="file"
              onChange={(e) => {
                if (e.target.files !== null) {
                  setImagePreviewUrl(URL.createObjectURL(e.target.files[0]));
                  updateField({
                    image: e.target.files[0],
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
