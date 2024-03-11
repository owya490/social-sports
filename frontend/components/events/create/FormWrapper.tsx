// FormWrapper.tsx

import { ReactNode } from "react";

type FormWrapperProps = {
  children: ReactNode;
};

export function FormWrapper({ children }: FormWrapperProps) {
  return <div className="flex w-full justify-center mt-28">{children}</div>;
}
