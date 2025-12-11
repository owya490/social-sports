import { FormSection, SectionId, TickboxSection } from "@/interfaces/FormTypes";
import { DocumentDuplicateIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useCallback, useRef } from "react";

interface TickboxSectionBuilderProps {
  section: TickboxSection;
  sectionId: SectionId;
  onUpdate: (section: FormSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: FormSection) => void;
}

export const TickboxSectionBuilder = ({
  section,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: TickboxSectionBuilderProps) => {
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper function to check if last option is empty
  const isLastOptionEmpty = () => {
    return section.options[section.options.length - 1] === "";
  };

  // Helper function to update section
  const updateSection = useCallback(
    (updates: Partial<TickboxSection>) => {
      onUpdate({ ...section, ...updates });
    },
    [section, onUpdate]
  );

  // Handle option text changes
  const handleOptionChange = useCallback(
    (index: number, value: string) => {
      const updatedOptions = [...section.options];
      updatedOptions[index] = value;
      updateSection({ options: updatedOptions });
    },
    [section.options, updateSection]
  );

  // Handle adding new option
  const handleAddOption = useCallback(
    (atIndex?: number) => {
      const updatedOptions = [...section.options];
      if (atIndex !== undefined) {
        updatedOptions.splice(atIndex, 0, "");
      } else {
        updatedOptions.push("");
      }
      updateSection({ options: updatedOptions });

      // Focus the new input after DOM update
      if (atIndex !== undefined) {
        setTimeout(() => {
          const targetInput = optionInputRefs.current[atIndex];
          if (targetInput) {
            targetInput.focus();
          }
        }, 0);
      }
    },
    [section.options, updateSection]
  );

  // Handle removing option
  const handleRemoveOption = useCallback(
    (index: number) => {
      const updatedOptions = section.options.filter((_, i) => i !== index);

      // Ensure we always have at least one option (add empty one if needed)
      if (updatedOptions.length === 0) {
        updatedOptions.push("");
      }

      updateSection({ options: updatedOptions });
    },
    [section.options, updateSection]
  );

  // Handle removing empty option with delete key
  const handleDeleteEmptyOption = useCallback(
    (index: number) => {
      // Only remove if we have more than one option
      if (section.options.length > 1) {
        const updatedOptions = section.options.filter((_, i) => i !== index);
        updateSection({ options: updatedOptions });

        // Focus the previous option if available, otherwise focus the next one
        setTimeout(() => {
          const targetIndex = index > 0 ? index - 1 : 0;
          const targetInput = optionInputRefs.current[targetIndex];
          if (targetInput) {
            targetInput.focus();
          }
        }, 0);
      }
    },
    [section.options, updateSection]
  );

  // Handle key events on option inputs
  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddOption(index + 1);
      } else if (e.key === "Backspace" && section.options[index] === "") {
        e.preventDefault();
        handleDeleteEmptyOption(index);
      }
    },
    [handleAddOption, section.options, handleDeleteEmptyOption]
  );
  return (
    <div className="flex flex-col gap-4">
      {/* Question Input */}
      <div className="py-2.5">
        <input
          type="text"
          value={section.question}
          placeholder="Enter your question here?"
          onChange={(e) => updateSection({ question: e.target.value })}
          className="w-full flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {section.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-5 flex justify-center items-center text-gray-400">
              <div className="h-4 w-4 border-2 border-gray-400 rounded" />
            </div>
            <input
              ref={(el) => {
                if (optionInputRefs.current) {
                  optionInputRefs.current[index] = el;
                }
              }}
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Delete option button */}
            <button
              onClick={() => handleRemoveOption(index)}
              disabled={section.options.length === 1 && isLastOptionEmpty()}
              className={`p-1.5 rounded-md ${
                section.options.length === 1 && isLastOptionEmpty()
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={`Remove option ${index + 1}`}
            >
              <span>×</span>
            </button>
          </div>
        ))}

        {/* Add option button */}
        <div className="w-full flex justify-center">
          <button
            className={`border p-2 rounded-md ${
              isLastOptionEmpty() ? "border-gray-200 cursor-not-allowed" : "border-gray-300 hover:bg-core-hover"
            }`}
            onClick={() => handleAddOption()}
            disabled={isLastOptionEmpty()}
            aria-label="Add new option"
          >
            <PlusIcon width={16} className={isLastOptionEmpty() ? "text-gray-300" : "text-gray-600"} />
          </button>
        </div>
      </div>

      {/* Section Controls */}
      <div className="flex justify-end items-center gap-2 pt-2">
        <button
          onClick={() => onDelete(sectionId)}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <TrashIcon className="w-4 h-4 stroke-2" />
          <span>Delete</span>
        </button>
        <button
          onClick={() => onDuplicate(section)}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <DocumentDuplicateIcon className="w-4 h-4 stroke-2" />
          <span>Duplicate</span>
        </button>
        <span className="text-sm text-gray-600">Required</span>
        <button
          onClick={() => updateSection({ required: !section.required })}
          className="relative w-9 h-5 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: section.required ? "#4CAF50" : "#ccc",
          }}
          aria-label={`Toggle required field ${section.required ? "off" : "on"}`}
        >
          <div
            className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all duration-300 ${
              section.required ? "left-[18px]" : "left-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
};
