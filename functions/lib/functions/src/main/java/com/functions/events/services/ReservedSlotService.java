package com.functions.events.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.Attendee;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.events.models.ReservedSlot;
import com.functions.events.repositories.EventsRepository;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Transaction;

import static com.functions.waitlist.repositories.WaitlistRepository.hashEmail;

public class ReservedSlotService {
    private static final Logger logger = LoggerFactory.getLogger(ReservedSlotService.class);

    /**
     * Processes reserved slots for an event: validates, caps to capacity, reduces vacancy, and adds as attendees.
     * All operations happen in one transaction.
     *
     * @param eventId The event ID
     * @param rawReservedSlots The raw reserved slots to process
     * @param transaction The Firestore transaction
     */
    public static void processReservedSlots(String eventId, List<ReservedSlot> rawReservedSlots, Transaction transaction) throws Exception {
        if (rawReservedSlots == null || rawReservedSlots.isEmpty()) {
            return;
        }

        // Read event data and metadata using EventsRepository
        // IMPORTANT: All reads must happen before any writes in Firestore transactions
        Optional<EventData> eventDataOpt = EventsRepository.getEventById(eventId, Optional.of(transaction));
        if (eventDataOpt.isEmpty()) {
            throw new Exception("Event not found for eventId: " + eventId);
        }
        EventData eventData = eventDataOpt.get();
        int currentVacancy = eventData.getVacancy();

        Optional<EventMetadata> eventMetadataOpt = EventsRepository.getEventMetadataById(eventId, Optional.of(transaction));
        if (eventMetadataOpt.isEmpty()) {
            throw new Exception("Event metadata not found for eventId: " + eventId);
        }
        EventMetadata eventMetadata = eventMetadataOpt.get();
        
        // Get the DocumentReference for event metadata before any writes
        // This ensures we can update it later without violating read-before-write rule
        DocumentReference eventMetadataDocRef = EventsRepository.getEventMetadataDocumentReference(eventId);

        // Validate and normalize reserved slots
        List<ReservedSlot> reservedSlots = rawReservedSlots.stream()
                .filter(slot -> slot != null)
                .filter(slot -> slot.getSlots() != null && slot.getSlots() > 0)
                .filter(slot -> slot.getEmail() != null && !slot.getEmail().trim().isEmpty())
                .filter(slot -> slot.getName() != null && !slot.getName().trim().isEmpty())
                .collect(Collectors.toList());

        if (reservedSlots.isEmpty()) {
            return;
        }

        int totalReservedSlots = reservedSlots.stream().mapToInt(ReservedSlot::getSlots).sum();

        // Cap reserved slots to available capacity if needed
        if (totalReservedSlots > currentVacancy) {
            logger.warn("Reserved slots ({}) exceed vacancy ({}). Capping to available capacity.", 
                    totalReservedSlots, currentVacancy);
            reservedSlots = capReservedSlotsToCapacity(reservedSlots, currentVacancy);
            totalReservedSlots = reservedSlots.stream().mapToInt(ReservedSlot::getSlots).sum();
        }

        // Update event vacancy
        int newVacancy = currentVacancy - totalReservedSlots;
        EventsRepository.updateEventById(eventId, "vacancy", newVacancy, transaction);
        logger.info("Reduced vacancy from {} to {} for event {}", currentVacancy, newVacancy, eventId);

        // Add reserved slots as attendees
        Map<String, Purchaser> purchaserMap = eventMetadata.getPurchaserMap();
        if (purchaserMap == null) {
            purchaserMap = new HashMap<>();
        }

        int totalTicketsAdded = 0;
        for (ReservedSlot reservedSlot : reservedSlots) {
            String email = reservedSlot.getEmail().toLowerCase().trim();
            String name = reservedSlot.getName().trim();
            int slots = reservedSlot.getSlots();

            String emailHash = hashEmail(email);

            Attendee attendee = new Attendee();
            attendee.setPhone("");
            attendee.setTicketCount(slots);

            if (purchaserMap.containsKey(emailHash)) {
                Purchaser existingPurchaser = purchaserMap.get(emailHash);
                Map<String, Attendee> attendees = existingPurchaser.getAttendees();
                if (attendees == null) {
                    attendees = new HashMap<>();
                }
                if (attendees.containsKey(name)) {
                    Attendee existingAttendee = attendees.get(name);
                    existingAttendee.setTicketCount(existingAttendee.getTicketCount() + slots);
                } else {
                    attendees.put(name, attendee);
                }
                existingPurchaser.setAttendees(attendees);
                existingPurchaser.setTotalTicketCount(existingPurchaser.getTotalTicketCount() + slots);
            } else {
                Purchaser purchaser = new Purchaser();
                purchaser.setEmail(email);
                Map<String, Attendee> attendees = new HashMap<>();
                attendees.put(name, attendee);
                purchaser.setAttendees(attendees);
                purchaser.setTotalTicketCount(slots);
                purchaserMap.put(emailHash, purchaser);
            }

            totalTicketsAdded += slots;
            logger.info("Added reserved slot as attendee: email={}, name={}, slots={}", email, name, slots);
        }

        // Update event metadata using the pre-fetched DocumentReference
        // This avoids reading again after writes have been performed
        eventMetadata.setPurchaserMap(purchaserMap);
        eventMetadata.setCompleteTicketCount(eventMetadata.getCompleteTicketCount() + totalTicketsAdded);
        EventsRepository.updateEventMetadataByReference(eventMetadataDocRef, eventMetadata, transaction);

        logger.info("Successfully processed {} reserved slots ({} tickets) for event {}", 
                reservedSlots.size(), totalTicketsAdded, eventId);
    }

    /**
     * Caps reserved slots to fit within the available capacity.
     * Processes slots in order, reducing or skipping slots that would exceed capacity.
     */
    public static List<ReservedSlot> capReservedSlotsToCapacity(List<ReservedSlot> reservedSlots, int maxCapacity) {
        List<ReservedSlot> cappedSlots = new ArrayList<>();
        int remainingCapacity = Math.max(0, maxCapacity);

        for (ReservedSlot slot : reservedSlots) {
            if (slot == null || slot.getSlots() == null || slot.getSlots() <= 0) {
                continue;
            }
            
            if (remainingCapacity <= 0) {
                logger.warn("Skipping reserved slot for {} - no capacity remaining", slot.getEmail());
                break;
            }

            int slotsToAdd = Math.min(slot.getSlots(), remainingCapacity);
            if (slotsToAdd < slot.getSlots()) {
                logger.warn("Reducing reserved slots for {} from {} to {} due to capacity limit",
                        slot.getEmail(), slot.getSlots(), slotsToAdd);
            }

            ReservedSlot cappedSlot = new ReservedSlot();
            cappedSlot.setEmail(slot.getEmail());
            cappedSlot.setName(slot.getName());
            cappedSlot.setSlots(slotsToAdd);
            cappedSlots.add(cappedSlot);

            remainingCapacity -= slotsToAdd;
        }

        return cappedSlots;
    }
}
