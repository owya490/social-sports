import { UserId } from "@/interfaces/UserTypes";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";

interface UserCardProps {
  userId: UserId;
  firstName: string;
  surname: string;
  username: string;
  email: string;
  image: string;
  loading: boolean;
  isClickable?: boolean;
}

export const UserCard = ({
  userId,
  firstName,
  surname,
  username,
  email,
  image,
  loading,
  isClickable = true,
}: UserCardProps) => {
  const cardContent = (
    <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] hover:bg-core-hover transition-all duration-300 md:min-w-72 px-4 rounded-lg">
      {loading ? (
        <div className="w-full">
          <LoadingSkeletonEventCard />
        </div>
      ) : (
        <>
          <div className="w-full flex overflow-x-hidden items-center">
            <div
              className="h-12"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                aspectRatio: "1/1",
                borderRadius: "50%",
              }}
            ></div>
            <div className="p-4">
              <div className="flex">
                <h4 className="font-light text-gray-500 text-xs">{username}</h4>
              </div>
              <h2 className="text-lg font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-core-text">
                {firstName + `${surname ? " " + surname : ""}`}
              </h2>
              <div className="mt-1 space-y-3">
                <div className="flex items-center ml-0.5">
                  <EnvelopeIcon className="w-4 shrink-0" />
                  <p className="ml-1 font-light text-core-text text-xs whitespace-nowrap overflow-hidden">
                    {email || "Not provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return isClickable ? <Link href={`/user/${userId}`}>{cardContent}</Link> : cardContent;
};
