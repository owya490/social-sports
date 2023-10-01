export default function EventDetails({ params }: any) {
    return (
        <div className="h-screen bg-white text-black">
            <h1>
                yoohoo {params.id}
            </h1>
            <h2>
                <div className="grid grid-rows-2 gap-4 grid-cols-12">
                    <div className="row-start-1 col-start-3 col-span-5">
                        <img 
                        src="https://scontent.fsyd12-1.fna.fbcdn.net/v/t39.30808-6/382212432_10211670144306980_1350597476851969910_n.jpg?stp=dst-jpg_s2048x2048&_nc_cat=105&ccb=1-7&_nc_sid=934829&_nc_ohc=tO_myhWlB0IAX_uP997&_nc_ht=scontent.fsyd12-1.fna&oh=00_AfBM_X3TpYtoNzE3qHApfwLViLHgUdVOvCCjuKVRhpmA9Q&oe=651DC064"
                        className="object-cover w-full h-full rounded-3xl"
                        alt="..." />
                    </div>
                    <div className="row-start-2 col-start-3 col-span-5 border border-0">
                        <div className="text-3xl indent-3 ml-3 mt-3">
                            <p>
                                Sydney Thunder Volleyball Women's Training
                            </p>
                        </div>
                        <div className="space-y-3.5 text-lg ml-3 mr-3 mt-6">
                            <p>
                                Women’s sessions are for female players who are looking to increase their skill and will be focused solely on training and building game experience. 
                            </p>
                            <p>
                                This training session is for women playing at an intermediate to advanced level and is really focused on perfecting your game! (If you can serve 70% in and receive to a setter with confidence this session is for you)!
                            </p>
                            <p>
                                These sessions are built to representative level volleyball. This session is focused for women in the Sydney Thunder Volleyball Women’s Representative Team however all women at an advanced level are welcome to join. This session will have STV’s Head Coach Lead the session and will be focused on improving skills as an individual and as a team.
                            </p>
                            <p>
                                Limited spots are available!
                            </p>
                        </div>
                        <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
                            <button>
                                Volleyball
                            </button>
                        </div>
                        <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
                            <button>
                                Women's Volleyball
                            </button>
                        </div>
                        <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
                            <button>
                                Sydney Thunder Volleyball
                            </button>
                        </div>
                        <div className="button text-lg ml-3 mr-3 mt-8 flex sm:inline-flex justify-center items-center px-4 py-1 bg-blue-300 hover:bg-blue-500 text-black font-semibold text-center rounded-md ">
                            <button>
                                Advanced
                            </button>
                        </div>
                    </div>
                    <div className="row-start-1 row-span-2 col-start-9 col-span-2 border border-1">
                        reggie star this is ur part
                    </div>
                </div>
            </h2>
        </div>
    );
}
