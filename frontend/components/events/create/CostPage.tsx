import { Input } from "@material-tailwind/react";
import { FormWrapper } from "./FormWrapper";
import CreateEventCostSlider from "./CreateEventCostSlider";

type BasicData = {
  // date: string;
  // time: string;
  // location: string;
  cost: number;
  people: number;
};
type CostPage = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};
export function CostPage({
  // date,
  // time,
  // location,
  cost,
  people,
  updateField,
}: CostPage) {
  return (
    <FormWrapper title="">
      {/* <label className="font-semibold">Date</label>
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
      /> */}
      {/* <label className="font-semibold">Location</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="text"
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
      /> */}
{/* 
      <label className="mb-2 text-black text-lg">
                    Name your event
        </label>
      <Input
        label="Event Name" 
        crossOrigin={undefined}   
        required
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
        className="rounded-md" 
        />
      
       <label className="mb-2 text-black text-lg">
                    Enter your Location
        </label>
      <Input
        label="Location" 
        crossOrigin={undefined}   
        required
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
        className="rounded-md" 
        /> */}
      <CreateEventCostSlider/>
      <label className="font-semibold">Add custom amount</label>
      
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
