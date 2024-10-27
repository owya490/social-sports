import Skeleton from "react-loading-skeleton";

export default function LoadingSkeletonEventCard() {
  return (
    <div className="w-full px-2">
      <Skeleton
        height={150}
        wrapper={({ children }) => {
          return <div className="h-[10.5rem] flex items-center w-full">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={190}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center ml-2">{children}</div>;
        }}
      />
      <Skeleton
        height={20}
        width={240}
        wrapper={({ children }) => {
          return <div className="h-8 flex items-center ml-2">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={160}
        wrapper={({ children }) => {
          return <div className="h-5 flex items-center ml-2">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={160}
        wrapper={({ children }) => {
          return <div className="h-5 flex items-center ml-2 mt-4">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={160}
        wrapper={({ children }) => {
          return <div className="h-5 flex items-center ml-2 mt-1">{children}</div>;
        }}
      />
      <Skeleton
        height={6}
        width={100}
        wrapper={({ children }) => {
          return <div className="h-3 flex items-center mt-10 mb-4 ml-2">{children}</div>;
        }}
      />
    </div>
  );
}
