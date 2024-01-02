import { ReactNode } from "react";

type FromWrapperProps = {
  title: string;
  children: ReactNode;
};

export function FormWrapper({ title, children }: FromWrapperProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-semibold mb-4">{title}</div>
      <div className="grid gap-2 w-1/3">{children}</div>
    </div>
  );
}
