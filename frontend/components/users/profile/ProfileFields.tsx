"use client";
import DescriptionRichTextEditor from "@/components/editor/DescriptionRichTextEditor";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CheckIcon from "@heroicons/react/24/outline/CheckIcon";
import { Input, Option, Select } from "@material-tailwind/react";
import { useState } from "react";

export const RenderField = ({
  label,
  value,
  fieldHandleClick,
  fieldType,
}: {
  label: string;
  value: string;
  fieldHandleClick?: () => void;
  fieldType?: FieldTypes;
}) => {
  value = value ? value : "N/A";

  const displayValue = () => {
    return fieldType === FieldTypes.LONG_TEXT ? (
      <div className="text-xs md:text-md font-medium text-gray-700">
        <RichTextEditorContent description={value} />
      </div>
    ) : (
      <strong className="text-xs md:text-md font-medium text-gray-700">{value}</strong>
    );
  };

  return (
    <div key={label} className="mb-2">
      <div className="flex justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700">{label}:</strong>
        {fieldHandleClick ? (
          <div>
            <button onClick={fieldHandleClick} className="hover:bg-core-hover py-0.5 px-1.5 rounded-lg">
              {displayValue()}
              {/* <strong className="text-xs md:text-md font-medium text-gray-700">{value}</strong> */}
            </button>
          </div>
        ) : (
          <strong className="text-xs md:text-md font-medium text-gray-700 py-0.5 px-1.5 mt-1">{value}</strong>
        )}
      </div>
    </div>
  );
};

export enum FieldTypes {
  SHORT_TEXT,
  LONG_TEXT,
  DATE,
  SELECT,
}

export const RenderEditableField = ({
  label,
  value,
  type,
  onSubmit,
  customValidation,
  options,
}: {
  label: string;
  value: any;
  type: FieldTypes;
  onSubmit: (value: any) => void;
  customValidation?: (value: any) => boolean;
  options?: string[];
}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [editableValue, setEditabledValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  return editing ? (
    <>
      {determineEditableFieldJsx(
        type,
        label,
        editableValue,
        () => {
          setEditing(false);
          setPrevValue(editableValue);
          onSubmit(editableValue);
        },
        () => {
          setEditing(false);
          setEditabledValue(prevValue);
        },
        setEditabledValue,
        options,
        customValidation
      )}
    </>
  ) : (
    <RenderField
      label={label}
      value={editableValue}
      fieldHandleClick={() => {
        setEditing(true);
      }}
      fieldType={type}
    />
  );
};

const determineEditableFieldJsx = (
  fieldType: FieldTypes,
  label: string,
  value: string,
  onSubmit: () => void,
  onCancel: () => void,
  onChange: (value: any) => void,
  options?: string[],
  customValidation?: (value: any) => boolean
) => {
  switch (fieldType) {
    case FieldTypes.SHORT_TEXT: {
      return (
        <RenderEditableShortTextField
          label={label}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          customValidation={customValidation}
        />
      );
    }
    case FieldTypes.LONG_TEXT: {
      return (
        <RenderEditableLongTextField
          label={label}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );
    }
    case FieldTypes.DATE: {
      return (
        <RenderEditableDateField
          label={label}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          customValidation={customValidation}
        />
      );
    }
    case FieldTypes.SELECT: {
      return (
        <RenderEditableSelectField
          label={label}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
          options={options!}
        />
      );
    }
  }
};

const RenderEditableShortTextField = ({
  label,
  value,
  onChange,
  onSubmit,
  onCancel,
  customValidation,
}: {
  label: string;
  value: string;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (value: any) => void;
  customValidation?: (value: any) => boolean;
}) => {
  return (
    <div key={label} className="mb-2">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700 hidden md:block">{label}:</strong>
        <div className="w-80 flex">
          <Input
            className="w-full"
            value={value}
            onChange={(e: any) => {
              // If validation exists, perform it, otherwise allow the change
              if (customValidation ? customValidation(e.target.value) : true) {
                onChange(e.target.value);
              }
            }}
            crossOrigin="false"
            label={label}
          />
          <CheckIcon className={`w-7 stroke-organiser-title-gray-text cursor-pointer`} onClick={onSubmit} />
          <XMarkIcon className="w-7 stroke-organiser-title-gray-text cursor-pointer" onClick={onCancel} />
        </div>
      </div>
    </div>
  );
};

const RenderEditableDateField = ({
  label,
  value,
  onChange,
  onSubmit,
  onCancel,
  customValidation,
}: {
  label: string;
  value: string;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (value: any) => void;
  customValidation?: (value: any) => boolean;
}) => {
  function convertDateToInput(dateStr: string): string {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  function convertInputToDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }

  return (
    <div key={label} className="mb-2">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700 hidden md:block">{label}:</strong>
        <div className="w-80 flex">
          <Input
            className="w-full"
            type="date"
            value={convertDateToInput(value)}
            onChange={(e: any) => {
              // If validation exists, perform it, otherwise allow the change
              if (customValidation ? customValidation(e) : true) {
                onChange(convertInputToDate(e.target.value));
              }
            }}
            crossOrigin="false"
            label={label}
          />
          <CheckIcon className={`w-7 stroke-organiser-title-gray-text cursor-pointer`} onClick={onSubmit} />
          <XMarkIcon className="w-7 stroke-organiser-title-gray-text cursor-pointer" onClick={onCancel} />
        </div>
      </div>
    </div>
  );
};

const RenderEditableLongTextField = ({
  label,
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  label: string;
  value: string;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (value: any) => void;
}) => {
  return (
    <div key={label} className="mb-2">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700 hidden md:block">{label}:</strong>
      </div>
      <div className="w-full flex">
        <div className="w-full mt-2">
          <DescriptionRichTextEditor description={value} updateDescription={onChange} />
        </div>
        <CheckIcon className={`w-7 stroke-organiser-title-gray-text cursor-pointer`} onClick={onSubmit} />
        <XMarkIcon className="w-7 stroke-organiser-title-gray-text cursor-pointer" onClick={onCancel} />
      </div>
    </div>
  );
};

const RenderEditableSelectField = ({
  label,
  value,
  onChange,
  onSubmit,
  onCancel,
  options,
}: {
  label: string;
  value: string;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (value: any) => void;
  options: string[];
}) => {
  return (
    <div key={label} className="mb-2">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700 hidden md:block">{label}:</strong>
        <div className="w-80 flex">
          <Select label={label} value={value} onChange={onChange}>
            {options.map((option, idx) => {
              return (
                <Option key={idx} value={option}>
                  {option}
                </Option>
              );
            })}
          </Select>
          <CheckIcon className={`w-7 stroke-organiser-title-gray-text cursor-pointer`} onClick={onSubmit} />
          <XMarkIcon className="w-7 stroke-organiser-title-gray-text cursor-pointer" onClick={onCancel} />
        </div>
      </div>
    </div>
  );
};

export const RenderNonEditableField = ({ label, value }: { label: string; value: any }) => {
  return <RenderField label={label} value={value} />;
};
