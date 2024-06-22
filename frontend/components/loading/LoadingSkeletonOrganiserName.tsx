import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonOrganiserName() {
  return (
    <div className="mt-8 mb-11">
      <Skeleton
        height={34}
        width={300}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center">{children}</div>;
        }}
      />
    </div>
  );
}
