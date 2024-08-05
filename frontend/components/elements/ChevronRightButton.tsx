import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface ChevronRightButtonProps {
  handleClick: () => void;
}

export default function ChevronRightButton(props: ChevronRightButtonProps) {
  return (
    <button
      className="border border-1 border-black h-5 w-5 rounded-full p-0.5 flex justify-center items-center"
      onClick={props.handleClick}
    >
      <ChevronRightIcon className="w-4 h-4" />
    </button>
  );
}
