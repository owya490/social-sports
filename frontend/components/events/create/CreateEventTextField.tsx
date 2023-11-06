import React from "react";
import TextField from "./TextField";

function Page1() {
    return (
        <div>
            <TextField
                label="Name your event"
                placeholder="Sydney Thunder"
            />
        </div>
    );
}

function Page2() {
    return (
        <div>
            <TextField
                label="Title 2"
                placeholder="Enter text 2..."
            />
        </div>
    );
}

export default Page1;
