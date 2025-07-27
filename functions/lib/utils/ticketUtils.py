from google.cloud import firestore
from google.cloud.firestore import Transaction
from typing import Dict, List, Optional
import logging

db = firestore.Client()

class TicketType:
    def __init__(self, id: str, name: str, price: int, available_quantity: int, sold_quantity: int):
        self.id = id
        self.name = name
        self.price = price
        self.available_quantity = available_quantity
        self.sold_quantity = sold_quantity
    
    @property
    def remaining_quantity(self) -> int:
        return max(0, self.available_quantity - self.sold_quantity)
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "availableQuantity": self.available_quantity,
            "soldQuantity": self.sold_quantity
        }

def get_ticket_types_for_event(transaction: Transaction, event_ref, logger: logging.Logger) -> List[TicketType]:
    """Get all ticket types for a given event"""
    try:
        ticket_types_collection = event_ref.collection("TicketTypes")
        ticket_types_docs = ticket_types_collection.get(transaction=transaction)
        
        ticket_types = []
        for doc in ticket_types_docs:
            data = doc.data()
            ticket_type = TicketType(
                id=data.get("id"),
                name=data.get("name"),
                price=data.get("price"),
                available_quantity=data.get("availableQuantity", 0),
                sold_quantity=data.get("soldQuantity", 0)
            )
            ticket_types.append(ticket_type)
        
        logger.info(f"Retrieved {len(ticket_types)} ticket types for event {event_ref.path}")
        return ticket_types
    except Exception as e:
        logger.error(f"Failed to get ticket types for event {event_ref.path}: {e}")
        return []

def get_total_available_tickets(ticket_types: List[TicketType]) -> int:
    """Calculate total available tickets across all ticket types"""
    return sum(tt.remaining_quantity for tt in ticket_types)

def get_general_ticket_type(ticket_types: List[TicketType]) -> Optional[TicketType]:
    """Get the 'General' ticket type, fallback to lowest priced ticket"""
    # First try to find 'General' ticket type
    for tt in ticket_types:
        if tt.name.lower() == "general":
            return tt
    
    # Fallback to lowest priced ticket with availability
    available_tickets = [tt for tt in ticket_types if tt.remaining_quantity > 0]
    if not available_tickets:
        return None
    
    return min(available_tickets, key=lambda tt: tt.price)

def update_ticket_type_sold_quantity(transaction: Transaction, event_ref, ticket_type_id: str, quantity_change: int, logger: logging.Logger):
    """Update the sold quantity for a specific ticket type and sync event-level vacancy"""
    try:
        ticket_type_ref = event_ref.collection("TicketTypes").document(ticket_type_id)
        transaction.update(ticket_type_ref, {
            "soldQuantity": firestore.Increment(quantity_change)
        })
        
        # Only sync event vacancy for General tickets (paid customer tickets)
        # Admin tickets don't affect vacancy since they have infinite quantity
        if ticket_type_id == "General":
            # Negative quantity_change means we're reducing sold tickets (increasing vacancy)
            transaction.update(event_ref, {
                "vacancy": firestore.Increment(-quantity_change)
            })
            logger.info(f"Updated General ticket sold quantity by {quantity_change} and synced event vacancy")
        else:
            logger.info(f"Updated {ticket_type_id} ticket sold quantity by {quantity_change} (no vacancy sync)")
            
    except Exception as e:
        logger.error(f"Failed to update ticket type sold quantity: {e}")
        raise e

def reduce_general_ticket_availability(transaction: Transaction, event_ref, quantity: int, logger: logging.Logger):
    """
    Reduce General ticket availability when organizer manually adds people.
    This is used when organizers add attendees without payment (using Admin tickets conceptually,
    but reducing the general pool so total event capacity is respected).
    """
    try:
        general_ticket_ref = event_ref.collection("TicketTypes").document("General")
        transaction.update(general_ticket_ref, {
            "availableQuantity": firestore.Increment(-quantity)
        })
        
        # Also reduce event vacancy since total capacity is reduced
        transaction.update(event_ref, {
            "vacancy": firestore.Increment(-quantity)
        })
        
        logger.info(f"Reduced General ticket availability by {quantity} for organizer addition and synced event vacancy")
    except Exception as e:
        logger.error(f"Failed to reduce general ticket availability: {e}")
        raise e

def reserve_tickets(transaction: Transaction, event_ref, quantity: int, logger: logging.Logger) -> Optional[TicketType]:
    """
    Reserve tickets by finding the appropriate ticket type and updating its sold quantity.
    Returns the ticket type used for the reservation.
    """
    ticket_types = get_ticket_types_for_event(transaction, event_ref, logger)
    
    if not ticket_types:
        logger.warning(f"No ticket types found for event {event_ref.path}")
        return None
    
    total_available = get_total_available_tickets(ticket_types)
    if total_available < quantity:
        logger.warning(f"Not enough tickets available. Requested: {quantity}, Available: {total_available}")
        return None
    
    # Use the general ticket type for reservations
    general_ticket = get_general_ticket_type(ticket_types)
    if not general_ticket or general_ticket.remaining_quantity < quantity:
        logger.warning(f"General ticket type doesn't have enough availability. Requested: {quantity}, Available: {general_ticket.remaining_quantity if general_ticket else 0}")
        return None
    
    # Reserve the tickets
    update_ticket_type_sold_quantity(transaction, event_ref, general_ticket.id, quantity, logger)
    return general_ticket 