import { Tag as TagModel } from "@/interfaces/TagTypes";
import Tag, { ITag } from "./Tag";

interface ITagGroup {
    tags: TagModel[];
}

export function TagGroup(props: ITagGroup) {
    return (
        <>
            {props.tags.map((tag, idx) => {
                return <Tag key={idx} name={tag.name} url={tag.url} />;
            })}
        </>
    );
}
