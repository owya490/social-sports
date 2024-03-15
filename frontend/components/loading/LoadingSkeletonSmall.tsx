import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonSmall() {
  return (
    <>
      <Skeleton
        height={6}
        width={120}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={60}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center ">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={80}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center">{children}</div>;
        }}
      />
    </>
  );
}
