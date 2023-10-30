"use client";
import React, { useState } from "react";
import { handleSignUp } from "@/services/authService";

export default function Register() {
    const [userData, setUserData] = useState({
        email: "",
        password: "",
        firstName: "",
    });
    const [repeatPassword, setRepeatPassword] = useState("");
    const [passwordMismatch, setPasswordMismatch] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (userData.password !== repeatPassword) {
            setPasswordMismatch(true);
            return;
        }

        try {
            handleSignUp(userData);
        } catch (error) {
            console.error("An error occurred:", error);
            // Handle errors related to the fetch request.
        }
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                {passwordMismatch && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                        role="alert"
                    >
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline">
                            {" "}
                            Passwords do not match.
                        </span>
                        <span
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                            onClick={() => setPasswordMismatch(false)}
                        >
                            <svg
                                className="fill-current h-6 w-6 text-red-500"
                                role="button"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                            </svg>
                        </span>
                    </div>
                )}
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Register your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6 group" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="first-name"
                            className="block text-sm font-medium leading-6 text-gray-900"
                        >
                            First Name
                        </label>
                        <div className="mt-2">
                            <input
                                id="first-name"
                                name="first-name"
                                type="text"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
                                value={userData.firstName}
                                required
                                onChange={(e) =>
                                    setUserData({
                                        ...userData,
                                        firstName: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
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
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
                                value={userData.email}
                                onChange={(e) =>
                                    setUserData({
                                        ...userData,
                                        email: e.target.value,
                                    })
                                }
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
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
                                required
                                pattern=".{6,}"
                                value={userData.password}
                                onChange={(e) =>
                                    setUserData({
                                        ...userData,
                                        password: e.target.value,
                                    })
                                }
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
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#30ADFF] sm:text-sm sm:leading-6"
                                required
                                pattern=".{6,}"
                                onChange={(e) =>
                                    setRepeatPassword(e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-[#30ADFF] px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 group-invalid:pointer-events-none group-invalid:opacity-30"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
