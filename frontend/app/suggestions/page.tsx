import Logo from "@/components/navbar/Logo";
import LightBulbIcon from "@/svgs/LightBulbIcon";

export default function Suggestions() {
  return (
    <div className=" w-screen h-screen flex justify-center items-center bg-white">
      <div className="max-w-lg space-y-5">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div
          className="px-7 py-3 leading-normal bg-blue-100 rounded-lg text-center"
          role="alert"
        >
          <span className="flex items-center">
            <LightBulbIcon />
            <h3 className="font-bold text-xl">
              We Value your Suggestions and Feedback.
            </h3>
          </span>

          <div className="flex justify-center">
            <p className="w-3/4">
              We appreciate you taking the time to share your thoughts. Please
              input your Feedback/ Suggestion in the box below.
            </p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 w-full">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                First Name
              </label>
              <input className="border border-black px-2 py-1 rounded-lg w-full"></input>
            </div>
            <div className="col-span-1 w-full">
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Last Name
              </label>
              <input className="border border-black px-2 py-1 rounded-lg w-full"></input>
            </div>
          </div>
          <div className="w-full">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Email
            </label>
            <input className="border border-black px-2 py-1 rounded-lg w-full"></input>
          </div>
          <div className="w-full">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Suggestion/ Feedback
            </label>
            <textarea
              rows={5}
              wrap="hard"
              maxLength={200}
              className="border border-black px-2 py-1 rounded-lg w-full h-32 max-h-44 min-h-[100px]"
            ></textarea>
          </div>
        </div>
        <button className="w-full bg-[#30ADFF] py-2 text-white text-xl rounded-lg">
          Submit
        </button>
      </div>
    </div>
  );
}
