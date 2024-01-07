import { Tag as TagModel } from "@/interfaces/TagTypes";
import Tag from "./Tag";

interface ITagGroup {
  tags: TagModel[];
  size?: "sm" | "md" | "lg";
}

export function TagGroup(props: ITagGroup) {
  return (
    <>
      {props.tags.map((tag, idx) => {
        return (
          <Tag
            key={idx}
            name={tag.name}
            url={tag.url}
            size={props.size ? props.size : "md"}
          />
        );
      })}
    </>
  );
}
