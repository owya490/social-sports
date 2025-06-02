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

const FormEditor = ({}: FormEditorParams) => {
  const [form, setForm] = useState<Form>(initialForm);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      title: e.target.value,
    }));
  };

  const duplicateSection = (section: FormSection, sectionId: SectionId) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, {
        ...section,
        // Deep copy the options array if it exists
        ...(section.type === FormSectionType.DROPDOWN_SELECT && {
          options: [...section.options],
        }),
      }),
    }));
  };

  const deleteSection = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const newMap = new Map(prevForm.sectionsMap);
      newMap.delete(sectionId);
      return {
        ...prevForm,
        sectionsOrder: prevForm.sectionsOrder.filter((id) => id !== sectionId),
        sectionsMap: newMap,
      };
    });
  };

  const addSection = (section: FormSection) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, section),
    }));
  };

  const renderSection = (section: FormSection, sectionId: SectionId) => {
    switch (section.type) {
      case FormSectionType.TEXT:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
                padding: "10px",
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                onClick={() => deleteSection(sectionId)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "8px",
                  color: "#666",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
              <button
                onClick={() => duplicateSection(section, sectionId)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: "8px",
                  color: "#666",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>📋</span>
                <span>Duplicate</span>
              </button>
              <span
                style={{
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Required
              </span>
              <button
                onClick={() => {
                  setForm((prevForm) => {
                    const updatedSection = {
                      ...section,
                      required: !section.required,
                    };
                    return {
                      ...prevForm,
                      sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                    };
                  });
                }}
                style={{
                  width: "36px",
                  height: "20px",
                  backgroundColor: section.required ? "#4CAF50" : "#ccc",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background-color 0.3s",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    position: "absolute",
                    top: "2px",
                    left: section.required ? "18px" : "2px",
                    transition: "left 0.3s",
                  }}
                />
              </button>
            </div>
          </div>
        );

      case FormSectionType.DROPDOWN_SELECT:
        return (
          <div style={{ marginTop: "0", padding: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
                  padding: "10px",
                  width: "100%",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />

              {section.options.map((option, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ marginRight: "10px", width: "20px", textAlign: "right" }}>{index + 1}.</span>
                  <input
                    type="text"
                    value={option}
                    placeholder={`Option ${index + 1}`}
                    onChange={(e) => {
                      setForm((prevForm) => {
                        const updatedSection = { ...section };
                        updatedSection.options[index] = e.target.value;

                        if (index === updatedSection.options.length - 1 && e.target.value.trim() !== "") {
                          updatedSection.options.push("");
                        }

                        return {
                          ...prevForm,
                          sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                        };
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      width: "100%",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ))}

              {/* Required Toggle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={() => deleteSection(sectionId)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: "8px",
                    color: "#666",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>🗑️</span>
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => duplicateSection(section, sectionId)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: "8px",
                    color: "#666",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>📋</span>
                  <span>Duplicate</span>
                </button>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Required
                </span>
                <button
                  onClick={() => {
                    setForm((prevForm) => {
                      const updatedSection = {
                        ...section,
                        required: !section.required,
                      };
                      return {
                        ...prevForm,
                        sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                      };
                    });
                  }}
                  style={{
                    width: "36px",
                    height: "20px",
                    backgroundColor: section.required ? "#4CAF50" : "#ccc",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "2px",
                      left: section.required ? "18px" : "2px",
                      transition: "left 0.3s",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f0f0", padding: "20px" }}>
      {/* Left Toolbar */}
      <div
        style={{
          width: "60px",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
          marginRight: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
          position: "sticky",
          top: "20px",
          alignSelf: "flex-start",
          height: "fit-content",
        }}
      >
        <button
          onClick={() =>
            addSection({
              type: FormSectionType.TEXT,
              question: "",
              imageUrl: null,
              required: true,
            })
          }
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>+</span>
        </button>
        <button
          onClick={() =>
            addSection({
              type: FormSectionType.DROPDOWN_SELECT,
              question: "",
              options: [""],
              imageUrl: null,
              required: true,
            })
          }
          style={{ border: "none", background: "none", cursor: "pointer", padding: "8px" }}
        >
          <span style={{ fontSize: "20px" }}>⌄</span>
        </button>
        <button style={{ border: "none", background: "none", cursor: "pointer", padding: "8px" }}>
          <span style={{ fontSize: "20px" }}>📄</span>
        </button>
      </div>

      {/* Main Form Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Form Title Card */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {isEditingTitle ? (
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                width: "100%",
                border: "none",
                outline: "none",
                marginBottom: "16px",
              }}
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "16px",
                cursor: "pointer",
              }}
            >
              {form.title}
            </h1>
          )}
          <input
            type="text"
            placeholder="Form description"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              color: "#666",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Questions Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {form.sectionsOrder.map((sectionId) => {
            const section = form.sectionsMap.get(sectionId);
            return section ? (
              <div
                key={sectionId}
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {renderSection(section, sectionId)}
              </div>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};

export default FormEditor;
