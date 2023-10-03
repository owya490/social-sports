export default function EventDetails({ params }: any) {
  return (
    <div className="h-screen bg-white text-black">
      <h2>
        <div className="grid 2xl:grid-cols-6 3xl:grid-cols-5 mx-[12vw] gap-[7vw]">
          <div className="col-start-1 col-span-4">
            <img
              src="https://scontent.fsyd12-1.fna.fbcdn.net/v/t39.30808-6/382212432_10211670144306980_1350597476851969910_n.jpg?stp=dst-jpg_s2048x2048&_nc_cat=105&ccb=1-7&_nc_sid=934829&_nc_ohc=tO_myhWlB0IAX_uP997&_nc_ht=scontent.fsyd12-1.fna&oh=00_AfBM_X3TpYtoNzE3qHApfwLViLHgUdVOvCCjuKVRhpmA9Q&oe=651DC064"
              className="object-cover w-full h-3/5 rounded-3xl"
              alt="..."
            />
            <div className="text-3xl indent-3 ml-3 mt-7">
              <p>Sydney Thunder Volleyball Women's Training</p>
            </div>
            <div className="space-y-3.5 text-lg ml-3 mr-3 mt-6">
              <p>
                Women’s sessions are for female players who are looking to
                increase their skill and will be focused solely on training and
                building game experience.
              </p>
              <p>
                This training session is for women playing at an intermediate to
                advanced level and is really focused on perfecting your game!
                (If you can serve 70% in and receive to a setter with confidence
                this session is for you)!
              </p>
              <p>
                These sessions are built to representative level volleyball.
                This session is focused for women in the Sydney Thunder
                Volleyball Women’s Representative Team however all women at an
                advanced level are welcome to join. This session will have STV’s
                Head Coach Lead the session and will be focused on improving
                skills as an individual and as a team.
              </p>
              <p>Limited spots are available!</p>
            </div>
            <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
              <button>Volleyball</button>
            </div>
            <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
              <button>Women's Volleyball</button>
            </div>
            <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
              <button>Sydney Thunder Volleyball</button>
            </div>
            <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
              <button>Advanced</button>
            </div>
          </div>
          <div className="h-fit col-start-5 col-span-2 border border-1 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)]">
            <p
              className="font-semibold text-4xl text-center mb-10 ml-3 mr-3"
              style={{ marginTop: "45px" }}
            >
              Event Details
            </p>
            <div className="flex justify-start">
              <div className="w-fit ">
                <div className="flex items-center mb-5 ml-[9.5%]">
                  <img
                    src="https://static.vecteezy.com/system/resources/previews/005/988/959/non_2x/calendar-icon-free-vector.jpg"
                    alt="Event Image"
                    className="your-image-classes w-12 h-12 mr-2"
                  />
                  <p className="text-lg">Saturday, 23 September, 2023</p>
                </div>
                <div className="flex items-center mb-5 ml-[9.5%]">
                  <img
                    src="https://t3.ftcdn.net/jpg/05/29/73/96/360_F_529739662_yRW6APsQg3PaJGQ6afQL8hDdod0OR1re.jpg"
                    alt="Event Image"
                    className="your-image-classes w-12 h-12 mr-2"
                  />
                  <p className="text-lg">8:00 - 10:00 pm AEST</p>
                </div>
                <div className="flex items-center mb-5 ml-[9.5%]">
                  <img
                    src="https://previews.123rf.com/images/giamportone/giamportone1802/giamportone180200009/95977351-map-pin-icon-location-symbol-outline-vector-illustration.jpg"
                    alt="Event Image"
                    className="your-image-classes w-12 h-12 mr-2"
                  />
                  <p className="text-lg">North Ryde RSL, NSW</p>
                </div>
                <div className="flex items-center ml-[9.5%]">
                  <img
                    src="https://thumbs.dreamstime.com/b/dollar-sign-dollar-sign-icon-dollar-sign-dollar-sign-icon-vector-illustration-graphic-web-design-170432064.jpg"
                    alt="Event Image"
                    className="your-image-classes w-12 h-12 mr-2"
                  />
                  <p className="text-lg">$30.00 AUD per person</p>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div
                className="text-lg rounded-3xl bg-white p-4 border-[1px] border-black mt-10 w-4/5 h-1/15"
                style={{
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
              <span className="ml-[10%] mt-12">$30 x 1 guest(s)</span>
              <span className="mr-[10%] mt-12">$30</span>
            </div>
            <div className="px-[10%]">
              <hr className="px-2 h-0.5 mx-auto my-4 bg-gray-400 border-0 rounded md:my-10 dark:bg-gray-400"></hr>
            </div>
            <div className="text-2xl flex justify-between">
              <span className="ml-[10%] mt-2">Total</span>
              <span className="mr-[10%] mt-2">$30</span>
            </div>
            <div className="relative flex justify-center mt-10">
              <div
                className="text-2xl text-white rounded-3xl bg-sky-500/75 p-3 w-4/5 h-1/18 mb-[10%]"
                style={{
                  textAlign: "center",
                  position: "relative",
                }}
              >
                Book now
              </div>
            </div>
          </div>
        </div>
      </h2>
    </div>
  );
}
