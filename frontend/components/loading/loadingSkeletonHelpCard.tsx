import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonHelpCard() {
  return (
    <div
      className="w-full"
      style={{
        aspectRatio: "16/9",
        borderRadius: "1rem",
      }}
    >
      <Skeleton
        height="100%"
        width="100%"
        wrapper={({ children }) => <div className="h-full w-full flex items-center justify-center">{children}</div>}
      />
    </div>
  );
}
