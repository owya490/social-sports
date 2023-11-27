import { URL } from "@/interfaces/Types";
import Image from "next/image";

interface IEventImage {
    imageSrc: URL;
}

export default function EventImage(props: IEventImage) {
    return (
        <Image
            src={props.imageSrc}
            alt="..."
            width={0}
            height={0}
            className="object-cover lg:object-cover w-full h-[30vh] lg:h-full 2xl:h-fit rounded-3xl"
        />
    );
}
