export type TicketTypeId = string;

export interface TicketTypeData {
    id: string;
    name: string;
    price: number;
    availableQuantity: number;
    soldQuantity: number;
}

export interface TicketTypeCreateRequest {
    eventId: string;
    name: string;
    description?: string;
    price: number;
    availableQuantity: number;
    maxQuantityPerOrder?: number;
    isVisible?: boolean;
    saleStartDate?: Date;
    saleEndDate?: Date;
}

export interface TicketTypeUpdateRequest {
    name?: string;
    description?: string;
    price?: number;
    availableQuantity?: number;
    maxQuantityPerOrder?: number;
    isActive?: boolean;
    isVisible?: boolean;
    saleStartDate?: Date;
    saleEndDate?: Date;
}

export interface TicketAvailability {
    ticketTypeId: TicketTypeId;
    availableQuantity: number;
    isAvailable: boolean;
    reason?: 'sold_out' | 'inactive' | 'sale_not_started' | 'sale_ended' | 'hidden';
}

export interface EventTicketSummary {
    eventId: string;
    totalCapacity: number;
    totalSold: number;
    totalAvailable: number;
    ticketTypes: TicketTypeData[];
    lowestPrice: number;
    highestPrice: number;
}