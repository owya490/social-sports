export type EventId = string;

interface AbstractEventData {
    startDate?: Date;
    endDate?: Date;
    location?: string; // Assuming "address" is a string
    capacity?: number;
    vacancy?: number;
    price?: number;
    registrationDeadline?: Date;
    organiserId?: string;
    name: string;
    nameTokens?: string[];
    description?: string; // Assuming "rich text field" is a string
    image?: string; // Assuming you store the image URL or path as a string
    eventTags?: string[]; // Assuming "list of tags" is an array of strings
    isActive?: boolean;
    attendees?: { email: string }[];
}

export interface NewEventData extends AbstractEventData {}

export interface EventData extends AbstractEventData {
    eventId: EventId;
}
