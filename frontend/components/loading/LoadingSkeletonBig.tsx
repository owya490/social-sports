import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonBig() {
  return (
    <>
      <Skeleton
        height={30}
        width={120}
        wrapper={({ children }) => {
          return <div className="h-10 flex items-center">{children}</div>;
        }}
      />
      <Skeleton
        height={24}
        width={240}
        wrapper={({ children }) => {
          return <div className="h-8 flex items-center ">{children}</div>;
        }}
      />
      <Skeleton
        height={24}
        width={240}
        wrapper={({ children }) => {
          return <div className="h-8 flex items-center">{children}</div>;
        }}
      />
      <Skeleton
        height={48}
        width={240}
        wrapper={({ children }) => {
          return <div className="h-8 flex items-center">{children}</div>;
        }}
      />
    </>
  );
}
