import { Tag as TagModel } from "@/interfaces/TagTypes";
import Tag from "./Tag";

interface TagGroupProps {
  tags: TagModel[];
  size?: "sm" | "md" | "lg";
  spacing?: boolean;
}

export function TagGroup(props: TagGroupProps) {
  return (
    <>
      {props.tags.map((tag, idx) => {
        return (
          <Tag
            key={idx}
            name={tag.name}
            url={tag.url}
            size={props.size ? props.size : "md"}
            spacing={props.spacing}
          />
        );
      })}
    </>
  );
}
