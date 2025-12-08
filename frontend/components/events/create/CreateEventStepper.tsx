import { CalendarIcon, PencilSquareIcon, PhotoIcon, UserIcon } from "@heroicons/react/24/outline";
import { Step, Stepper, Typography } from "@material-tailwind/react";

interface CreateEventStepperProps {
  activeStep: number;
  onStepClick: (step: number) => void;
}

export default function CreateEventStepper({ activeStep, onStepClick }: CreateEventStepperProps) {
  const stepLabels = ["Basic Information", "Images", "Description", "Preview and Create"];

  return (
    <Stepper activeStep={activeStep}>
      <Step onClick={() => onStepClick(0)} className="cursor-pointer">
        <UserIcon className="h-5 w-5" />
        <div
          className={`absolute -bottom-[4.5rem] w-max text-center ${
            activeStep === 0 ? "" : "hidden sm:flex sm:flex-col items-center"
          }`}
        >
          <Typography
            variant="h6"
            color={activeStep === 0 ? "blue-gray" : "gray"}
            className={`${activeStep === 0 ? "" : "hidden sm:inline"} text-sm md:text-base`}
          >
            Step 1
          </Typography>
          <Typography
            color={activeStep === 0 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 0 ? "" : "hidden sm:inline"} text-sm w-24 md:w-full`}
          >
            {stepLabels[0]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => onStepClick(1)} className="cursor-pointer">
        <PhotoIcon className="h-5 w-5" />
        <div
          className={`absolute -bottom-[4.5rem] w-max text-center ${
            activeStep === 1 ? "" : "hidden sm:flex sm:flex-col items-center"
          }`}
        >
          <Typography
            variant="h6"
            color={activeStep === 1 ? "blue-gray" : "gray"}
            className={`${activeStep === 1 ? "" : "hidden sm:inline"} text-sm md:text-base`}
          >
            Step 2
          </Typography>
          <Typography
            color={activeStep === 1 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 1 ? "" : "hidden sm:inline"} text-sm w-20 md:w-full`}
          >
            {stepLabels[1]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => onStepClick(2)} className="cursor-pointer">
        <PencilSquareIcon className="h-5 w-5" />
        <div
          className={`absolute -bottom-[4.5rem] w-max text-center ${
            activeStep === 2 ? "" : "hidden sm:flex sm:flex-col items-center"
          }`}
        >
          <Typography
            variant="h6"
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className={`${activeStep === 2 ? "" : "hidden sm:inline"} text-sm md:text-base`}
          >
            Step 3
          </Typography>
          <Typography
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 2 ? "" : "hidden sm:inline"} text-sm w-24 md:w-full`}
          >
            {stepLabels[2]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => onStepClick(3)} className="cursor-pointer">
        <CalendarIcon className="h-5 w-5" />
        <div
          className={`absolute -bottom-[4.5rem] w-max text-center ${
            activeStep === 3 ? "" : "hidden sm:flex sm:flex-col items-center"
          }`}
        >
          <Typography
            variant="h6"
            color={activeStep === 3 ? "blue-gray" : "gray"}
            className={`${activeStep === 3 ? "" : "hidden sm:inline"} text-sm md:text-base`}
          >
            Step 4
          </Typography>
          <Typography
            color={activeStep === 3 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 3 ? "" : "hidden sm:inline"} text-sm w-24 md:w-full`}
          >
            {stepLabels[3]}
          </Typography>
        </div>
      </Step>
    </Stepper>
  );
}
