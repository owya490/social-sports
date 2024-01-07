import EventDescription from "@/components/events/EventDescription";
import EventImage from "@/components/events/EventImage";
import { EventData } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { TagGroup } from "../TagGroup";
import MobileEventPayment from "../mobile/MobileEventPayment";
import EventPayment from "./EventPayment";

interface IEventDetails {
  eventData: EventData;
  eventTags: Tag[];
}

export function EventDetails(props: IEventDetails) {
  // const title = "Sydney Thunder Volleyball Women's Training";
  // const description = [
  //     "Women’s sessions are for female players who are looking to increase their skill and will be focused solely on training and building game experience.",
  //     "This training session is for women playing at an intermediate to advanced level and is really focused on perfecting your game! (If you can serve 70% in and receive to a setter with confidence this session is for you)!",
  //     "These sessions are built to representative level volleyball. This session is focused for women in the Sydney Thunder Volleyball Women’s Representative Team however all women at an advanced level are welcome to join. This session will have STV’s Head Coach Lead the session and will be focused on improving skills as an individual and as a team.",
  //     "Limited spots are available!",
  // ];
  const { eventData } = props;
  return (
    <div className="flex justify-center w-full">
      <div className="pb-10 w-[400px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
        <EventImage imageSrc={eventData.image} />
        <div className="lg:flex w-full mt-5">
          <div className="lg:hidden">
            <MobileEventPayment
              date={eventData.startDate}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
            />
          </div>

          <div className="mx-2 lg:w-2/3 xl:w-3/4">
            <EventDescription
              title={eventData.name}
              description={[eventData.description]} // TODO make firebase take string
            />
            <div className="flex">
              <div className="hidden lg:block">
                <TagGroup tags={props.eventTags} />
              </div>
            </div>
          </div>
          <div className="hidden lg:block lg:w-1/3 xl:w-1/4">
            <EventPayment
              date={eventData.startDate}
              location={eventData.location}
              price={eventData.price}
              vacancy={eventData.vacancy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
