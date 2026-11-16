import { URL } from "@/interfaces/Types";
import Image from "@/components/elements/AppImage";

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
      alt="Event Image"
      width={0}
      height={0}
      // Follows .screen-width-primary, the event page banner container.
      sizes="(max-width: 639px) 100vw, (max-width: 767px) 500px, (max-width: 1023px) 700px, (max-width: 1535px) 1000px, 1200px"
      className="object-cover h-auto w-full aspect-video"
    />
  );
}
