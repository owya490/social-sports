"use client";

import { Switch } from "@mantine/core";

interface SettingsSwitchProps {
  title: string;
  description: string;
  state: boolean;
  setState: (event: boolean) => void;
  updateData: (event: boolean) => void;
}
export const SettingsSwitch = ({ title, description, state, setState, updateData }: SettingsSwitchProps) => {
  return (
    <div className="lg:flex w-full items-center">
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
