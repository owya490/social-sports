import React from "react";

export function CreateEventTimeline() {
    return (
        <div className="mt-20 relative">
            <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                <li className="flex md:w-full items-center flex-col relative">
                    <span className="flex items-center justify-center border border-black after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-blue-600 dark:bg-blue-500 text-black">
                        1
                    </span>
                    <span className="text-black">Basic Information</span>
                    
                </li>
                <li className="flex md:w-full items-center flex-col relative">
                    <span className="flex items-center justify-center border border-black after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-gray-300 dark:bg-gray-400 text-black">
                        2
                    </span>
                    <span className="text-black">Relevant Tags</span>
                    
                </li>
                <li className="flex md:w-full items-center flex-col relative">
                    <span className="flex items-center justify-center border border-black after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-gray-300 dark:bg-gray-400 text-black">
                        3
                    </span>
                    <span className="text-black">Description and Image</span>
                    
                </li>
                <li className="flex md:w-full items-center flex-col">
                    <span className="flex items-center justify-center border border-black after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 bg-gray-300 dark:bg-gray-400 text-black">
                        4
                    </span>
                    <span className="text-black">Create the Event</span>
                </li>
            </ol>
        </div>
    );
}
