import { PublicUserData, UserId } from "@/interfaces/UserTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import Link from "next/link";

export const UserInlineDisplay = ({
  organiserId,
  organiser,
}: {
  organiserId: UserId;
  organiser?: PublicUserData | null;
}) => {
  const displayOrganiser = organiser || {
    userId: organiserId,
    firstName: organiserId || "Unknown",
    surname: organiserId ? "" : "Organiser",
    profilePicture: DEFAULT_USER_PROFILE_PICTURE,
    isVerifiedOrganiser: false,
  };

  return (
    <div className="flex ml-0.5 items-center">
      <Image
        src={displayOrganiser.profilePicture || DEFAULT_USER_PROFILE_PICTURE}
        alt="DP"
        width={50}
        height={50}
        className="rounded-full w-4 h-4"
      />
      <Link
        href={displayOrganiser.userId ? `/user/${displayOrganiser.userId}` : "#"}
        className="text-xs font-light px-1.5 py-1 rounded-full hover:bg-core-hover"
      >{`Hosted by ${displayOrganiser.firstName} ${displayOrganiser.surname}`}</Link>
      {displayOrganiser.isVerifiedOrganiser && <Image src={Tick} alt="Verified Organiser" className="h-4 w-4 ml-1" />}
    </div>
  );
};
