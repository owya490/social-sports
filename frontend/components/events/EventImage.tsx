import { URL } from "@/interfaces/Types";
import Image from "next/image";

interface EventImageProps {
  imageSrc: URL;
}

export default function EventImage(props: EventImageProps) {
  return (
    <Image
      priority
      fetchPriority="high"
      rel="preload"
      loading="eager"
      src={props.imageSrc}
      alt="..."
      width={0}
      height={0}
      className="object-cover w-full aspect-video"
    />
  );
}
