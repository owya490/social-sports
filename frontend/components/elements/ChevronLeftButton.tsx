import { ChevronLeftIcon } from "@heroicons/react/24/outline";

interface ChevronLeftButtonProps {
  handleClick: () => void;
}

export default function ChevronLeftButton(props: ChevronLeftButtonProps) {
  return (
    <button
      className="border border-1 border-black h-5 w-5 rounded-full p-0.5 flex justify-center items-center"
      onClick={props.handleClick}
    >
      <ChevronLeftIcon className="w-4 h-4" />
    </button>
  );
}
