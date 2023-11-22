"use client";
import React, { useState } from "react";
import Button from "@/components/Button";
import { CreateEventTimeline} from "/Users/richardpeng/VS Code/social-sports/frontend/components/events/create/CreateEventTimeline";

export default function CreateEvent() {
    return (
        <div style={{ marginTop: "50px" }}>
            <CreateEventTimeline />
            {/* Add your content here for each stage if needed */}
        </div>
    );
}
