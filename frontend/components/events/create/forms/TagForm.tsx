import { TagGroup } from "@/components/TagGroup";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/src/tagService";
import { Button, Input } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { FormWrapper } from "./FormWrapper";

type BasicData = {};

type TagFormProps = BasicData & {
  updateField: (fields: Partial<BasicData>) => void;
};

export function TagForm({}: TagFormProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    getAllTags().then((data) => {
      setTags(data);
    });
  }, []);

  return (
    <FormWrapper>
      <div className="my-24 mb-60 sm:mb-30">
        {/* Form Elements */}
        {/* <label className="text-black text-lg font-semibold">Search and select relevant tags?</label>
        <div className="relative flex w-full my-8">
          <Input
            label="Tag Search"
            value={""}
            className="pr-20 focus:ring-0"
            containerProps={{
              className: "min-w-0",
            }}
            crossOrigin={undefined}
          />
          <Button size="sm" className="!absolute right-1 top-1 rounded">
            Search
          </Button>
        </div>
        <div className="w-full flex flex-wrap">
          <TagGroup tags={tags} spacing={true} size="sm" />
        </div> */}
        
        {/* Warning Message */}
        <div className="bg-yellow-200 text-yellow-800 p-4 mt-60 sm:mt-30 rounded border border-yellow-400">
          <strong>Warning:</strong> This feature is currently under construction.
        </div>
      </div>
    </FormWrapper>
  );
}
