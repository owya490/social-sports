import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { Form, FormDescription, FormId, FormTitle } from "@/interfaces/FormTypes";
import { UserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getActiveFormsForUser } from "@/services/src/forms/formsServices";
import { Option, Select } from "@material-tailwind/react";
import { useEffect, useState } from "react";

export type FormSelectorData = {
  formId: FormId | null;
};

type FormSelectorProps = FormSelectorData & {
  user: UserData;
  updateField: (formId: FormId | null) => void;
};

export const FormSelector = ({ formId, user, updateField }: FormSelectorProps) => {
  const logger = new Logger("FormSelector");
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const EMPTY_FORM: Form = {
    formId: "" as FormId,
    title: "No form" as FormTitle,
    description: "" as FormDescription,
    userId: "" as UserId,
    formActive: false,
    sectionsOrder: [],
    sectionsMap: {},
    lastUpdated: null,
  };

  useEffect(() => {
    const fetchUserForms = async () => {
      if (!user.userId) return;

      try {
        setLoading(true);
        setError(null);
        const userForms = await getActiveFormsForUser(user.userId);
        setForms([EMPTY_FORM, ...userForms]);
      } catch (err) {
        logger.error(`Failed to load user forms: ${err}`);
        setError("Failed to load forms");
      } finally {
        setLoading(false);
      }
    };

    fetchUserForms();
  }, [user.userId]);

  const handleFormSelection = (value: string | undefined) => {
    const selectedFormId = value === "" || !value ? null : (value as FormId);
    updateField(selectedFormId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <label className="text-black text-lg font-semibold">Select a Registration Form</label>
        <div className="text-sm text-gray-600">Loading your forms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <label className="text-black text-lg font-semibold">Select a Registration Form</label>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="text-black text-lg font-semibold">Select a Registration Form</label>
          <p className="text-sm mt-2 mb-4">
            Choose an existing form to collect participant registrations for this event.
          </p>
        </div>
        <div className="ml-4">
          <InvertedHighlightButton
            type="button"
            onClick={() => window.open("/organiser/forms/create-form/editor", "_blank")}
          >
            Create Form
          </InvertedHighlightButton>
        </div>
      </div>

      <div className="space-y-4">
        <Select
          key={`form-select-${formId || "none"}`}
          size="lg"
          label="Select Form"
          value={formId || ""}
          onChange={handleFormSelection}
        >
          {forms.map((form) => (
            <Option key={form.formId} value={form.formId}>
              {form.title}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};
