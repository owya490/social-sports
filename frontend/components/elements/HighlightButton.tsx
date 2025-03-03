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
        `px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap text-core-text hover:bg-core-hover transition-colors duration-300 transform ` +
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
        `border border-core-outline hover:border-core-text font-semibold text-sm px-4 py-1.5 text-core-text rounded-lg lg:block whitespace-nowrap hover:bg-core-hover transition-colors duration-300 transform ` +
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
        `px-33222 py-1 rounded-lg font-semibold whitespace-nowrap bg-white text-black hover:bg-black hover:text-white border-2 border-black transition-colors duration-300 transform ` +
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
