import EventBanner from "@components/events/EventBanner";
import RecommendedEvents from "@components/events/RecommendedEvents";

export default function Event() {
    return (
        <>
            <EventBanner />
            <div className="md:mx-36 mt-10">
                {/* <div className="flex space-x-14">
                    <div className="w-full space-y-5">
                        <Image
                            src={STV}
                            alt="stv"
                            className="w-full h-[60vh] object-cover rounded-lg"
                        />
                        <h1 className="text-3xl font-extrabold">
                            Sydney Thunder Volleyball Men's Training
                        </h1>
                        <p>
                            Lorem ipsum dolor sit amet consectetur, adipisicing
                            elit. Repellat omnis nihil a architecto doloremque
                            magnam. Labore tempore enim hic ad reiciendis
                            ratione, quasi iure dignissimos maxime voluptates,
                            nam facere esse. Lorem ipsum dolor sit amet
                            consectetur adipisicing elit. Similique soluta id,
                            at voluptas, corporis obcaecati suscipit aperiam
                            dolorem dignissimos eius facere recusandae
                            consectetur sit ut adipisci atque.
                        </p>
                        <p>
                            Perspiciatis, doloribus dolor! Lorem ipsum dolor sit
                            amet consectetur, adipisicing elit. Velit cumque
                            esse placeat quia recusandae excepturi quo unde
                            repellendus vel quos aperiam eveniet animi deleniti
                            adipisci debitis totam accusamus, molestias fuga!
                            Lorem, ipsum dolor sit amet consectetur adipisicing
                            elit. Obcaecati aliquid sunt culpa, cum, rerum
                            dolore quas ipsam nobis quos reiciendis hic
                            provident dignissimos placeat officiis quidem facere
                            harum doloribus tenetur!
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl h-[80vh] drop-shadow-lg min-w-[30vw] xl:min-w-[25vw] 2xl:min-w-[20vw]">
                        Side
                    </div>
                </div> */}
                <div className="mx-5">
                    <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
                    <div className="flex my-5">
                        <h5 className="font-bold text-lg">
                            Similar events nearby
                        </h5>
                        <a className="text-sm font-light ml-auto cursor-pointer">
                            See all
                        </a>
                    </div>
                    <div className="flex space-x-5">
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                    </div>
                </div>
            </div>
        </>
    );
}
