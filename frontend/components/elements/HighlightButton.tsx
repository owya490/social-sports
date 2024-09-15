import { MouseEventHandler } from "react";

interface ButtonProps {
  text?: string;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  className?: string;
  children?: React.ReactNode;
  type?: "submit" | "reset" | "button" | undefined;
  disabled?: boolean;
}

export const HighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap  bg-highlight-yellow text-white hover:bg-white hover:text-highlight-yellow border-2 border-highlight-yellow transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
      type={props.type}
      disabled={props.disabled}
    >
      {props.text}
      {props.children}
    </button>
  );
};

export const InvertedHighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `border-2 text-highlight-yellow font-semibold border-highlight-yellow px-4 py-1.5 rounded-lg lg:block whitespace-nowrap hover:bg-highlight-yellow hover:text-white transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
      type={props.type}
      disabled={props.disabled}
    >
      {props.text}
      {props.children}
    </button>
  );
};

export const RedHighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap  bg-highlight-red text-white hover:bg-white hover:text-highlight-red border-2 border-highlight-red transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
      type={props.type}
      disabled={props.disabled}
    >
      {props.text}
      {props.children}
    </button>
  );
};

export const BlackHighlightButton = (props: ButtonProps) => {
  return (
    <button
      className={
        `px-4 py-1.5 rounded-lg font-semibold whitespace-nowrap  bg-highlight-black text-white hover:bg-white hover:text-highlight-black border-2 border-highlight-black transition-colors duration-300 transform ` +
        props.className
      }
      onClick={props.onClick}
      type={props.type}
      disabled={props.disabled}
    >
      {props.text}
      {props.children}
    </button>
  );
};
