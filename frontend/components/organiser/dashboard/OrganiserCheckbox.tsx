import { Checkbox } from "@material-tailwind/react";
import Link from "next/link";

interface OrganiserCheckboxProps {
  label: string;
  link: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}
export default function OrganiserCheckbox(props: OrganiserCheckboxProps) {
  return (
    <div className="flex items-center">
      <Checkbox
        className="bg-organiser-light-gray checked:bg-highlight-yellow checked:hover:bg-highlight-yellow text-highlight-yellow focus:outline-none focus:ring-0 checked:border-0 checked:ring-0 focus:ring-offset-0"
        crossOrigin={undefined}
        checked={props.checked}
        onChange={props.onChange}
      />
      <Link href={props.link} className="">
        <p
          className={
            "text-md sm:text-lg text-slate-900 font-normal hover:underline hover:cursor-pointer " +
            (props.checked ? "line-through" : "")
          }
        >
          {props.label}
        </p>
      </Link>
    </div>
  );
}
