// FormWrapper.tsx

import { ReactNode } from "react";

type FormWrapperProps = {
  children: ReactNode;
};

export function FormWrapper({ children }: FormWrapperProps) {
  return (
    <div className="flex w-full justify-center mt-28">
      <div className="w-11/12 lg:w-2/3 2xl:w-2/5">{children}</div>
    </div>
  );
}
