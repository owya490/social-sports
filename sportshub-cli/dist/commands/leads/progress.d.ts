import { LeadStatus } from "../../types/config";
export interface LeadsProgressOptions {
    organiserName?: string;
    ticketNumber?: string;
    status?: LeadStatus;
    file?: string;
}
export declare function leadsProgressCommand(options: LeadsProgressOptions): Promise<void>;
//# sourceMappingURL=progress.d.ts.map