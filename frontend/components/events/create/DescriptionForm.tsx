import { FormWrapper } from "./FormWrapper";

export function DescriptionForm() {
  return (
    <FormWrapper title="Additional Event Info">
      <label className="font-semibold">Name of Event</label>
      <input className="border-2 rounded-full p-2" required type="text" />
      <label className="font-semibold">Description</label>
      <input className="border-2 rounded-full p-2" required type="text" />
      <label className="font-semibold">Image</label>
      <input className="border-2 rounded-full p-2 px-4" type="file" />
    </FormWrapper>
  );
}
