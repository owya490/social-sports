import { uploadUserImage } from "@/services/imageService";
import { FormWrapper } from "./FormWrapper";

type DescriptionData = {
    //name: string;
    description: string;
    image: string;
};

type DescriptionFormProps = DescriptionData & {
    updateField: (fields: Partial<DescriptionData>) => void;
};

export function DescriptionForm({
    //name,
    description,
    image,
    updateField,
}: DescriptionFormProps) {
    const handleUpload = async (file: File | undefined) => {
        if (file) {
            try {
                const url = await uploadUserImage("imageTest", file);
                updateField({ image: url });
                console.log("Uploaded image URL:", url);
            } catch (error) {
                console.error("Error uploading image:", error);
            }
        }
    };

    return (
        <FormWrapper title="">
            {/* <label className="font-semibold">Name of Event</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="text"
        value={name}
        onChange={(e) => updateField({ name: e.target.value })}
      /> */}
            <label className="font-semibold">Description of your event</label>
            <input
                className="border-2 rounded-full p-2"
                required
                type="text"
                value={description}
                onChange={(e) => updateField({ description: e.target.value })}
            />
            <label className="font-semibold">
                Upload a cover photo for your event
            </label>
            <input
                className="border-2 rounded-full p-2 px-4"
                type="file"
                value={image}
                onChange={(e) => handleUpload(e.target.files?.[0])}
            />
        </FormWrapper>
    );
}
