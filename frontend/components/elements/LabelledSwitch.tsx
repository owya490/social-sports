"use client";

import { Switch } from "@mantine/core";

interface LabelledSwitchProps {
  title: string;
  description: string;
  state: boolean;
  setState: (event: boolean) => void;
  updateData: (event: boolean) => void;
}
export const LabelledSwitch = ({ title, description, state, setState, updateData }: LabelledSwitchProps) => {
  return (
    <div className="flex w-full items-center gap-4">
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-core-text font-light text-sm">{description}</p>
      </div>
      <Switch
        color="teal"
        size="sm"
        className="ml-auto"
        checked={state}
        onChange={(event) => {
          updateData(event.currentTarget.checked);
          setState(event.currentTarget.checked);
        }}
      />
    </div>
  );
};
