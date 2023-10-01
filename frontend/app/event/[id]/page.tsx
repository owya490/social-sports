export default function EventDetails({ params }: any) {
  return (
    <div className="h-screen bg-white text-black">
      <h1>yoohoo {params.id}</h1>
      <h2>
        <div className="grid grid-rows-2 gap-10 grid-cols-9">
          <div className="row-start-1 col-start-2 col-span-4 border border-1">
            <img
              src="https://imageio.forbes.com/specials-images/imageserve/5d35eacaf1176b0008974b54/0x0.jpg?format=jpg&crop=4560,2565,x790,y784,safe&width=1200"
              className="object-cover w-full h-full"
              alt="Event"
            />
          </div>
          <div className="row-start-2 col-start-2 col-span-4 border border-1"></div>
          <div className="row-start-1 row-span-2 col-start-7 col-span-2 border border-1 text-2xl text-center space-y-10">
            <p className="font-semibold text-3xl" style={{ marginTop: "40px" }}>
              Event Details
            </p>

            <div className="flex items-center">
              <img
                src="https://static.vecteezy.com/system/resources/previews/005/988/959/non_2x/calendar-icon-free-vector.jpg"
                alt="Event Image"
                className="your-image-classes w-12 h-12 ml-8"
              />
              <p className="text-lg ml-4">Saturday, 23 September, 2023</p>
            </div>

            <div className="flex items-center">
              <img
                src="https://t3.ftcdn.net/jpg/05/29/73/96/360_F_529739662_yRW6APsQg3PaJGQ6afQL8hDdod0OR1re.jpg"
                alt="Event Image"
                className="your-image-classes w-12 h-12 ml-8"
              />
              <p className="text-lg ml-4">8:00 - 10:00 pm AEST</p>
            </div>

            <div className="flex items-center">
              <img
                src="https://previews.123rf.com/images/giamportone/giamportone1802/giamportone180200009/95977351-map-pin-icon-location-symbol-outline-vector-illustration.jpg"
                alt="Event Image"
                className="your-image-classes w-12 h-12 ml-8"
              />
              <p className="text-lg ml-4">North Ryde RSL, NSW</p>
            </div>

            <div className="flex items-center">
              <img
                src="https://thumbs.dreamstime.com/b/dollar-sign-dollar-sign-icon-dollar-sign-dollar-sign-icon-vector-illustration-graphic-web-design-170432064.jpg"
                alt="Event Image"
                className="your-image-classes w-12 h-12 ml-8"
              />
              <p className="text-lg ml-4">$30.00 AUD per person</p>
            </div>
            <div className="relative flex justify-center">
              <div
                className="text-lg rounded-3xl bg-white p-4 border-2 border-black"
                style={{
                  width: "350px",
                  height: "90px",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                GUESTS
                <br />
                <p className="text-lg">1 guest(s)</p>
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
            </div>

            <div className="text-lg flex justify-between">
              <span className="ml-12">$30 x 1 guest(s)</span>
              <span className="mr-12">$30</span>
            </div>

            <hr className="w-80 h-0.5 mx-auto my-4 bg-gray-400 border-0 rounded md:my-10 dark:bg-gray-400"></hr>
            <div className="text-1xl flex justify-between">
              <span className="ml-12">Total</span>
              <span className="mr-12">$30</span>
            </div>
            <div className="relative flex justify-center">
              <div
                className="text-xl text-white rounded-3xl bg-sky-500/75 p-4"
                style={{
                  width: "320px",
                  height: "65px",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                Book now
                <br />
              </div>
            </div>
          </div>
        </div>
      </h2>
    </div>
  );
}
