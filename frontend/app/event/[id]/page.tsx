export default function EventDetails({ params }: any) {
    return (
        <div className="h-screen bg-white text-black">
            <h1>
                yoohoo {params.id}
            </h1>
            <h2>
                <div className="grid grid-rows-2 gap-10 grid-cols-9">
                    <div className="row-start-1 col-start-2 col-span-4 border border-1">
                        <img 
                        src="https://imageio.forbes.com/specials-images/imageserve/5d35eacaf1176b0008974b54/0x0.jpg?format=jpg&crop=4560,2565,x790,y784,safe&width=1200"
                        className="object-cover w-full h-full"
                        alt="..." />
                    </div>
                    <div className="row-start-2 col-start-2 col-span-4 border border-1">
                        
                    </div>
                    <div className="row-start-1 row-span-2 col-start-7 col-span-2 border border-1">
                        reggie star this is ur part
                    </div>
                </div>
            </h2>
        </div>
    );
}
