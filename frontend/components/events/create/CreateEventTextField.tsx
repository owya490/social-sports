import { Textarea } from "@material-tailwind/react";

export function TextField() {
    return (
        <div className="flex items-center justify-center w-full">
            <div className="w-96 flex flex-col gap-6">
                <div className="w-full">
                    <Textarea
                        color="gray"
                        label="Name your Event"
                        placeholder="Type something..."
                    />
                </div>
                <div className="w-full">
                    <Textarea
                        color="blue-gray"
                        label="Set the location for your event"
                        placeholder="Type something..."
                    />
                </div>
                <div className="w-full">
                    <Textarea
                        color="red"
                        label="Add custom amount"
                        placeholder="Type something..."
                    />
                </div>
                <div className="w-full">
                    <Textarea
                        color="green"
                        label="Maximum number of people for your event"
                        placeholder="Type something..."
                    />
                </div>
            </div>
        </div>
    );
}
