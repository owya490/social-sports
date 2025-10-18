import { LoadingSpinner } from "./LoadingSpinner";
interface LoadingProps {
  inline?: boolean;
}

export default function LoadingOrganiser({ inline }: LoadingProps) {
  return (
    <div className={inline ? "" : `h-[calc(100vh-var(--navbar-height))] w-full flex justify-center items-center`}>
      <LoadingSpinner />
    </div>
  );
}
