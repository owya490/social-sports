import { Input } from "@material-tailwind/react";
import { FormWrapper } from "./FormWrapper";
import { Select, Option } from "@material-tailwind/react";

type BasicData = {
    date: string;
    time_start: string;
    time_finish: string;
    // name: string;
    // location: string;
    //cost: number;
    //people: number;
};
type BasicInfromationProps = BasicData & {
    updateField: (fields: Partial<BasicData>) => void;
};
export function TimeSlot({
    date,
    time_start,
    time_finish,
    //   name,
    //   location,
    //cost,
    //people,
    updateField,
}: BasicInfromationProps) {
    return (
        <FormWrapper title="">
            <label className="font-semibold">Date</label>
            <input
                className="border-2 rounded-full p-2"
                autoFocus
                required
                type="date"
                value={date}
                onChange={(e) => updateField({ date: e.target.value })}
            />
            <label className="font-semibold">Time Start</label>
            <input
                className="border-2 rounded-full p-2"
                required
                type="time"
                value={time_start}
                onChange={(e) => updateField({ time_start: e.target.value })}
            />
            <label className="font-semibold">Time Finish</label>
            <input
                className="border-2 rounded-full p-2"
                required
                type="time"
                value={time_finish}
                onChange={(e) => updateField({ time_finish: e.target.value })}
            />
            {/* <label className="font-semibold">Location</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="text"
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
      /> */}

            {/* <label className="mb-2 text-black text-lg">
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
        />
    <label className="mb-2 text-black text-lg">
                    Select the sport
        </label>
    <Select 
      label="Select Sport">
        <Option>Volleyball</Option>
        <Option>Badminton</Option>
        <Option>Basketball</Option>
        <Option>Soccer</Option>
        <Option>Tennis</Option>
        <Option>Table Tennis</Option>
        <Option>Oztag</Option>
        <Option>Baseball</Option>
      </Select> */}
            {/* <label className="font-semibold">Cost per person</label>
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
      /> */}
        </FormWrapper>
    );
}
