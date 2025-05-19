import { Form, FormId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { useState } from "react";

const initialForm: Form = {
  title: "Sample Form",
  userId: "user123",
  formActive: true,
  sectionsOrder: [],
  sectionsMap: new Map<SectionId, FormSection>(),
};

export interface FormEditorParams {
  formId: FormId;
}

const FormEditor = ({ formId }: FormEditorParams) => {
  const [form, setForm] = useState<Form>(initialForm);

  const addSection = (section: FormSection) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, section),
    }));
  };

  const updateDropdownOptions = (sectionId: SectionId, newOptions: string[]) => {
    setForm((prevForm) => {
      const section = prevForm.sectionsMap.get(sectionId);
      if (section && section.type === FormSectionType.DROPDOWN_SELECT) {
        const updatedSection = { ...section, options: newOptions };
        return {
          ...prevForm,
          sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
        };
      }
      return prevForm;
    });
  };

  const renderSection = (section: FormSection, sectionId: SectionId) => {
    const updateDropdownOptions = (newOptions: string[]) => {
      setForm((prevForm) => {
        const updatedSection = { ...section, options: newOptions };
        return {
          ...prevForm,
          sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
        };
      });
    };

    switch (section.type) {
      case FormSectionType.TEXT:
        return (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <input
            type="text"
            value={section.question}
            placeholder="Enter your question here?"
            onChange={(e) => {
              setForm((prevForm) => {
                const updatedSection = { ...section, question: e.target.value };
                return {
                  ...prevForm,
                  sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                };
              });
            }}
            style={{
              flex: 1,
              padding: '10px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        
        );
      // case FormSectionType.MULTIPLE_CHOICE:
      //   return (
      //     <div>
      //       {section.options.map((option, index) => (
      //         <label key={index}>
      //           <input type="radio" name={section.question} value={String(option)} />
      //           {option}
      //         </label>
      //       ))}
      //     </div>
      //   );
      case FormSectionType.DROPDOWN_SELECT:
        return (
          <div
            style={{
              marginTop: '0', // Pushes the structure to the top of the page
              padding: '10px',
            }}
          >
            {/* Editable Question Field */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <input
                type="text"
                value={section.question}
                placeholder="Enter your question here?"
                onChange={(e) => {
                  setForm((prevForm) => {
                    const updatedSection = { ...section, question: e.target.value };
                    return {
                      ...prevForm,
                      sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                    };
                  });
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  width: '100%',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            {/* Dynamic Option Fields */}
            {section.options.map((option, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span style={{ marginRight: '10px', width: '20px', textAlign: 'right' }}>
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={option}
                  placeholder={`Option ${index + 1}`}
                  onChange={(e) => {
                    setForm((prevForm) => {
                      const updatedSection = { ...section };
                      updatedSection.options[index] = e.target.value;

                      // Add a new empty option if editing the last option
                      if (index === updatedSection.options.length - 1 && e.target.value.trim() !== '') {
                        updatedSection.options.push('');
                      }

                      return {
                        ...prevForm,
                        sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                      };
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
            ))}
          </div>
        );

      // case FormSectionType.FILE_UPLOAD:
      //   return <input type="file" />;
      // case FormSectionType.DATE_TIME:
      //   return <input type="datetime-local" />;
      // default:
      //   return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Centered Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        <h1 className="my-10">{form.title}</h1>
        {form.sectionsOrder.map((sectionId) => {
          const section = form.sectionsMap.get(sectionId);
          return section ? (
            <div
              key={sectionId}
              style={{
                marginBottom: "20px",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                width: "100%",
                maxWidth: "600px",
                backgroundColor: "#f9f9f9",
              }}
            >
              {renderSection(section, sectionId)}
            </div>
          ) : null;
        })}
      </div>

      {/* Right Navbar */}
      <div
        style={{
          width: "250px",
          backgroundColor: "#f4f4f4",
          padding: "20px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3>Actions</h3>
        <button
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            addSection({
              type: FormSectionType.TEXT,
              question: "",
              imageUrl: null,
              required: true,
            })
          }
        >
          Add Text Section
        </button>
        <button
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() =>
            addSection({
              type: FormSectionType.DROPDOWN_SELECT,
              question: "",
              required: true,
              options: [""],
              imageUrl: null,
            })
          }
        >
          Add Dropdown Section
        </button>
      </div>
    </div>
  );
};

export default FormEditor;
