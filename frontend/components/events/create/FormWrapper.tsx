// FormWrapper.tsx

import { ReactNode } from "react";

type FormWrapperProps = {
  title: string;
  children: ReactNode;
};

export function FormWrapper({ title, children }: FormWrapperProps) {
  return (
    <div className="flex flex-col items-center p-4 sm:p-8 md:p-12 lg:p-16 xl:p-20 mt-8 sm:mt-8 md:mt-8 lg:mt-8 xl:mt-8">
      <div className="text-2xl font-semibold mb-4">{title}</div>
      <div className="grid gap-4 w-full sm:w-2/3 md:w-1/2 lg:w-1/3 xl:w-1/4">
        {children}
      </div>
    </div>
  );
}
