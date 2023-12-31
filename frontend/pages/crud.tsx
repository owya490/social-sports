export default function crud() {
    return <></>;
}
// import React, { useState, useEffect, ChangeEvent } from "react";
// import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// import {
//     createEvent,
//     getAllEvents,
//     updateEvent,
//     deleteEvent,
//     updateEventByName,
//     deleteEventByName,
// } from "@/services/eventsService";
// import { createUser, getAllUsers } from "@/services/usersService";
// import {
//     handleSignUp,
//     handleGoogleSignIn,
//     handleFacebookSignIn,
// } from "@/services/authService";
// import {
//     getEventImageUrls,
//     getUsersImageUrls,
//     uploadUserImage,
// } from "@/services/imageService";

// interface EventData {
//     eventId?: string;
//     startDate?: Date;
//     endDate?: Date; // Assuming you want to store the time as a string
//     location?: string; // Assuming "address" is a string
//     capacity?: number;
//     vacancy?: number;
//     price?: number;
//     registrationDeadline?: Date;
//     organiserId?: string;
//     name: string;
//     description?: string; // Assuming "rich text field" is a string
//     image?: string; // Assuming you store the image URL or path as a string
//     eventTags?: string[]; // Assuming "list of tags" is an array of strings
//     isActive?: boolean;
//     attendees?: { email: string }[];
// }
// interface userData {
//     userId?: string;
//     firstName: string;
//     surname?: string;
//     location?: string;
//     contactInformation?: {
//         mobile: number;
//         email: string;
//     };
//     activeBookings?: [
//         {
//             eventId: string;
//         }
//     ];
// }
// function Test() {
//     const [eventName, setEventName] = useState<string>("");
//     const [eventNameToUpdate, setEventNameToUpdate] = useState<string>("");
//     const [eventNameToChange, setEventNameToChange] = useState<string>("");
//     const [eventNameToDelete, setEventNameToDelete] = useState<string>("");
//     const [events, setEvents] = useState<EventData[]>([]);
//     const [userName, setUserName] = useState<string>("");
//     const [users, setUsers] = useState<userData[]>([]);
//     const [userAuthData, setUserAuthData] = useState({
//         email: "",
//         password: "",
//         firstName: "",
//     });
//     const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setEventName(event.target.value);
//     };
//     const handleAddUser = async () => {
//         // Add user logic
//         try {
//             const userData = {
//                 firstName: userName, // Replace with the actual user data
//             };
//             await createUser(userData);
//             setUserName(""); // Clear the input field after adding
//         } catch (error) {
//             console.error(error);
//         }
//     };
//     const handleAddEvent = async () => {
//         if (eventName.trim() === "") {
//             return; // Prevent adding an empty event name
//         }
//         try {
//             const eventData = { name: eventName };
//             await createEvent(eventData);
//             setEventName(""); // Clear the input field after adding
//         } catch (error) {
//             console.error(error);
//         }
//     };
//     const handleUpdateEvent = async () => {
//         if (eventNameToUpdate.trim() === "") {
//             return; // Prevent updating with an empty eventId
//         }
//         try {
//             const updatedData: Partial<EventData> = { name: eventName };
//             await updateEventByName(eventNameToUpdate, {
//                 name: eventNameToChange,
//             });
//             setEventNameToUpdate(""); // Clear the input field after updating
//             setEventNameToChange("");
//         } catch (error) {
//             console.error(error);
//         }
//     };
//     const handleDeleteEvent = async () => {
//         if (eventNameToDelete.trim() === "") {
//             return; // Prevent deleting with an empty eventId
//         }
//         try {
//             await deleteEventByName(eventNameToDelete);
//             setEventNameToDelete(""); // Clear the input field after deleting
//         } catch (error) {
//             console.error(error);
//         }
//     };
//     const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setUserAuthData({ ...userAuthData, email: e.target.value });
//     };
//     const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setUserAuthData({ ...userAuthData, password: e.target.value });
//     };
//     const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setUserAuthData({ ...userAuthData, firstName: e.target.value });
//     };
//     const handleLogin = async (event: React.FormEvent) => {
//         event.preventDefault();
//         try {
//             console.log(userAuthData);
//             handleSignUp(userAuthData);
//             // Handle successful signup, e.g., show a success message or redirect the user
//             console.log("User signed up successfully!");
//         } catch (error) {
//             // Handle signup errors, e.g., display an error message
//             console.error("Error signing up:", error);
//         }
//     };

//     // State to hold the entered user ID and selected image file
//     const [userId, setUserId] = useState<string>("");
//     const [selectedFile, setSelectedFile] = useState<File | null>(null);

//     // Handle user ID input change
//     const handleUserIdChange = (event: ChangeEvent<HTMLInputElement>) => {
//         setUserId(event.target.value);
//     };

