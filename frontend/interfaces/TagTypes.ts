import { Branded } from "./index";

export type TagId = Branded<string, "TagId">;

export interface Tag {
    id: TagId;
    name: string;
    url: string;
}
