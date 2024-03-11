import Link from "next/link";
import { FormWrapper } from "../events/create/FormWrapper";

type BasicData = {
  email: string;
  password: string;
  repeatPassword: string;
  passwordMismatch: boolean;
  mobile: string;
  dob: string;
  location: string;
  gender: string;
  sport: string;
};

type BasicInformationProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function BasicRegisterInformation({
  email,
  password,
  repeatPassword,
  passwordMismatch,
  mobile,
  dob,
  location,
  gender,
  sport,
  updateField,
}: BasicInformationProps) {
  return (
    <FormWrapper>
      <div className=" w-full sm:max-w-2xl sm:flex gap-x-12 flex-none">
        <div className="sm:w-1/2 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                value={email}
                onChange={(e) => updateField({ email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Password (min. 6 characters)
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 ${
                  passwordMismatch ? "ring-red-400" : ""
                }`}
                required
                pattern=".{6,}"
                value={password}
                onChange={(e) => updateField({ password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-repeat"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Repeat Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password-repeat"
                name="password"
                type="password"
                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6 ${
                  passwordMismatch ? "ring-red-400" : ""
                }`}
                required
                value={repeatPassword}
                onChange={(e) =>
                  updateField({ repeatPassword: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Gender
              </label>
              <div className="mt-2">
                <select
                  id="gender"
                  name="gender"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                  value={gender}
                  required
                  onChange={(e) => updateField({ gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="sm:w-1/2 space-y-6">
          <div>
            <label
              htmlFor="mobile"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Mobile
            </label>
            <div className="mt-2">
              <input
                id="mobile"
                name="mobile"
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                value={mobile}
                required
                onChange={(e) => updateField({ mobile: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dob"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Birthday
            </label>
            <div className="mt-2">
              <input
                id="dob"
                name="dob"
                type="date"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                value={dob}
                required
                onChange={(e) => updateField({ dob: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Location
            </label>
            <div className="mt-2">
              <input
                id="location"
                name="location"
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                value={location}
                required
                onChange={(e) => updateField({ location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div>
              <label
                htmlFor="sport"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Sport
              </label>
              <div className="mt-2">
                <select
                  id="sport"
                  name="sport"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                  value={sport}
                  required
                  onChange={(e) => updateField({ sport: e.target.value })}
                >
                  <option value="volleyball">Volleyball</option>
                  <option value="badminton">Badminton</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormWrapper>
  );
}
