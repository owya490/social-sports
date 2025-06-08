import { TextSection } from "@/interfaces/FormTypes";

// TODO: form text section implementation here
export const TextSectionResponse = ({ textSection }: { textSection: TextSection }) => {
  // return (
  //   // <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
  //   //   <input
  //   //     type="text"
  //   //     value={section.question}
  //   //     placeholder="Enter your question here?"
  //   //     onChange={(e) => {
  //   //       setForm((prevForm) => {
  //   //         const updatedSection = { ...section, question: e.target.value };
  //   //         return {
  //   //           ...prevForm,
  //   //           sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
  //   //         };
  //   //       });
  //   //     }}
  //   //     style={{
  //   //       flex: 1,
  //   //       padding: "10px",
  //   //       width: "100%",
  //   //       border: "1px solid #ccc",
  //   //       borderRadius: "4px",
  //   //     }}
  //   //   />
  //   //   <div
  //   //     style={{
  //   //       display: "flex",
  //   //       justifyContent: "flex-end",
  //   //       alignItems: "center",
  //   //       gap: "8px",
  //   //     }}
  //   //   >
  //   //     <button
  //   //       onClick={() => deleteSection(sectionId)}
  //   //       style={{
  //   //         border: "none",
  //   //         background: "none",
  //   //         cursor: "pointer",
  //   //         padding: "8px",
  //   //         color: "#666",
  //   //         fontSize: "14px",
  //   //         display: "flex",
  //   //         alignItems: "center",
  //   //         gap: "4px",
  //   //       }}
  //   //     >
  //   //       <span>🗑️</span>
  //   //       <span>Delete</span>
  //   //     </button>
  //   //     <button
  //   //       onClick={() => duplicateSection(section, sectionId)}
  //   //       style={{
  //   //         border: "none",
  //   //         background: "none",
  //   //         cursor: "pointer",
  //   //         padding: "8px",
  //   //         color: "#666",
  //   //         fontSize: "14px",
  //   //         display: "flex",
  //   //         alignItems: "center",
  //   //         gap: "4px",
  //   //       }}
  //   //     >
  //   //       <span>📋</span>
  //   //       <span>Duplicate</span>
  //   //     </button>
  //   //     <span
  //   //       style={{
  //   //         fontSize: "14px",
  //   //         color: "#666",
  //   //       }}
  //   //     >
  //   //       Required
  //   //     </span>
  //   //     <button
  //   //       onClick={() => {
  //   //         setForm((prevForm) => {
  //   //           const updatedSection = {
  //   //             ...section,
  //   //             required: !section.required,
  //   //           };
  //   //           return {
  //   //             ...prevForm,
  //   //             sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
  //   //           };
  //   //         });
  //   //       }}
  //   //       style={{
  //   //         width: "36px",
  //   //         height: "20px",
  //   //         backgroundColor: section.required ? "#4CAF50" : "#ccc",
  //   //         border: "none",
  //   //         borderRadius: "10px",
  //   //         cursor: "pointer",
  //   //         position: "relative",
  //   //         transition: "background-color 0.3s",
  //   //       }}
  //   //     >
  //   //       <div
  //   //         style={{
  //   //           width: "16px",
  //   //           height: "16px",
  //   //           backgroundColor: "white",
  //   //           borderRadius: "50%",
  //   //           position: "absolute",
  //   //           top: "2px",
  //   //           left: section.required ? "18px" : "2px",
  //   //           transition: "left 0.3s",
  //   //         }}
  //   //       />
  //   //     </button>
  //   //   </div>
  //   // </div>
  // );
};
