import { LoadingSpinner } from "./LoadingSpinner";
interface LoadingProps {
  inline?: boolean;
}

export default function Loading({ inline }: LoadingProps) {
  return (
    <div className={inline ? "" : `h-[calc(100vh-var(--navbar-height))] w-screen flex justify-center items-center`}>
      <LoadingSpinner />
    </div>
  );
}
