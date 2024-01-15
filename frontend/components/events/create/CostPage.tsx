import { Input } from "@material-tailwind/react";
import { FormWrapper } from "./FormWrapper";
import CreateEventCostSlider from "./CreateEventCostSlider";
import React, { useState } from "react";

type BasicData = {
  cost: number;
  people: number;
};

type CostPageProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function CostPage({ cost, people, updateField }: CostPageProps) {
  const [customAmount, setCustomAmount] = useState(cost);

  const handleCustomAmountChange = (amount: number) => {
    setCustomAmount(amount);
    updateField({ cost: amount }); // Update the cost field in the parent component
  };

  return (
    <FormWrapper title="">
      <CreateEventCostSlider
        initialCustomAmount={customAmount}
        onCustomAmountChange={handleCustomAmountChange}
      />
      <label className="font-semibold">Add custom amount</label>
      <input
        className="border-2 rounded-full p-2"
        required
        type="number"
        min={0}
        value={customAmount}
        onChange={(e) => handleCustomAmountChange(parseInt(e.target.value))}
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
