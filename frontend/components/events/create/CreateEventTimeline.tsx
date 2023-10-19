import React from "react";

export function CreateEventTimeline() {
    return (
        <div className="mt-20">
            <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                <li className="flex md:w-full items-center text-blue-600 dark:text-blue-500 sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span className="flex items-center justify-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white">
                        1
                    </span>
                    Personal{" "}
                    <span className="hidden sm:inline-flex sm:ml-2">Info</span>
                </li>
                <li className="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span className="flex items-center justify-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white">
                        2
                    </span>
                    Account{" "}
                    <span className="hidden sm:inline-flex sm:ml-2">Info</span>
                </li>
                <li className="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span className="flex items-center justify-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white">
                        3
                    </span>
                    Account{" "}
                    <span className="hidden sm:inline-flex sm:ml-2">Info</span>
                </li>
                <li className="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span className="flex items-center justify-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white">
                        4
                    </span>
                    Account{" "}
                    <span className="hidden sm:inline-flex sm:ml-2">Info</span>
                </li>
            </ol>
        </div>
    );
}
