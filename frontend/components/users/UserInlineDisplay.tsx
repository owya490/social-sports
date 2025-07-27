import { PublicUserData } from "@/interfaces/UserTypes";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import Link from "next/link";

export const UserInlineDisplay = ({ organiser }: { organiser: PublicUserData }) => {
  return (
    <div className="flex ml-0.5 items-center">
      <Image src={organiser.profilePicture} alt="DP" width={50} height={50} className="rounded-full w-4 h-4" />
      <Link
        href={`/user/${organiser.userId}`}
        className="text-xs font-light px-1.5 py-1 rounded-full hover:bg-core-hover"
      >{`Hosted by ${organiser.firstName} ${organiser.surname}`}</Link>
      {organiser.isVerifiedOrganiser && <Image src={Tick} alt="Verified Organiser" className="h-4 w-4 ml-1" />}
    </div>
  );
};
