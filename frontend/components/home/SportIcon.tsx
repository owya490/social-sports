import Image, { StaticImageData } from "next/image";

interface SportIconProps {
  name: string;
  image: StaticImageData;
  isFirst: boolean;
}

export default function SportIcon(props: SportIconProps) {
  return (
    <button
      className={`min-w-[5rem] w-full flex justify-center snap-start`}
      // onClick={() => {}}
    >
      <div>
        <div className="flex justify-center">
          <Image
            src={props.image}
            width={0}
            height={0}
            alt="volleyballImage"
            className="h-8 w-8 md:w-12 md:h-12 flex justify-center"
          />
        </div>
        <p className="text-sm md:text-base lg:text-lg font-light grow text-center">
          {props.name}
        </p>
      </div>
    </button>
  );
}
