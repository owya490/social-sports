import Image, { StaticImageData } from "next/image";

interface SportIconProps {
  name: string;
  image: StaticImageData;
  isFirst: boolean;
}

export default function SportIcon(props: SportIconProps) {
  return (
    <button
      className={`w-full flex justify-center snap-start`}
      // onClick={() => {}}
    >
      <div>
        <div className="flex justify-center">
          <Image
            src={props.image}
            width={0}
            height={0}
            alt="volleyballImage"
            className={`w-12 h-12 flex justify-center`}
          />
        </div>
        <p className="text-lg font-light grow text-center">{props.name}</p>
      </div>
    </button>
  );
}
