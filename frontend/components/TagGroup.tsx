import Tag, { ITag } from "./Tag";

interface ITagGroup {
  tags: ITag[];
}

export function TagGroup(props: ITagGroup) {
  return (
    <>
      {props.tags.map((tag) => {
        return <Tag label={tag.label} url={tag.url} />;
      })}
    </>
  );
}
