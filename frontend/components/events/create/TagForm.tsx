import { FormWrapper } from "./FormWrapper";

type TagData = {
  tags: string[];
};

export function TagForm() {
  return (
    <FormWrapper title="Tags">
      <p>Tag</p>
    </FormWrapper>
  );
}
