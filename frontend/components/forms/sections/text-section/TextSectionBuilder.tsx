import { FormSection, SectionId } from "@/interfaces/FormTypes";
import { TrashIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface TextSectionBuilderProps {
  section: FormSection;
  sectionId: SectionId;
  onUpdate: (section: FormSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: FormSection, sectionId: SectionId) => void;
}

export const TextSectionBuilder = ({ 
  section, 
  sectionId, 
  onUpdate, 
  onDelete, 
  onDuplicate 
}: TextSectionBuilderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="py-2.5">
        <input
          type="text"
          value={section.question}
          placeholder="Enter your question here?"
          onChange={(e) => {
            const updatedSection = { ...section, question: e.target.value };
            onUpdate(updatedSection);
          }}
          className="w-full flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex justify-end items-center gap-2">
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
              required: !section.required 
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