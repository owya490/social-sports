package com.functions.wrapped.services;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.services.TicketsService;
import com.functions.users.models.UserData;
import com.functions.users.services.Users;
import com.functions.utils.TimeUtils;
import com.functions.wrapped.models.SportshubWrappedData;
import com.functions.wrapped.models.SportshubWrappedData.DateRange;
import com.functions.wrapped.models.SportshubWrappedData.MostPopularEvent;
import com.functions.wrapped.models.SportshubWrappedData.TopAttendee;
import com.functions.wrapped.repositories.WrappedRepository;

/**
 * Service for generating and managing Sportshub Wrapped data.
 * Contains methods to calculate various metrics for an organiser's year in
 * review.
 */
public class WrappedService {
    private static final Logger logger = LoggerFactory.getLogger(WrappedService.class);

    // Average time in minutes to verify a bank transfer booking
    private static final int AVG_MINUTES_PER_BANK_TRANSFER_VERIFICATION = 5;

    // Eventbrite fees: 5.35% + $1.19 per ticket
    private static final double EVENTBRITE_FEE_PERCENTAGE = 0.0535;
    private static final long EVENTBRITE_FEE_PER_TICKET_CENTS = 119L;

    // Sportshub fees: Stripe (1.75% + $0.30) + Sportshub (1.0% of sales)
    private static final double STRIPE_FEE_PERCENTAGE = 0.0175;
    private static final long STRIPE_FEE_PER_TICKET_CENTS = 30L;
    private static final double SPORTSHUB_FEE_PERCENTAGE = 0.01;

    /**
     * Gets or generates wrapped data for an organiser.
     * First checks if cached data exists, otherwise generates fresh data.
     * 
     * If wrappedId is provided (non-null and non-empty), it will be verified against
     * the stored data. This is used for public share links. If verification fails,
     * an exception is thrown.
     *
     * @param organiserId The organiser's user ID
     * @param year        The year for the wrapped data
     * @param wrappedId   Optional wrappedId for verification (null or empty to skip verification)
     * @return The wrapped data
     */
    public static SportshubWrappedData getOrGenerateWrappedData(String organiserId, int year, String wrappedId) throws Exception {
        logger.info("Getting or generating wrapped data for organiserId: {}, year: {}, wrappedId: {}", 
                organiserId, year, wrappedId);

        boolean requiresVerification = wrappedId != null && !wrappedId.isEmpty();

        // Check if we have cached wrapped data
        Optional<SportshubWrappedData> cachedData = WrappedRepository.getWrappedData(organiserId, year);
        
        if (cachedData.isPresent()) {
            SportshubWrappedData data = cachedData.get();
            
            // If wrappedId is provided, verify it matches
            if (requiresVerification) {
                if (!wrappedId.equals(data.getWrappedId())) {
                    logger.warn("wrappedId mismatch for organiserId: {}, year: {}. Expected: {}, Got: {}", 
                            organiserId, year, data.getWrappedId(), wrappedId);
                    throw new RuntimeException("Invalid share link - wrappedId does not match");
                }
                logger.info("wrappedId verified successfully for organiserId: {}, year: {}", organiserId, year);
            }
            
            logger.info("Found cached wrapped data for organiserId: {}, year: {}", organiserId, year);
            return data;
        }

        // If verification is required but no data exists, that's an error
        if (requiresVerification) {
            logger.warn("No wrapped data found for organiserId: {}, year: {} but wrappedId verification was required", 
                    organiserId, year);
            throw new RuntimeException("Wrapped data not found for this organiser");
        }

        // Generate fresh wrapped data (only when no verification is required)
        logger.info("Generating fresh wrapped data for organiserId: {}, year: {}", organiserId, year);
        return generateWrappedData(organiserId, year);
    }

