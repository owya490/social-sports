// BasicInformation.tsx

import { Input, Option, Select } from "@material-tailwind/react";
import { FormWrapper } from "./FormWrapper";

type BasicData = {
  name: string;
  location: string;
};

type BasicInformationProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function BasicInformation({
  name,
  location,
  updateField,
}: BasicInformationProps) {
  return (
    <FormWrapper title="">
      <label className="mb-2 text-black text-lg">Name your event</label>
      <Input
        label="Event Name"
        crossOrigin={undefined}
        required
        value={name}
        onChange={(e) => updateField({ name: e.target.value })}
        className="rounded-md"
      />

      <label className="mb-2 text-black text-lg">Enter your Location</label>
      <Input
        label="Location"
        crossOrigin={undefined}
        required
        value={location}
        onChange={(e) => updateField({ location: e.target.value })}
        className="rounded-md"
      />

      <label className="mb-2 text-black text-lg">Select the sport</label>
      <Select label="Select Sport">
        <Option>Volleyball</Option>
        <Option>Badminton</Option>
        <Option>Basketball</Option>
        <Option>Soccer</Option>
        <Option>Tennis</Option>
        <Option>Table Tennis</Option>
        <Option>Oztag</Option>
        <Option>Baseball</Option>
      </Select>
    </FormWrapper>
  );
}
