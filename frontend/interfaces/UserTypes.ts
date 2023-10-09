export type UserId = string;

interface AbstractUserData {
    firstName: string;
    surname?: string;
    location?: string;
    contactInformation?: {
        mobile: number;
        email: string;
    };
    activeBookings?: [
        {
            eventId: string;
        }
    ];
}

export interface NewUserData extends AbstractUserData {}

export interface UserData extends AbstractUserData {
    userId: UserId;
}