    /**
     * Generates fresh wrapped data for an organiser by calculating all metrics.
     *
     * @param organiserId The organiser's user ID
     * @param year        The year for the wrapped data
     * @return The generated wrapped data
     */
    public static SportshubWrappedData generateWrappedData(String organiserId, int year) throws Exception {
        logger.info("Generating wrapped data for organiserId: {}, year: {}", organiserId, year);

        String wrappedId = UUID.randomUUID().toString();

        UserData userData = Users.getUserDataById(organiserId);

        // Get organiser name
        String organiserName = getOrganiserName(userData);

        // Calculate date range for the year
        DateRange dateRange = calculateDateRange(year);

        List<EventData> eventData = getAllOrganiserEventsInDateRange(userData.getOrganiserEvents(), dateRange);

        Map<String, EventMetadata> eventMetadataMap = getAllOrganiserEventMetadataForEventsInDateRange(eventData);

        // Build the eventOrderTicketMap: Map<EventId, Map<Order, List<Ticket>>>
        Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap = buildEventOrderTicketMap(eventData, eventMetadataMap);

        // Calculate all metrics
        int eventsCreated = calculateEventsCreated(eventData);
        int ticketsSold = calculateTicketsSold(eventOrderTicketMap);
        long totalSales = calculateTotalSales(eventOrderTicketMap);
        int totalEventViews = calculateTotalEventViews(eventData);
        List<TopAttendee> topRegularAttendees = calculateTopRegularAttendees(eventOrderTicketMap);
        MostPopularEvent mostPopularEvent = calculateMostPopularEventByRevenue(eventData, eventOrderTicketMap);
        int minutesSavedBookkeeping = calculateMinutesSavedBookkeeping(ticketsSold);
        long feesSavedVsEventbrite = calculateFeesSavedVsEventbrite(totalSales, ticketsSold);

        SportshubWrappedData wrappedData = new SportshubWrappedData(
                organiserName,
                organiserId,
                year,
                dateRange,
                eventsCreated,
                ticketsSold,
                totalSales,
                totalEventViews,
                topRegularAttendees,
                mostPopularEvent,
                minutesSavedBookkeeping,
                feesSavedVsEventbrite,
                wrappedId);

        // Cache the generated data
        WrappedRepository.saveWrappedData(organiserId, year, wrappedData);

        logger.info("Successfully generated and cached wrapped data for organiserId: {}, year: {}", organiserId, year);
        return wrappedData;
    }

    /**
     * Gets the organiser's display name.
     * 
     * @param organiserId The organiser's user ID
     * @return The organiser's name
     */
    private static String getOrganiserName(UserData userData) {
        return userData.getFirstName();
    }

    /**
     * Calculates the date range for the wrapped data.
     *
     * @param year The year
     * @return The date range
     */
    private static DateRange calculateDateRange(int year) {
        // from start of the year to today
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.now();
        return new DateRange(from.format(DateTimeFormatter.ISO_LOCAL_DATE),
                to.format(DateTimeFormatter.ISO_LOCAL_DATE));
    }

