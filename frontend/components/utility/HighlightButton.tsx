import { MouseEventHandler } from "react";

interface ButtonProps {
  text: string;
  onClick: MouseEventHandler<HTMLButtonElement> | undefined;
  className?: string;
}
export const HighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap  bg-highlight-yellow text-white hover:bg-white hover:text-highlight-yellow border-2 border-highlight-yellow transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
    >
      {props.text}
    </button>
  );
};

export const InvertedHighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `border-2 text-highlight-yellow font-semibold border-highlight-yellow px-4 py-1.5 rounded-lg lg:block whitespace-nowrap ml-4 hover:bg-highlight-yellow hover:text-white transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
    >
      {props.text}
    </button>
  );
};
