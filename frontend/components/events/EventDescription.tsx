interface IEventDescription {
    title: string;
    description: string[];
}

export default function EventDescription(props: IEventDescription) {
    return (
        <>
            <div className="text-2xl lg:text-3xl 2xl:text-4xl ml-6 mt-7 mr-6">
                <h1>{props.title}</h1>
            </div>
            <div className="space-y-3.5 text-md lg:text-lg 2xl:text-xl ml-3 mr-3 mt-6 mb-10">
                {props.description.map((description, idx) => {
                    return <p key={idx}>{description}</p>;
                })}
            </div>
        </>
    );
}
