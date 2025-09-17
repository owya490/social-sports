interface EmptyInfoSectionProps {
  formSectionsOrder: string[];
}

const EmptyInfoSection = ({ formSectionsOrder }: EmptyInfoSectionProps) => {
  return (
    /* Empty State Card */
    formSectionsOrder.length === 0 && (
      <div className="bg-white/25 backdrop-blur-sm rounded-lg p-8 border border-gray-200/50">
        <p className="text-gray-500 text-center text-lg font-medium">
          Use the left form editor bar to add form sections!
        </p>
      </div>
    )
  );
};

export default EmptyInfoSection;
