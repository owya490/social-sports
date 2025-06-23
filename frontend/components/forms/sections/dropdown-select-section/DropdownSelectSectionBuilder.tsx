import { DropdownSelectSection, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";

interface DropdownSelectSectionBuilderProps {
  section: DropdownSelectSection;
  sectionId: SectionId;
  onUpdate: (section: FormSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: FormSection, sectionId: SectionId) => void;
}

export const DropdownSelectSectionBuilder = ({
  section,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: DropdownSelectSectionBuilderProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Question Input */}
      <div className="py-2.5">
        <input
          type="text"
          value={section.question}
          placeholder="Enter your question here?"
          onChange={(e) => {
            const updatedSection = { 
              ...section, 
              question: e.target.value 
            };
            onUpdate(updatedSection);
          }}
          className="w-full flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {section.options.map((option, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-gray-600 w-5 text-right">{index + 1}.</span>
            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => {
                const updatedSection = { ...section };
                updatedSection.options[index] = e.target.value;

                // Add new option field if last field is being typed in
                if (index === updatedSection.options.length - 1 && e.target.value.trim() !== "") {
                  updatedSection.options.push("");
                }

                onUpdate(updatedSection);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Delete option button - only show if not last option */}
            {index !== section.options.length - 1 && (
              <button
                onClick={() => {
                  const updatedSection = { ...section };
                  updatedSection.options = updatedSection.options.filter((_, i) => i !== index);
                  onUpdate(updatedSection);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <span>×</span>
              </button>
            )}
          </div>
        ))}
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
          onClick={() => onDuplicate(section, sectionId)}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <DocumentDuplicateIcon className="w-4 h-4 stroke-2" />
          <span>Duplicate</span>
        </button>
        <span className="text-sm text-gray-600">Required</span>
        <button
          onClick={() => {
            const updatedSection = {
              ...section,
              required: !section.required,
            };
            onUpdate(updatedSection);
          }}
          className="relative w-9 h-5 rounded-full transition-colors duration-300"
          style={{
            backgroundColor: section.required ? '#4CAF50' : '#ccc'
          }}
        >
          <div
            className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all duration-300 ${
              section.required ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
};