import ListBox from "../ListBox";

interface IEventPayment {
  date: string;
  time: string;
  location: string;
  price: string;
}

export default function EventPayment(props: IEventPayment) {
  return (
    <div className="border border-1 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] bg-white">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl text-center mb-10 lg:mb-8 ml-3 mr-3 mt-9 lg:mt-7 2xl:mt-12 2xl:mb-10">
        Event Details
      </p>
      <div className="flex justify-start">
        <div className="w-full">
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://static.vecteezy.com/system/resources/previews/005/988/959/non_2x/calendar-icon-free-vector.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.date}</p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://t3.ftcdn.net/jpg/05/29/73/96/360_F_529739662_yRW6APsQg3PaJGQ6afQL8hDdod0OR1re.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.time}</p>
          </div>
          <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://previews.123rf.com/images/giamportone/giamportone1802/giamportone180200009/95977351-map-pin-icon-location-symbol-outline-vector-illustration.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">{props.location}</p>
          </div>
          <div className="flex items-center ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
            <img
              src="https://thumbs.dreamstime.com/b/dollar-sign-dollar-sign-icon-dollar-sign-dollar-sign-icon-vector-illustration-graphic-web-design-170432064.jpg"
              alt="Event Image"
              className="your-image-classes w-12 h-12 mr-2"
            />
            <p className="text-md lg:text-lg mr-[5%]">
              {props.price} AUD per person
            </p>
          </div>
        </div>
      </div>

      {/* <div className="relative flex justify-center">
        <div
          className="text-md lg:text-lg rounded-3xl bg-white p-4 border-[1px] border-black mt-10 w-4/5 h-1/15"
          style={{
            textAlign: "left",
            position: "relative",
          }}
        >
          GUESTS
          <br />
          <p className="text-sm lg:text-lg">1 guest(s)</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M9.293 12.293a1 1 0 011.414 0L12 13.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414 1 1 0 011.414 0L12 13.586z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div> */}
      <div className="relative flex justify-center mt-[-5%] mb-[-5%] lg:mt-[-4%]">
          <ListBox />
      </div>

      <div className="text-md lg:text-lg flex justify-between">
        <span className="ml-[10%] ">{props.price} x 1 guest(s)?</span>
        <span className="mr-[10%] ">$30?</span>
      </div>
      <div className="px-[10%]">
        <hr className="px-2 h-0.5 mx-auto my-4 bg-gray-400 border-0 rounded md:my-10 dark:bg-gray-400"></hr>
      </div>
      <div className="text-lg lg:text-2xl flex justify-between">
        <span className="ml-[10%] mt-2">Total</span>
        <span className="mr-[10%] mt-2">$30?</span>
      </div>
      <div className="relative flex justify-center mt-10">
        <div
          className="text-lg lg:text-2xl text-white rounded-3xl bg-sky-500/75 p-3 w-4/5 h-1/18 mb-[10%]"
          style={{
            textAlign: "center",
            position: "relative",
          }}
        >
          Book now
        </div>
      </div>
    </div>
  );
}
