import { Checkbox } from "@material-tailwind/react";
import Link from "next/link";

interface OrganiserCheckboxProps {
  label: string;
  link: string;
}
export default function OrganiserCheckbox(props: OrganiserCheckboxProps) {
  return (
    <div className="flex items-center">
      <Checkbox
        className="bg-organiser-light-gray checked:bg-highlight-yellow checked:hover:bg-highlight-yellow text-highlight-yellow focus:outline-none focus:ring-0 checked:border-0 checked:ring-0"
        crossOrigin={undefined}
      />
      <Link href={props.link} className="">
        <p className="text-lg text-slate-900 font-normal hover:underline hover:cursor-pointer">{props.label}</p>
      </Link>
    </div>
  );
}
