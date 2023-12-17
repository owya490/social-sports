import { ReactNode } from "react";

type FromWrapperProps = {
  title: string;
  children: ReactNode;
};

export function FormWrapper({ title, children }: FromWrapperProps) {
  return (
    <div>
      <div className="">{title}</div>
    </div>
  );
}
