export default function EventDetails({ params }: any) {
    return (
        <div className="h-screen bg-white text-black">
            <h1>
                yoohoo {params.id}
            </h1>
            <h2>
                <div className="grid grid-rows-2 gap-4 grid-cols-9">
                    <div className="row-start-1 col-start-2 col-span-4">
                        <img 
                        src="https://imageio.forbes.com/specials-images/imageserve/5d35eacaf1176b0008974b54/0x0.jpg?format=jpg&crop=4560,2565,x790,y784,safe&width=1200"
                        className="object-cover w-full h-full rounded-3xl"
                        alt="..." />
                    </div>
                    <div className="row-start-2 col-start-2 col-span-4 border border-1">
                        <p className="text-3xl indent-3 ml-3 mt-1">
                            Sydney Thunder Volleyball Women's Training
                        </p>
                        <p className="text-lg ml-3 mr-3 mt-4">
                            Women’s sessions are for female players who are looking to increase their skill and will be focused solely on training and building game experience. 
                                <br></br><br></br>
                            This training session is for women playing at an intermediate to advanced level and is really focused on perfecting your game! (If you can serve 70% in and receive to a setter with confidence this session is for you)!
                                <br></br><br></br>
                            These sessions are built to representative level volleyball. This session is focused for women in the Sydney Thunder Volleyball Women’s Representative Team however all women at an advanced level are welcome to join. This session will have STV’s Head Coach Lead the session and will be focused on improving skills as an individual and as a team.
                                <br></br><br></br>
                            Limited spots are available!
                        </p>
                        <p className="text-lg ml-3">
                            Hi
                        </p>
                    </div>
                    <div className="row-start-1 row-span-2 col-start-7 col-span-2 border border-1">
                        reggie star this is ur part
                    </div>
                </div>
            </h2>
        </div>
    );
}
