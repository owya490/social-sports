import React, { useState } from "react";
import { Form, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { SectionId } from "@/interfaces/FormTypes";

const initialForm: Form = {
  title: "Sample Form",
  userId: "user123",
  formActive: true,
  sectionsOrder: [],
  sectionsMap: new Map<SectionId, FormSection>(),
};

const FormEditor = () => {
  const [form, setForm] = useState<Form>(initialForm);

  const addSection = (section: FormSection) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, section),
    }));
  };

  const editSection = (sectionId: SectionId, updatedSection: FormSection) => {
    setForm((prevForm) => ({
      ...prevForm,
      sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
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
        return <input type="text" placeholder={section.question} />;
      case FormSectionType.MULTIPLE_CHOICE:
        return (
          <div>
            {section.options.map((option, index) => (
              <label key={index}>
                <input type="radio" name={section.question} value={String(option)} />
                {option}
              </label>
            ))}
          </div>
        );
      case FormSectionType.DROPDOWN_SELECT:
        return (
          <div>
            <div>
              <div>
                <div>
                  <input
                    type="text"
                    placeholder="Enter dropdown question"
                    value={section.question}
                    onChange={(e) => {
                      setForm((prevForm) => {
                        const updatedSection = { ...section, question: e.target.value };
                        return {
                          ...prevForm,
                          sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                        };
                      });
                    }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Enter new dropdown option"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      const newOption = e.currentTarget.value.trim();
                      setForm((prevForm) => {
                        const updatedSection = {
                          ...section,
                          options: [...section.options, newOption],
                        };
                        return {
                          ...prevForm,
                          sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
                        };
                      });
                      e.currentTarget.value = ""; // Clear the input field after adding the option
                    }
                  }}
                />
                <select>
                  {section.options.map((option, index) => (
                    <option key={index} value={String(option)}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case FormSectionType.BINARY_CHOICE:
        return (
          <div>
            <label>
              <input type="radio" name={section.question} value={section.choice1} />
              {section.choice1}
            </label>
            <label>
              <input type="radio" name={section.question} value={section.choice2} />
              {section.choice2}
            </label>
          </div>
        );
      case FormSectionType.FILE_UPLOAD:
        return <input type="file" />;
      case FormSectionType.DATE_TIME:
        return <input type="datetime-local" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="my-10">{form.title}</h1>
      {form.sectionsOrder.map((sectionId) => {
        const section = form.sectionsMap.get(sectionId);
        return section ? (
          <div key={sectionId}>
            {renderSection(section, sectionId)}
            <button onClick={() => editSection(sectionId, { ...section, question: "Updated Question" })}>Edit</button>
          </div>
        ) : null;
      })}
      <button
        onClick={() =>
          addSection({
            type: FormSectionType.TEXT,
            question: "New Question",
            imageUrl: null,
            required: true,
            answer: null,
          })
        }
      >
        Add Text Section
      </button>

      <button
        className="mx-4"
        onClick={() =>
          addSection({
            type: FormSectionType.MULTIPLE_CHOICE,
            question: "New Question",
            imageUrl: null,
            required: true,
            answer: null,
            options: [], // Add an empty array of options
          })
        }
      >
        Add Multiple Choice Section
      </button>

      <button
        className="mx-4"
        onClick={() =>
          addSection({
            type: FormSectionType.BINARY_CHOICE,
            question: "New Question",
            imageUrl: null,
            required: true,
            answer: null, // Set to null initially (or 0/1 if needed)
            choice1: "Option 1",
            choice2: "Option 2",
          })
        }
      >
        Add Binary Choice Section
      </button>

      <button
        className="mx-4"
        onClick={() =>
          addSection({
            type: FormSectionType.DROPDOWN_SELECT,
            question: "New Question",
            imageUrl: null,
            required: true,
            answer: null,
            options: [], // Add an empty array of options
          })
        }
      >
        Add Dropdown Section
      </button>
    </div>
  );
};

export default FormEditor;
