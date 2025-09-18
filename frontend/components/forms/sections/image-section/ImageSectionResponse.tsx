import { ImageSection } from "@/interfaces/FormTypes";
import Image from "next/image";
interface ImageSectionResponseProps {
  imageSection: ImageSection;
}

export const ImageSectionResponse = ({ imageSection }: ImageSectionResponseProps) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {imageSection.title && (
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900">{imageSection.title}</h3>
        </div>
      )}
      <Image
        src={imageSection.imageUrl}
        alt={imageSection.title || "Form image"}
        className="w-full aspect-video object-cover"
        width={0}
        height={0}
      />
    </div>
  );
};
