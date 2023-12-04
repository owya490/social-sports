"use client";
import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";
import React, { useState } from "react";

// const initialProfileData = {
//   firstName: "Owen",
//   lastName: "Yang",
//   location: "Sydney, Australia",
//   phoneNumber: "0468368618",
//   email: "owya490@gmail.com",
//   birthday: "23/07/2002",
//   age: 21,
//   password: "danielinthesky",
// };

// const Profile = () => {
//   const [editable, setEditable] = useState(false);
//   const [editedData, setEditedData] = useState({ ...initialProfileData });

//   const handleEditClick = () => {
//     setEditable(!editable);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setEditedData((prevData) => ({ ...prevData, [name]: value }));
//   };

// const handleSaveClick = () => {
//   // Implement functionality 
//   console.log("Saving changes:", editedData);
//   setEditable(false);
// };


//   const renderField = (label, name, type = "text") => {
//     if (editable) {
//       return (
//         <li key={name}>
//           <strong>{label}:</strong>{" "}
//           <input
//             type={type}
//             name={name}
//             value={editedData[name]}
//             onChange={handleInputChange}
//           />
//         </li>
//       );
//     } else {
//       return (
//         <li key={name}>
//           <strong>{label}:</strong> {editedData[name]}
//         </li>
//       );
//     }
//   };

//   return (
//     <div className="mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
//       <div
//         className="col-start-1 col-span-1 lg:col-span-2 border border-gray-500 w-[250px]"
//         style={{ borderRadius: "20px" }}
//       >
//         <div className="grid justify-center mt-5">
//           <Image
//             src={DP}
//             alt="DP"
//             width={160}
//             height={160}
//             className="relative inline-block h-150 w-150 rounded-full object-cover object-center border border-black overflow-hidden"
//           />
//         </div>
//         <div className="flex justify-center mt-5 text-2xl font-semibold">
//           {editedData.firstName} {editedData.lastName?.slice(0, 1)} ,{" "}
//           {editedData.age}
//         </div>
//         <div className="flex justify-center mt-3 mb-5 text-lg ">
//           {editedData.location}
//         </div>
//       </div>
//       <div className="col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 mt-5 lg:mt-0">
//         <div className="flex justify-center lg:justify-start text-3xl lg:text-4xl font-semibold lg:my-3">
//           Profile Details
//         </div>
//         <div className="flex justify-center lg:justify-start text-lg mt-5">
//           <ul>
//             {renderField("Given Name", "firstName")}
//             {renderField("Surname", "lastName")}
//             {renderField("Email", "email", "email")}
//             {renderField("Phone Number", "phoneNumber", "tel")}
//             {renderField("Location", "location")}
//             {renderField("Date of Birth", "birthday", "date")}
//             {renderField("Password", "password", "password")}
//           </ul>
//         </div>
//         <div className="flex justify-center lg:justify-start my-7">
//           {editable ? (
//             <>
//               <button
//                 type="button"
//                 onClick={handleSaveClick}
//                 className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-full text-med px-6 py-2 text-center"
//               >
//                 Save
//               </button>
//               <button
//                 type="button"
//                 onClick={handleEditClick}
//                 className="ml-4 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-med px-6 py-2 text-center"
//               >
//                 Cancel
//               </button>
//             </>
//           ) : (
//             <button
//               type="button"
//               onClick={handleEditClick}
//               className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
//             >
//               Edit
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;



// Define the initial profile data
const initialProfileData = {
  firstName: "Owen",
  lastName: "Yang",
  location: "Sydney, Australia",
  phoneNumber: "0468368618",
  email: "owya490@gmail.com",
  birthday: "23/07/2002",
  age: 21,
  password: "danielinthesky",
};

// Define the Profile component
const Profile = () => {
  // State variables to manage the edit mode and edited data
  const [editable, setEditable] = useState(false);
  const [editedData, setEditedData] = useState({ ...initialProfileData });

  // Event handler for the "Edit" button click
  const handleEditClick = () => {
    setEditable(!editable);
  };

  // Event handler for input changes in the modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Event handler for the "Save" button click
  const handleSaveClick = () => {
    // Implement functionality to save changes
    console.log("Saving changes:", editedData);
    setEditable(false);
  };

  // Render each editable field in the modal
  const renderEditableField = (label, name, type = "text") => (
    <div key={name} className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={editedData[name]}
        onChange={handleInputChange}
        className="mt-1 p-2 border rounded-md w-full"
      />
    </div>
  );

  // Render the modal content
  const renderModalContent = () => (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center backdrop-filter backdrop-blur-sm z-50">
      <div className="bg-white w-96 p-6 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Edit Profile</h2>
        {renderEditableField("Given Name", "firstName")}
        {renderEditableField("Surname", "lastName")}
        {renderEditableField("Email", "email", "email")}
        {renderEditableField("Phone Number", "phoneNumber", "tel")}
        {renderEditableField("Location", "location")}
        {renderEditableField("Date of Birth", "birthday", "date")}
        {renderEditableField("Password", "password", "password")}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleSaveClick}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-full text-med px-6 py-2"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleEditClick}
            className="ml-4 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-full text-med px-6 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mt-[100px] mb-[5%] mx-10 grid grid-cols-1 lg:grid-cols-5 gap-x-[10vw] lg:gap-x-[2vw] gap-y-[5vw] lg:gap-y-[1vw] px-5 lg:px-10">
      {/* Your existing profile content */}
      <div className="col-start-1 col-span-1 lg:col-span-2 border border-gray-500 w-[250px]" style={{ borderRadius: "20px" }}>
        {/* ... (existing content) */}
      </div>
      <div className="col-start-1 col-span-1 lg:col-start-3 lg:col-span-3 mt-5 lg:mt-0">
        {/* ... (existing content) */}
        <div className="flex justify-center lg:justify-start my-7">
          {editable && renderModalContent()}
          {editable ? null : (
            <button
              type="button"
              onClick={handleEditClick}
              className="text-white bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-med px-6 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
