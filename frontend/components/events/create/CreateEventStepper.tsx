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
        <div className={`absolute -bottom-[4.5rem] w-max text-center ${activeStep === 0 ? '' : 'hidden sm:flex sm:flex-col'}`}>
          <Typography
            variant="h6"
            color={activeStep === 0 ? "blue-gray" : "gray"}
            className={activeStep === 0 ? '' : 'hidden sm:inline'}
          >
            Step 1
          </Typography>
          <Typography
            color={activeStep === 0 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 0 ? '' : 'hidden sm:inline'}`}
          >
            {stepLabels[0]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <TagIcon className="h-5 w-5" />
        <div className={`absolute -bottom-[4.5rem] w-max text-center ${activeStep === 1 ? '' : 'hidden sm:flex sm:flex-col'}`}>
          <Typography
            variant="h6"
            color={activeStep === 1 ? "blue-gray" : "gray"}
            className={activeStep === 1 ? '' : 'hidden sm:inline'}
          >
            Step 2
          </Typography>
          <Typography
            color={activeStep === 1 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 1 ? '' : 'hidden sm:inline'}`}
          >
            {stepLabels[1]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <PhotoIcon className="h-5 w-5" />
        <div className={`absolute -bottom-[4.5rem] w-max text-center ${activeStep === 2 ? '' : 'hidden sm:flex sm:flex-col'}`}>
          <Typography
            variant="h6"
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className={activeStep === 2 ? '' : 'hidden sm:inline'}
          >
            Step 3
          </Typography>
          <Typography
            color={activeStep === 2 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 2 ? '' : 'hidden sm:inline'}`}
          >
            {stepLabels[2]}
          </Typography>
        </div>
      </Step>
      <Step onClick={() => {}}>
        <CalendarIcon className="h-5 w-5" />
        <div className={`absolute -bottom-[4.5rem] w-max text-center ${activeStep === 3 ? '' : 'hidden sm:flex sm:flex-col'}`}>
          <Typography
            variant="h6"
            color={activeStep === 3 ? "blue-gray" : "gray"}
            className={activeStep === 3 ? '' : 'hidden sm:inline'}
          >
            Step 4
          </Typography>
          <Typography
            color={activeStep === 3 ? "blue-gray" : "gray"}
            className={`font-normal ${activeStep === 3 ? '' : 'hidden sm:inline'}`}
          >
            {stepLabels[3]}
          </Typography>
        </div>
      </Step>
    </Stepper>
  );
}
