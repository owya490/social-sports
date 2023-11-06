import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";

const loggedin = true;
const firstName = "Owen";
const lastName = "Yang";
const truncatedLastName = lastName ? lastName.slice(0, 1) : "";
const location = "Sydney, Australia";
const phoneNumber = "0468368618";
const email = "owya490@gmail.com";
const birthday = "23rd July 2002";
const age = 21;
const password = "danielinthesky";

export default function Profile() {
  return (
    <div className="mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-3 gap-x-[10vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      <div
        className="col-start-1 col-span-1 lg:row-span-2 border border-gray-500 max-w-[300px] min-w-[150px] row align-items-center"
        style={{ borderRadius: "20px" }}
      >
        <div className="flex justify-center mt-5 h-fit">
          <div className="rounded-full border border-black overflow-hidden w-100 h-100">
            <Image src={DP} alt="DP" width={100} height={100} />
          </div>
        </div>
        <div className="flex justify-center mt-5 text-2xl font-semibold">
          {firstName} {truncatedLastName} , {age}
        </div>
        <div className="flex justify-center mt-3 mb-5 text-lg ">{location}</div>
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-2 lg:col-span-2 h-[30px] mt-5 lg:mt-0">
        <div className="flex justify-center">
          <p className="text-2xl lg:text-3xl">Account Details</p>
        </div>
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-2 lg:col-span-2 ">
        <div className="text-lg flex justify-center">
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
            <li>
              <strong>Password:</strong> {password}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
