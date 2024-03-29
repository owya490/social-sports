import {
  CalendarIcon,
  PhotoIcon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Step, Stepper, Typography } from "@material-tailwind/react";

interface CreateEventStepperProps {
  activeStep: number;
}

export default function CreateEventStepper({
  activeStep,
}: CreateEventStepperProps) {
  const stepLabels = [
    "Basic Information",
    "Relevant Tags",
    "Description and Image",
    "Preview and Create",
  ];

  return (
    <Stepper activeStep={activeStep}>
      <Step onClick={() => {}}>
        <UserIcon className="h-5 w-5" />
        <div className="absolute -bottom-[4.5rem] w-max text-center">
          <Typography
            variant="h6"
            color={activeStep === 0 ? "blue-gray" : "gray"}
          >
            Step 1
          </Typography>
          <Typography
            color={activeStep === 0 ? "blue-gray" : "gray"}
            className="font-normal"
          >
            {stepLabels[0]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <TagIcon className="h-5 w-5" />
        <div className="absolute -bottom-[4.5rem] w-max text-center">
          <Typography
            variant="h6"
            color={activeStep === 1 ? "blue-gray" : "gray"}
          >
            Step 2
          </Typography>
          <Typography
            color={activeStep === 1 ? "blue-gray" : "gray"}
            className="font-normal"
          >
            {stepLabels[1]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <PhotoIcon className="h-5 w-5" />
        <div className="absolute -bottom-[4.5rem] w-max text-center">
          <Typography
            variant="h6"
            color={activeStep === 2 ? "blue-gray" : "gray"}
          >
            Step 3
          </Typography>
          <Typography
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className="font-normal"
          >
            {stepLabels[2]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <CalendarIcon className="h-5 w-5" />
        <div className="absolute -bottom-[4.5rem] w-max text-center">
          <Typography
            variant="h6"
            color={activeStep === 2 ? "blue-gray" : "gray"}
          >
            Step 4
          </Typography>
          <Typography
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className="font-normal"
          >
            {stepLabels[3]}
          </Typography>
        </div>
      </Step>
    </Stepper>
  );
}