//     // Handle file input change
//     const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (file) {
//             setSelectedFile(file);
//         }
//     };

//     // Handle image upload
//     const handleUpload = async () => {
//         if (selectedFile && userId) {
//             try {
//                 const url = await uploadUserImage(userId, selectedFile);
//                 console.log("Uploaded image URL:", url);
//                 setSelectedFile(null); // Clear the selected file after uploading
//             } catch (error) {
//                 console.error("Error uploading image:", error);
//             }
//         }
//     };

//     useEffect(() => {
//         // Fetch and set the events when the component mounts
//         async function fetchEvents() {
//             try {
//                 const eventsData = await getAllEvents();
//                 const usersData = await getAllUsers();
//                 if (eventsData) {
//                     setEvents(eventsData);
//                 }
//                 if (usersData) {
//                     setUsers(usersData);
//                 }
//             } catch (error) {
//                 console.error(error);
//             }
//         }
//         fetchEvents();
//     }, []);
//     return (
//         <div>
//             <h1>This is the /test page</h1>
//             <input
//                 type="text"
//                 placeholder="Enter event name"
//                 value={eventName}
//                 onChange={handleInputChange}
//             />
//             <button onClick={handleAddEvent}>Add Event</button>
//             <h2>Update Event:</h2>
//             <input
//                 type="text"
//                 placeholder="Enter Event Name to Update"
//                 value={eventNameToUpdate}
//                 onChange={(event) => setEventNameToUpdate(event.target.value)}
//             />
//             <input
//                 type="text"
//                 placeholder="Enter New Event Name"
//                 value={eventNameToChange}
//                 onChange={(event) => setEventNameToChange(event.target.value)}
//             />
//             <button onClick={handleUpdateEvent}>Update Event</button>
//             <h2>Delete Event:</h2>
//             <input
//                 type="text"
//                 placeholder="Enter Event ID to Delete"
//                 value={eventNameToDelete}
//                 onChange={(event) => setEventNameToDelete(event.target.value)}
//             />
//             <button onClick={handleDeleteEvent}>Delete Event</button>
//             <h2>All Events:</h2>
//             <ul>
//                 {events.map((event, index) => (
//                     <li key={index}>{event.name}</li>
//                 ))}
//             </ul>
//             <h2>Add user</h2>
//             <input
//                 type="text"
//                 placeholder="Enter UserName"
//                 value={userName}
//                 onChange={(event) => setUserName(event.target.value)}
//             />
//             <button onClick={handleAddUser}>Add user</button>
//             <div>
//                 <h2>Sign Up</h2>
//                 <form onSubmit={handleLogin}>
//                     <div>
//                         <label>Email:</label>
//                         <input
//                             type="email"
//                             name="email"
//                             value={userAuthData.email}
//                             onChange={handleEmailChange}
//                             required
//                         />
//                     </div>
//                     <div>
//                         <label>Password:</label>
//                         <input
//                             type="password"
//                             name="password"
//                             value={userAuthData.password}
//                             onChange={handlePasswordChange}
//                             required
//                         />
//                     </div>
//                     <div>
//                         <label>First Name:</label>
//                         <input
//                             type="text"
//                             name="firstName"
//                             value={userAuthData.firstName}
//                             onChange={handleFirstNameChange}
//                             required
//                         />
//                     </div>
//                     <button type="submit">Sign Up</button>
//                 </form>
//             </div>
//             <h2>All Users:</h2>
//             <ul>
//                 {users.map((user, index) => (
//                     <li key={index}>{user.firstName}</li>
//                 ))}
//             </ul>
//             <div>
//                 <h2>Google Sign In</h2>
//                 <button onClick={handleGoogleSignIn}>
//                     Sign In with Google
//                 </button>
//             </div>
//             <div>
//                 <h2>Facebook Sign In</h2>
//                 <button onClick={handleFacebookSignIn}>
//                     Sign In with Facebook
//                 </button>
//             </div>
//             <h2>Image Service</h2>
//             <div>
//                 <button
//                     onClick={() => {
//                         console.log(getUsersImageUrls("stv"));
//                     }}
//                 >
//                     {" "}
//                     User Images{" "}
//                 </button>
//                 <button
//                     onClick={() => {
//                         console.log(getEventImageUrls("1"));
//                     }}
//                 >
//                     {" "}
//                     Event Images{" "}
//                 </button>
//                 <input
//                     type="text"
//                     placeholder="Enter user ID"
//                     value={userId}
//                     onChange={handleUserIdChange}
//                 />
//                 <input type="file" onChange={handleFileChange} />
//                 <button onClick={handleUpload}>Upload Image</button>
//             </div>
//         </div>
//     );
// }
// export default Test;
