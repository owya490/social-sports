import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";

const loggedin = true;
const firstName = "Owen";
const lastName = "Yang";
const truncatedLastName = lastName ? lastName.slice(0, 1) : "";
const location = "Sydney, Australia";
const phoneNumber = "0468368618";
const email = "owya490@gmail.com";
const birthday = "23/07/2002";
const age = 21;
const password = "danielinthesky";

export default function Profile() {
  return (
    <div className="mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      <div
        className="col-start-1 col-span-1 lg:col-span-2 border border-gray-500 w-[250px]"
        style={{ borderRadius: "20px" }}
      >
        <div className="grid justify-center mt-5">
          <Image
            src={DP}
            alt="DP"
            width={160}
            height={160}
            className="relative inline-block h-150 w-150 rounded-full object-cover object-center border border-black overflow-hidden"
          />
        </div>
        <div className="flex justify-center mt-5 text-2xl font-semibold">
          {firstName} {truncatedLastName} , {age}
        </div>
        <div className="flex justify-center mt-3 mb-5 text-lg ">{location}</div>
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 mt-5 lg:mt-0">
        <div className="flex justify-center lg:justify-start text-3xl lg:text-4xl font-semibold lg:my-3">
          Profile Details
        </div>
        <div className="flex justify-center lg:justify-start text-lg mt-5">
          <ul>
            <li>
              <strong>Name:</strong> {firstName} {lastName}
            </li>
            <li>
              <strong>Email:</strong> {email}
            </li>
            <li>
              <strong>Phone Number:</strong> {phoneNumber}
            </li>
            <li>
              <strong>Location:</strong> {location}
            </li>
            <li>
              <strong>Date of Birth:</strong> {birthday}
            </li>
            {/* <li>
              <strong>Password:</strong> {password}
            </li> */}
          </ul>
        </div>
        <div className="flex justify-center lg:justify-start my-7">
          <button
            type="button"
            className=" text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
