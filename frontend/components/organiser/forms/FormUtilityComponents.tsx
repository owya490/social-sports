import { Tooltip } from "@material-tailwind/react";
import { ReactNode } from "react";

interface ResponsiveTooltipProps {
  content: string;
  children: ReactNode;
}

interface FormNavButtonProps {
  onClick: ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void) | (() => void);
  tooltipContent: string;
  children: ReactNode;
  disabled?: boolean;
}

const ResponsiveTooltip = ({ content, children }: ResponsiveTooltipProps) => {
  return (
    <div className="relative h-fit">
      <div className="hidden md:block">
        <Tooltip content={content} placement="right">
          {children}
        </Tooltip>
      </div>
      <div className="block md:hidden">
        <Tooltip content={content} placement="bottom">
          {children}
        </Tooltip>
      </div>
    </div>
  );
};

const FormNavButton = ({ onClick, tooltipContent, disabled, children }: FormNavButtonProps) => {
  return (
    <ResponsiveTooltip content={tooltipContent}>
      <button
        onClick={onClick}
        className={`flex items-center justify-center sm:h-16 sm:w-16 h-14 w-14 rounded-md hover:bg-core-hover transition ease-in-out ${
          disabled ? "opacity-25 cursor-not-allowed" : ""
        }`}
        disabled={disabled}
      >
        {children}
      </button>
    </ResponsiveTooltip>
  );
};

export { FormNavButton, ResponsiveTooltip };
