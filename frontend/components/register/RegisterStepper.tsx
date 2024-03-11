import {
  CalendarIcon,
  PhotoIcon,
  TagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Step, Stepper, Typography } from "@material-tailwind/react";

interface RegisterStepperProps {
  activeStep: number;
}

export default function RegisterStepper({ activeStep }: RegisterStepperProps) {
  const stepLabels = ["Public Information", "Basic Information"];

  return (
    <Stepper activeStep={activeStep}>
      <Step onClick={() => {}}>
        <PhotoIcon className="h-5 w-5" />
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
        <UserIcon className="h-5 w-5" />
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
    </Stepper>
  );
}
