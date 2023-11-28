import Image, { StaticImageData } from "next/image";

interface IFilterIcon {
  name: string;
  image: StaticImageData;
  style: string;
  isFirst: boolean;
}

export default function FilterIcon(props: IFilterIcon) {
  return (
    <div
      className={`${
        props.isFirst ? "mr-6 md:mr-8" : "min-w-[6rem] md:min-w-[8rem]"
      } flex justify-center snap-center`}
    >
      <div>
        <div className="flex justify-center">
          <Image
            src={props.image}
            width={0}
            height={0}
            alt="volleyballImage"
            className={`${props.style} flex justify-center`}
          />
        </div>
        <p className="text-sm font-light grow text-center">{props.name}</p>
      </div>
    </div>
  );
}
