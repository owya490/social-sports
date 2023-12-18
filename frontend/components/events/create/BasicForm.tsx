import { FormWrapper } from "./FormWrapper";

type BasicData = {
  date: string;
  time: string;
  location: string;
  cost: number;
  people: number;
};
type BasicFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};
export function BasicForm({
  date,
  time,
  location,
  cost,
  people,
  updateField,
}: BasicFormProps) {
  return (
    <FormWrapper title="Basic Event Info">
      <label className="font-semibold">Date</label>
      <input
        className="border-2 rounded-full p-2"
        autoFocus
        required
        type="date"
        value={date}
        onChange={(e) => updateField({ date: e.target.value })}
      />
      <label className="font-semibold">Time</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="time"
        value={time}
        onChange={(e) => updateField({ time: e.target.value })}
      />
      <label className="font-semibold">Location</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="text"
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
      />
      <label className="font-semibold">Cost per person</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="number"
        min={0}
        value={cost}
        onChange={(e) => updateField({ cost: parseInt(e.target.value) })}
      />
      <label className="font-semibold">Maximum amount of people</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="number"
        min={1}
        value={people}
        onChange={(e) => updateField({ people: parseInt(e.target.value) })}
      />
    </FormWrapper>
  );
}
