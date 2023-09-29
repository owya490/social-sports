export default function EventDetails({ params }: any) {
    return (
        <div className="h-screen bg-white text-black">
            <h1>yoohoo {params.id}</h1>
            <h2>
                <div className="grid grid-rows-2 gap-10 grid-cols-9">
                    <div className="row-start-1 col-start-2 col-span-4 border border-1">
                        <img
                            src="https://imageio.forbes.com/specials-images/imageserve/5d35eacaf1176b0008974b54/0x0.jpg?format=jpg&crop=4560,2565,x790,y784,safe&width=1200"
                            className="object-cover w-full h-full"
                            alt="..."
                        />
                    </div>
                    <div className="row-start-2 col-start-2 col-span-4 border border-1"></div>
                    <div className="row-start-1 row-span-2 col-start-7 col-span-2 border border-1 text-2xl text-center space-y-10">
                        <p>Event Details</p>
                        <div className="flex items-center space-x-5">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTENdUa5gQQRf-NNiyGG-_Exz1ufAe31q2faQ&usqp=CAU"
                                alt="Event Image"
                                className="your-image-classes w-4 h-4 ml-8"
                            />
                            <p className="text-sm">Saturday, 23 Sunday, 2023</p>
                        </div>

                        <div className="flex items-center space-x-5">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTENdUa5gQQRf-NNiyGG-_Exz1ufAe31q2faQ&usqp=CAU"
                                alt="Event Image"
                                className="your-image-classes w-4 h-4 ml-8"
                            />
                            <p className="text-sm">Saturday, 23 Sunday, 2023</p>
                        </div>
                        <div className="flex items-center space-x-5">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTENdUa5gQQRf-NNiyGG-_Exz1ufAe31q2faQ&usqp=CAU"
                                alt="Event Image"
                                className="your-image-classes w-4 h-4 ml-8"
                            />
                            <p className="text-sm">Saturday, 23 Sunday, 2023</p>
                        </div>
                        <div className="flex items-center space-x-5">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTENdUa5gQQRf-NNiyGG-_Exz1ufAe31q2faQ&usqp=CAU"
                                alt="Event Image"
                                className="your-image-classes w-4 h-4 ml-8"
                            />
                            <p className="text-sm">Saturday, 23 Sunday, 2023</p>
                        </div>
                        <div className="rounded bg-gray-300 p-4">
                            GUESTS
                            <p>1 guest(s)</p>
                        </div>
                        <div>$30 x 1 guest(s) $30</div>
                    </div>
                </div>
            </h2>
        </div>
    );
}