    private static List<EventData> getAllOrganiserEventsInDateRange(List<String> eventIds, DateRange dateRange) {
        return eventIds.stream()
                .map(EventsRepository::getEventById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(event -> TimeUtils.isTimestampInRange(event.getStartDate(), dateRange))
                .toList();
    }

    private static Map<String, EventMetadata> getAllOrganiserEventMetadataForEventsInDateRange(List<EventData> eventData) {
        return eventData.stream()
                .map(EventData::getEventId)
                .collect(Collectors.toMap(Function.identity(), eventId -> EventsRepository.getEventMetadataById(eventId).orElse(null)))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * Builds a map of EventId -> Map<Order, List<Ticket>> for all events.
     * This consolidates all order and ticket data for metric calculations.
     *
     * @param eventData List of event data
     * @param eventMetadata List of event metadata
     * @return Map of EventId -> Map<Order, List<Ticket>>
     */
    private static Map<String, Map<Order, List<Ticket>>> buildEventOrderTicketMap(
            List<EventData> eventData, 
            Map<String, EventMetadata> eventMetadataMap) {
        
        Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap = new HashMap<>();

        for (EventData event : eventData) {
            String eventId = event.getEventId();
            EventMetadata metadata = eventMetadataMap.get(eventId);
            
            if (metadata != null && metadata.getOrderIds() != null && !metadata.getOrderIds().isEmpty()) {
                Map<Order, List<Ticket>> orderTicketsMap = TicketsService.getOrdersAndTickets(metadata.getOrderIds());
                eventOrderTicketMap.put(eventId, orderTicketsMap);
            }
        }

        logger.info("Built eventOrderTicketMap for {} events", eventOrderTicketMap.size());
        return eventOrderTicketMap;
    }

    /**
     * Calculates the number of events created by the organiser in the given year.
     * @param eventData The list of event data
     * @return The number of events created
     */
    private static int calculateEventsCreated(List<EventData> eventData) {
        return eventData.size();
    }

    /**
     * Calculates the total number of tickets sold across all events.
     *
     * @param eventOrderTicketMap Map of EventId -> Map<Order, List<Ticket>>
     * @return The total tickets sold
     */
    private static int calculateTicketsSold(Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap) {
        return eventOrderTicketMap.values().stream()
                .map(TicketsService::calculateTotalTicketCount)
                .reduce(0, Integer::sum);
    }

    /**
     * Calculates the total sales volume in cents for the given year.
     * Source: call Stripe API to calculate total volume
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The total sales in cents
     */
    private static long calculateTotalSales(Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap) {
        return eventOrderTicketMap.values().stream()
                .map(TicketsService::calculateNetSales)
                .reduce(0L, Long::sum);
    }

    /**
     * Calculates the total event views across all events in the given year.
     * Source: add all event view counts
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The total event views
     */
    private static int calculateTotalEventViews(List<EventData> eventData) {
        return eventData.stream()
                .map(EventData::getAccessCount)
                .reduce(0, Integer::sum);
    }

    /**
     * Calculates the top 5 regular attendees for the organiser's events.
     * Groups by email and uses the most frequently appearing fullName for each email.
     *
     * @param eventOrderTicketMap Map of EventId -> Map<Order, List<Ticket>>
     * @return List of top 5 attendees sorted by ticket count descending
     */
    private static List<TopAttendee> calculateTopRegularAttendees(
            Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap) {
        
        // Map of email -> (Map of fullName -> count, total tickets)
        Map<String, AttendeeData> attendeeMap = new HashMap<>();

        for (Map<Order, List<Ticket>> orderTicketsMap : eventOrderTicketMap.values()) {
            for (Order order : orderTicketsMap.keySet()) {
                String email = order.getEmail();
                if (email == null || email.isEmpty()) {
                    continue;
                }

                String fullName = order.getFullName();
                int ticketCount = order.getTickets().size();

                AttendeeData data = attendeeMap.computeIfAbsent(email, k -> new AttendeeData());
                data.totalTickets += ticketCount;
                data.nameFrequency.merge(fullName, 1, Integer::sum);
            }
        }

        // Convert to TopAttendee list and sort by ticket count
        return attendeeMap.entrySet().stream()
                .map(entry -> {
                    String email = entry.getKey();
                    AttendeeData data = entry.getValue();
                    // Get the most frequent name
                    String mostFrequentName = data.nameFrequency.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("Unknown");
                    return new TopAttendee(mostFrequentName, email, data.totalTickets);
                })
                .sorted((a, b) -> Integer.compare(b.getAttendanceCount(), a.getAttendanceCount()))
                .limit(5)
                .toList();
    }

    /**
     * Helper class to track attendee data during calculation.
     */
    private static class AttendeeData {
        int totalTickets = 0;
        Map<String, Integer> nameFrequency = new HashMap<>();
    }

    /**
     * Finds the most popular event based on view count.
     * Source: find the event with the most views
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The most popular event details
     */
    private static MostPopularEvent calculateMostPopularEventByRevenue(List<EventData> eventData, Map<String, Map<Order, List<Ticket>>> eventOrderTicketMap) {
        MostPopularEvent mostPopularEvent = new MostPopularEvent("", "", "", 0, 0L);

        for (EventData event : eventData) {
            String eventId = event.getEventId();
            Map<Order, List<Ticket>> orderTicketsMap = eventOrderTicketMap.getOrDefault(eventId, Map.of());
            long revenue = TicketsService.calculateNetSales(orderTicketsMap);
            if (revenue > mostPopularEvent.getRevenue()) {
                mostPopularEvent = new MostPopularEvent(eventId, event.getImage(), event.getName(), event.getAccessCount(), revenue);
            }
        }
        return mostPopularEvent;
    }

    /**
     * Calculates the estimated minutes saved on bookkeeping.
     * Source: find average time to check bank transfer and verify booking, multiply
     * by tickets sold
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @param ticketsSold The number of tickets sold (used in calculation)
     * @return The estimated minutes saved
     */
    private static int calculateMinutesSavedBookkeeping(int ticketsSold) {
        return ticketsSold * AVG_MINUTES_PER_BANK_TRANSFER_VERIFICATION;
    }

    /**
     * Calculates the fees saved compared to using Eventbrite.
     * Source: calculate total volume and compare Eventbrite fees vs Sportshub fees
     *
     * @param totalSales  The total sales volume in cents
     * @param ticketsSold The number of tickets sold
     * @return The fees saved in cents
     */
    private static long calculateFeesSavedVsEventbrite(long totalSales, int ticketsSold) {
        // Eventbrite: 5.35% of sales + $1.19 per ticket
        long eventbriteFees = Math.round(totalSales * EVENTBRITE_FEE_PERCENTAGE) 
                + (ticketsSold * EVENTBRITE_FEE_PER_TICKET_CENTS);
        
        // Sportshub: Stripe (1.75% + $0.30/ticket) + Sportshub (1.0% of sales)
        long sportshubFees = Math.round(totalSales * STRIPE_FEE_PERCENTAGE) 
                + (ticketsSold * STRIPE_FEE_PER_TICKET_CENTS) 
                + Math.round(totalSales * SPORTSHUB_FEE_PERCENTAGE);
        
        return eventbriteFees - sportshubFees;
    }

    /**
     * Forces regeneration of wrapped data, bypassing the cache.
     *
     * @param organiserId The organiser's user ID
     * @param year        The year for the wrapped data
     * @return The freshly generated wrapped data
     */
    public static SportshubWrappedData regenerateWrappedData(String organiserId, int year) throws Exception {
        logger.info("Force regenerating wrapped data for organiserId: {}, year: {}", organiserId, year);
        // Generate fresh data (saveWrappedData will overwrite any existing data)
        return generateWrappedData(organiserId, year);
    }

}
