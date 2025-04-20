"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CheckIcon from "@heroicons/react/24/outline/CheckIcon";
import { Input } from "@material-tailwind/react";
import { useState } from "react";

export const RenderField = ({
  label,
  value,
  fieldHandleClick,
}: {
  label: string;
  value: string;
  fieldHandleClick?: () => void;
}) => {
  return (
    <div key={label} className="mb-2">
      <div className="flex flex-col md:flex-row md:justify-between w-full">
        <strong className="text-xs md:text-md font-medium text-gray-700">{label}:</strong>
        {fieldHandleClick ? (
          <div>
            <button onClick={fieldHandleClick} className="hover:bg-core-hover py-0.5 px-1.5 rounded-lg">
              <strong className="text-xs md:text-md font-medium text-gray-700">{value}</strong>
            </button>
          </div>
        ) : (
          <strong className="text-xs md:text-md font-medium text-gray-700">{value}</strong>
        )}
      </div>
    </div>
  );
};

export enum FieldTypes {
  SHORT_TEXT,
  LONG_TEXT,
  DATE,
  BOOLEAN,
}

export const RenderEditableField = ({
  label,
  value,
  type,
  onSubmit,
  customValidation,
}: {
  label: string;
  value: any;
  type: FieldTypes;
  onSubmit: (value: any) => void;
  customValidation?: (value: any) => boolean;
}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [editableValue, setEditabledValue] = useState(value);
  return editing ? (
    <>
      {determineEditableFieldJsx(
        type,
        label,
        editableValue,
        () => {
          setEditing(false);
          onSubmit(editableValue);
        },
        () => {
          setEditing(false);
          setEditabledValue(value);
        },
        setEditabledValue,
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
      return <></>;
    }
    case FieldTypes.DATE: {
      return <></>;
    }
    case FieldTypes.BOOLEAN: {
      return <></>;
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
              if (customValidation ? customValidation(e) : true) {
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
