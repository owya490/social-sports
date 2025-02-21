"use client";
import Loading from "@/components/loading/Loading";
import { EmptyUserData, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { getPublicUserById } from "@/services/src/users/usersService";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserProfilePage({ params }: any) {
  const userId: UserId = params.id;
  const [loading, setLoading] = useState(true);
  const [publicUserProfile, setPublicUserProfile] = useState<PublicUserData>(EmptyUserData);
  useEffect(() => {
    getPublicUserById(userId).then((user) => {
      setPublicUserProfile(user);
      setLoading(false);
    });
  }, []);
  return loading ? (
    <Loading />
  ) : (
    <div className="mt-16 w-full flex justify-center">
      <div className="screen-width-primary">
        <div className="flex">
          <div id="col-1" className="pt-8">
            <div className="px-8 py-12 border rounded-xl">
              <div className="flex items-center gap-4">
                <Image
                  priority
                  src={publicUserProfile.profilePicture}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-24 w-24 rounded-full overflow-hidden border-black border"
                />
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    {`${publicUserProfile.firstName} ${publicUserProfile.surname}`}{" "}
                    {publicUserProfile.isVerifiedOrganiser && (
                      <div>
                        <Image src={Tick} alt="Verified Organiser" className="h-6 w-6 ml-2" />
                      </div>
                    )}
                  </h2>
                  <p className="font-thin text-sm">{`${publicUserProfile.username}`}</p>
                </div>
              </div>
              <div className="h-[1px] bg-core-outline my-4"></div>
              <div className=" space-y-1">
                <h3 className="text-lg">Contact Information</h3>
                <span className="flex items-center gap-4">
                  <EnvelopeIcon className="w-4 h-4" />
                  <p className="text-xs font-light">
                    {publicUserProfile.publicContactInformation?.email || "Not provided"}
                  </p>
                </span>
                <span className="flex items-center gap-4">
                  <PhoneIcon className="w-4 h-4" />
                  <p className="text-xs font-light">
                    {publicUserProfile.publicContactInformation?.email || "Not provided"}
                  </p>
                </span>
              </div>
            </div>
          </div>
          <div id="col-2">cat</div>
        </div>
      </div>
    </div>
  );
}
