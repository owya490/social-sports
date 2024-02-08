import { URL } from "@/interfaces/Types";
import Image from "next/image";

interface EventImageProps {
  imageSrc: URL;
}

export default function EventImage(props: EventImageProps) {
  return (
    <Image
      priority={true}
      src={props.imageSrc}
      alt="..."
      width={0}
      height={0}
      className="object-cover w-full h-[60vh] max-h-56 sm:max-h-full sm:rounded-3xl"
    />
  );
}
