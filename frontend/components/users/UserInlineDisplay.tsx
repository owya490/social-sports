import { PublicUserData } from "@/interfaces/UserTypes";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import Link from "next/link";

interface UserInlineDisplayProps {
  organiser: PublicUserData;
  isLinkEnabled?: boolean;
}

export const UserInlineDisplay = ({ organiser, isLinkEnabled = true }: UserInlineDisplayProps) => {
  const organiserLabel = `Hosted by ${organiser.firstName} ${organiser.surname}`;
  const organiserClassName = "text-xs font-light px-1.5 py-1 rounded-full hover:bg-core-hover";

  return (
    <div className="flex ml-0.5 items-center">
      <Image src={organiser.profilePicture} alt="DP" width={50} height={50} className="rounded-full w-4 h-4" />
      {isLinkEnabled ? (
        <Link href={`/user/${organiser.userId}`} className={organiserClassName}>
          {organiserLabel}
        </Link>
      ) : (
        <span className={organiserClassName}>{organiserLabel}</span>
      )}
      {organiser.isVerifiedOrganiser && <Image src={Tick} alt="Verified Organiser" className="h-4 w-4 ml-1" />}
    </div>
  );
};
