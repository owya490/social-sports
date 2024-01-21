import { FormWrapper } from "./FormWrapper";

type BasicData = {
  cost: number;
  people: number;
};

type PreviewFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function PreviewForm(props: PreviewFormProps) {
  return (
    <FormWrapper>
      <div className="my-32">
        {/* <EventCard eventId={""} image={""} name={"Going Global Mens Volleyball Scrims"} organiser={undefined} startTime={new Timestamp} location={""} price={0} vacancy={0} /> */}
      </div>
    </FormWrapper>
  );
}
