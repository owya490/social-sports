import React, { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
    createEvent,
    getAllEvents,
    updateEvent,
    deleteEvent,
    updateEventByName,
    deleteEventByName,
} from "@/services/eventsService";
import { createUser, getAllUsers } from "@/services/usersService";
import {
    handleSignUp,
    handleGoogleSignIn,
    handleFacebookSignIn,
} from "@/services/authService";

interface EventData {
    eventId?: string;
    startDate?: Date;
    endDate?: Date; // Assuming you want to store the time as a string
    location?: string; // Assuming "address" is a string
    capacity?: number;
    vacancy?: number;
    price?: number;
    registrationDeadline?: Date;
    organiserId?: string;
    name: string;
    description?: string; // Assuming "rich text field" is a string
    image?: string; // Assuming you store the image URL or path as a string
    eventTags?: string[]; // Assuming "list of tags" is an array of strings
    isActive?: boolean;
    attendees?: { email: string }[];
}

interface userData {
    userId?: string;
    firstName: string;
    surname?: string;
    location?: string;
    contactInformation?: {
        mobile: number;
        email: string;
    };
    activeBookings?: [
        {
            eventId: string;
        }
    ];
}

function Test() {
    const [eventName, setEventName] = useState<string>("");
    const [eventNameToUpdate, setEventNameToUpdate] = useState<string>("");
    const [eventNameToChange, setEventNameToChange] = useState<string>("");
    const [eventNameToDelete, setEventNameToDelete] = useState<string>("");
    const [events, setEvents] = useState<EventData[]>([]);
    const [userName, setUserName] = useState<string>("");
    const [users, setUsers] = useState<userData[]>([]);
    const [userAuthData, setUserAuthData] = useState({
        email: "",
        password: "",
        firstName: "",
    });
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEventName(event.target.value);
    };
    const handleAddUser = async () => {
        // Add user logic
        try {
            const userData = {
                firstName: userName, // Replace with the actual user data
            };
            await createUser(userData);
            setUserName(""); // Clear the input field after adding
        } catch (error) {
            console.error(error);
        }
    };
    const handleAddEvent = async () => {
        if (eventName.trim() === "") {
            return; // Prevent adding an empty event name
        }

        try {
            const eventData = { name: eventName };
            await createEvent(eventData);
            setEventName(""); // Clear the input field after adding
        } catch (error) {
            console.error(error);
        }
    };
    const handleUpdateEvent = async () => {
        if (eventNameToUpdate.trim() === "") {
            return; // Prevent updating with an empty eventId
        }

        try {
            const updatedData: Partial<EventData> = { name: eventName };
            await updateEventByName(eventNameToUpdate, {
                name: eventNameToChange,
            });
            setEventNameToUpdate(""); // Clear the input field after updating
            setEventNameToChange("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteEvent = async () => {
        if (eventNameToDelete.trim() === "") {
            return; // Prevent deleting with an empty eventId
        }

        try {
            await deleteEventByName(eventNameToDelete);
            setEventNameToDelete(""); // Clear the input field after deleting
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        // Fetch and set the events when the component mounts
        async function fetchEvents() {
            try {
                const eventsData = await getAllEvents();
                if (eventsData) {
                    setEvents(eventsData);
                }
            } catch (error) {
                console.error(error);
            }
        }

        fetchEvents();
    }, []);

    return (
        <div>
            <h1>This is the /test page</h1>
            <input
                type="text"
                placeholder="Enter event name"
                value={eventName}
                onChange={handleInputChange}
            />
            <button onClick={handleAddEvent}>Add Event</button>

            <h2>Update Event:</h2>
            <input
                type="text"
                placeholder="Enter Event Name to Update"
                value={eventNameToUpdate}
                onChange={(event) => setEventNameToUpdate(event.target.value)}
            />
            <input
                type="text"
                placeholder="Enter New Event Name"
                value={eventNameToChange}
                onChange={(event) => setEventNameToChange(event.target.value)}
            />
            <button onClick={handleUpdateEvent}>Update Event</button>

            <h2>Delete Event:</h2>
            <input
                type="text"
                placeholder="Enter Event ID to Delete"
                value={eventNameToDelete}
                onChange={(event) => setEventNameToDelete(event.target.value)}
            />
            <button onClick={handleDeleteEvent}>Delete Event</button>
            <h2>All Events:</h2>
            <ul>
                {events.map((event, index) => (
                    <li key={index}>{event.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default Test;
