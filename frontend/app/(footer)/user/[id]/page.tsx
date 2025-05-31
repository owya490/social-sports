"use client";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import ChevronLeftButton from "@/components/elements/ChevronLeftButton";
import ChevronRightButton from "@/components/elements/ChevronRightButton";
import EventCard from "@/components/events/EventCard";
import Loading from "@/components/loading/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { getPublicUserById } from "@/services/src/users/usersService";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserProfilePage({ params }: any) {
  const userId: UserId = params.id;
  const [loading, setLoading] = useState(true);
  const [publicUserProfile, setPublicUserProfile] = useState<PublicUserData>(EmptyPublicUserData);
  const [upcomingOrganiserEvents, setUpcomingOrganiserEvents] = useState<EventData[]>([]);
  useEffect(() => {
    getPublicUserById(userId, true).then((user) => {
      setPublicUserProfile(user);

      const fetchEvents = async () => {
        const eventPromises = (user.publicUpcomingOrganiserEvents || []).map(
          (eventId) => getEventById(eventId) // Get the event by its ID
        );

        // Wait for all promises to resolve
        const events = await Promise.all(eventPromises);

        // Update the state with the fetched events
        setUpcomingOrganiserEvents(events);
        setLoading(false);
      };

      fetchEvents();
    });
  }, []);

  const scrollLeft = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: -50,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  return loading ? (
    <Loading />
  ) : (
    <div className="mt-16 w-full flex justify-center mb-8">
      <div className="screen-width-primary">
        <div className="md:flex gap-16">
          <div id="col-1" className="pt-8 min-w-80">
            <div className="px-8 py-6 border rounded-xl">
              <div className="flex items-center gap-4">
                <Image
                  priority
                  src={publicUserProfile.profilePicture}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-20 w-20 rounded-full overflow-hidden border-black border"
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
          <div id="col-2" className="pt-8">
            <h1 className="hidden md:block text-3xl font-bold">{`About ${publicUserProfile.firstName} ${publicUserProfile.surname}`}</h1>
            <p className="md:pt-8 pb-6 font-light">
              <RichTextEditorContent description={publicUserProfile.bio || "No bio provided."} />
            </p>
            <div className="h-[1px] bg-core-outline my-4"></div>
          </div>
        </div>
        {/* <div className="block">
          <div className="w-full flex justify-center">
            <div className="flex my-5 w-full">
              <h5 className="font-bold text-lg">{`Upcoming Events by ${publicUserProfile.firstName} ${publicUserProfile.surname}`}</h5>
            </div>
          </div>
        </div>
        {upcomingOrganiserEvents.length !== 0 ? (
          <div className="flex items-center">
            <div className="hidden sm:block pr-2">
              <ChevronLeftButton handleClick={scrollLeft} />
            </div>

            <div id="recommended-event-overflow" className="flex overflow-x-auto pb-4 snap-x snap-mandatory">
              <div className="flex space-x-2 xl:space-x-8">
                {upcomingOrganiserEvents.map((event, i) => {
                  return (
                    <div key={`recommended-event-${i}`} className="snap-start w-[300px] min-h-[250px]">
                      <EventCard
                        eventId={event.eventId}
                        image={event.image}
                        thumbnail={event.thumbnail}
                        name={event.name}
                        organiser={event.organiser}
                        startTime={event.startDate}
                        location={event.location}
                        price={event.price}
                        vacancy={event.vacancy}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden sm:block pl-2">
              <ChevronRightButton handleClick={scrollRight} />
            </div>
          </div>
        ) : (
          <p className="font-thin">No upcoming events by this organiser.</p>
        )} */}
        <div className="my-6 h-[1px] bg-core-outline w-full"></div>
        <div className="block">
          <div className="w-full flex justify-center">
            <div className="flex my-5 w-full">
              <h5 className="font-bold text-lg">{`Shop ${publicUserProfile.firstName}'s merchandise collection`}</h5>
              <a className="ml-auto text-xs font-thin hover:underline" href={`/user/${userId}/shop`}>
                Shop the entire collection
              </a>
            </div>
          </div>
        </div>
        {upcomingOrganiserEvents.length !== 0 ? (
          <div className="flex items-center">
            <div className="hidden sm:block pr-2">
              <ChevronLeftButton handleClick={scrollLeft} />
            </div>

            <div id="recommended-event-overflow" className="flex overflow-x-auto pb-4 snap-x snap-mandatory">
              <div className="flex space-x-2 xl:space-x-8">
                <div className="snap-start w-[300px] min-h-[250px]">
                  <EventCard
                    eventId={"1"}
                    image={
                      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/shop%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FMHQr4VH2okw0muIsgKYb.jpg?alt=media&token=993066e7-49d7-4585-8dd9-139b0c94eb50"
                    }
                    thumbnail={
                      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/shop%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FMHQr4VH2okw0muIsgKYb.jpg?alt=media&token=993066e7-49d7-4585-8dd9-139b0c94eb50"
                    }
                    name={"2025 SPORTSHUB HOODIE"}
                    organiser={upcomingOrganiserEvents[1].organiser}
                    startTime={upcomingOrganiserEvents[1].startDate}
                    location={upcomingOrganiserEvents[1].location}
                    price={upcomingOrganiserEvents[1].price}
                    vacancy={upcomingOrganiserEvents[1].vacancy}
                  />
                </div>

                <div className="snap-start w-[300px] min-h-[250px]">
                  <EventCard
                    eventId={"1"}
                    image={
                      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/shop%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FSPORTSHUB_YETI.png?alt=media&token=9102452a-90bd-4a6c-8a65-75dc2d9724b7"
                    }
                    thumbnail={
                      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/shop%2Fc5vFAZ3NlSXVuHGrwlkCjJr3RXX2%2FSPORTSHUB_YETI.png?alt=media&token=9102452a-90bd-4a6c-8a65-75dc2d9724b7"
                    }
                    name={"2025 SPORTSHUB HOODIE"}
                    organiser={upcomingOrganiserEvents[1].organiser}
                    startTime={upcomingOrganiserEvents[1].startDate}
                    location={upcomingOrganiserEvents[1].location}
                    price={upcomingOrganiserEvents[1].price}
                    vacancy={upcomingOrganiserEvents[1].vacancy}
                  />
                </div>

                <div className="snap-start w-[300px] min-h-[250px]">
                  <EventCard
                    eventId={"1"}
                    image={
                      "https://rendering.mcp.cimpress.com/v2/vp/preview?height=500&width=500&instructions_uri=https%3A%2F%2Finstructions.documents.cimpress.io%2Fv3%2Finstructions%3Apreview%3FdocumentUri%3Dhttps%253A%252F%252Fartworkgeneration.cimpress.io%252Fapi%252Fv3%252Fcomposition%253Agenerate%253Fassets%253D%25257B%252522images%252522%25253A%25255B%25257B%252522printUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252Fprint%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522previewUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252FwebPreview%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522originalSourceUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252Foriginal%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522width%252522%25253A400%25252C%252522height%252522%25253A343%25252C%252522cropFractions%252522%25253A%25257B%252522top%252522%25253A0%25252C%252522left%252522%25253A0%25252C%252522bottom%252522%25253A0%25252C%252522right%252522%25253A0%25257D%25252C%252522purpose%252522%25253A%252522logo%252522%25257D%25255D%25257D%2526surfaceSpecificationUrl%253Dhttps%25253A%25252F%25252Fdesign-specifications.docext.cimpress.io%25252Fv2%25252FdesignViews%25252Fproducts%25252FPRD-50WYSA3XP%25252F9%25253FoptionSelections%25255BSubstrate%252520Color%25255D%25253D%252523000000%252526optionSelections%25255BSize%25255D%25253D2XL%252526optionSelections%25255BDecoration%252520Technology%25255D%25253DScreen%252520Printing%252526optionSelections%25255BDeco%252520Area%25255D%25253DFull%252520Front%252526optionSelections%25255BBackside%25255D%25253DBlank%252526culture%25253Den-AU%252526requester%25253Dproduct-discovery-page%2526panels%253Dfirst%2526apiKey%253DTqptbhrUm4RFk7nvgzuQGywEMVcKfNP93HX%26ignoreProjection%3Dtrue&scene=https%3A%2F%2Fassets.documents.cimpress.io%2Fv3%2Fcompose%3FsceneUrl%3Dhttps%253a%252f%252fassets.documents.cimpress.io%252fv3%252fassets%252f1ed3bb4e-a352-4930-8c11-21ce3c2d9557%252fcontent%26compositionOperations%3DhU89T8MwEP0ryHMcx0ka213p0C4gVTAhBn9c2og4Z2ynCCH%252bOy7qitju3rt7Hy9fBANEnSdcnj4DkC2vCMzgYckP2pedPB7v94ddHZYTqYhOCfJznAt%252bzjmkLWO%252fUKod2vX6lWo7%252bRAhpXpCdmmZh2jPuhAsRPSYp%252fcVaBkds%252bgDpunqnVhnpIBukFTwxtF%252bMxqqpR5p18jeupEr1cqbFxOj6tygORWaS9qDUdRA66hQAlroh81gVAlrtH07RVwXdwSPl1Jm1HOC7%252br%252f0rtbmztOP6IO5broeXSFa%252f4Wfv0B"
                    }
                    thumbnail={
                      "https://rendering.mcp.cimpress.com/v2/vp/preview?height=500&width=500&instructions_uri=https%3A%2F%2Finstructions.documents.cimpress.io%2Fv3%2Finstructions%3Apreview%3FdocumentUri%3Dhttps%253A%252F%252Fartworkgeneration.cimpress.io%252Fapi%252Fv3%252Fcomposition%253Agenerate%253Fassets%253D%25257B%252522images%252522%25253A%25255B%25257B%252522printUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252Fprint%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522previewUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252FwebPreview%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522originalSourceUrl%252522%25253A%252522https%25253A%25252F%25252Fapi.sherbert.cimpress.io%25252Fv3%25252Fassets%25252FMSo8c7VOvmhB7YTamRE9o%7E400%25252Foriginal%25253Fsignature%25253De80cabee107fbc04e9a2731022451ec87c6ed3c3%252522%25252C%252522width%252522%25253A400%25252C%252522height%252522%25253A343%25252C%252522cropFractions%252522%25253A%25257B%252522top%252522%25253A0%25252C%252522left%252522%25253A0%25252C%252522bottom%252522%25253A0%25252C%252522right%252522%25253A0%25257D%25252C%252522purpose%252522%25253A%252522logo%252522%25257D%25255D%25257D%2526surfaceSpecificationUrl%253Dhttps%25253A%25252F%25252Fdesign-specifications.docext.cimpress.io%25252Fv2%25252FdesignViews%25252Fproducts%25252FPRD-50WYSA3XP%25252F9%25253FoptionSelections%25255BSubstrate%252520Color%25255D%25253D%252523000000%252526optionSelections%25255BSize%25255D%25253D2XL%252526optionSelections%25255BDecoration%252520Technology%25255D%25253DScreen%252520Printing%252526optionSelections%25255BDeco%252520Area%25255D%25253DFull%252520Front%252526optionSelections%25255BBackside%25255D%25253DBlank%252526culture%25253Den-AU%252526requester%25253Dproduct-discovery-page%2526panels%253Dfirst%2526apiKey%253DTqptbhrUm4RFk7nvgzuQGywEMVcKfNP93HX%26ignoreProjection%3Dtrue&scene=https%3A%2F%2Fassets.documents.cimpress.io%2Fv3%2Fcompose%3FsceneUrl%3Dhttps%253a%252f%252fassets.documents.cimpress.io%252fv3%252fassets%252f1ed3bb4e-a352-4930-8c11-21ce3c2d9557%252fcontent%26compositionOperations%3DhU89T8MwEP0ryHMcx0ka213p0C4gVTAhBn9c2og4Z2ynCCH%252bOy7qitju3rt7Hy9fBANEnSdcnj4DkC2vCMzgYckP2pedPB7v94ddHZYTqYhOCfJznAt%252bzjmkLWO%252fUKod2vX6lWo7%252bRAhpXpCdmmZh2jPuhAsRPSYp%252fcVaBkds%252bgDpunqnVhnpIBukFTwxtF%252bMxqqpR5p18jeupEr1cqbFxOj6tygORWaS9qDUdRA66hQAlroh81gVAlrtH07RVwXdwSPl1Jm1HOC7%252br%252f0rtbmztOP6IO5broeXSFa%252f4Wfv0B"
                    }
                    name={"2025 SPORTSHUB HOODIE"}
                    organiser={upcomingOrganiserEvents[1].organiser}
                    startTime={upcomingOrganiserEvents[1].startDate}
                    location={upcomingOrganiserEvents[1].location}
                    price={upcomingOrganiserEvents[1].price}
                    vacancy={upcomingOrganiserEvents[1].vacancy}
                  />
                </div>
              </div>
            </div>

            <div className="hidden sm:block pl-2">
              <ChevronRightButton handleClick={scrollRight} />
            </div>
          </div>
        ) : (
          <p className="font-thin">No upcoming events by this organiser.</p>
        )}
      </div>
    </div>
  );
}
