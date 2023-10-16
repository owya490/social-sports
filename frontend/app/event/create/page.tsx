"use client"
import CreateEventTimeline from "@/components/events/create/CreateEventTimeline";
import { useState } from "react";

export default function CreateEvent() { 
    const [hidden1, setHidden1] = useState(true)
  return (
    <div className="pt-20">
      <p>hello</p>
    {hidden1 && 
      <CreateEventTimeline hidden={hidden1}/>
    }
   
      <button onClick={()=> {
        console.log (hidden1)
        setHidden1(!hidden1)
      }}>click me</button>
    </div>
  );
}
