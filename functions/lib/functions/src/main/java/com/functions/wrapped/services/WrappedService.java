package com.functions.wrapped.services;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.repositories.EventsRepository;
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

    // Eventbrite fee percentage (approximately 6.95% + $0.99 per ticket)
    private static final double EVENTBRITE_FEE_PERCENTAGE = 0.0695;
    private static final int EVENTBRITE_FEE_PER_TICKET_CENTS = 99;

    // Sportshub fee percentage
    private static final double SPORTSHUB_FEE_PERCENTAGE = 0.029; // 2.9% Stripe fee

    /**
     * Gets or generates wrapped data for an organiser.
     * First checks if cached data exists, otherwise generates fresh data.
     *
     * @param organiserId The organiser's user ID
     * @param year        The year for the wrapped data
     * @return The wrapped data
     */
    public static SportshubWrappedData getOrGenerateWrappedData(String organiserId, int year) throws Exception {
        logger.info("Getting or generating wrapped data for organiserId: {}, year: {}", organiserId, year);

        // Check if we have cached wrapped data
        Optional<SportshubWrappedData> cachedData = WrappedRepository.getWrappedData(organiserId, year);
        if (cachedData.isPresent()) {
            logger.info("Found cached wrapped data for organiserId: {}, year: {}", organiserId, year);
            return cachedData.get();
        }

        // Generate fresh wrapped data
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

        List<EventMetadata> eventMetadata = getAllOrganiserEventMetadataForEventsInDateRange(eventData);
        
        // Calculate all metrics
        int eventsCreated = calculateEventsCreated(eventData);


        // get the list of orders and tickets and store it in a map
        // Map<EventId, Map<OrderId, List<TicketId>>>

        int ticketsSold = calculateTicketsSold(eventMetadata);
        long totalSales = calculateTotalSales(organiserId, year, dateRange);
        int totalEventViews = calculateTotalEventViews(organiserId, year, dateRange);
        List<TopAttendee> topRegularAttendees = calculateTopRegularAttendees(organiserId, year, dateRange);
        MostPopularEvent mostPopularEvent = calculateMostPopularEvent(organiserId, year, dateRange);
        int minutesSavedBookkeeping = calculateMinutesSavedBookkeeping(organiserId, year, ticketsSold, dateRange);
        long feesSavedVsEventbrite = calculateFeesSavedVsEventbrite(totalSales, ticketsSold, dateRange);

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

    private static List<EventMetadata> getAllOrganiserEventMetadataForEventsInDateRange(List<EventData> eventData) {
        return eventData.stream()
                .map(EventData::getEventId)
                .map(EventsRepository::getEventMetadataById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
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
     * Calculates the total number of tickets sold across all events in the given
     * year.
     * Source: iterate through all events metadata and add up completed ticket count
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The total tickets sold
     */
    private static int calculateTicketsSold(String organiserId, int year, DateRange dateRange) {
        // TODO: Implement
        // - Get all events for the organiser in the year
        // - For each event, get the EventMetadata
        // - Sum up completeTicketCount from each event's metadata
        logger.info("STUB: calculateTicketsSold for organiserId: {}, year: {}", organiserId, year);
        return 0;
    }

    /**
     * Calculates the total sales volume in cents for the given year.
     * Source: call Stripe API to calculate total volume
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The total sales in cents
     */
    private static long calculateTotalSales(String organiserId, int year, DateRange dateRange) {
        // TODO: Implement
        // - Get organiser's Stripe account ID from private user data
        // - Call Stripe API to get balance transactions for the year
        // - Sum up the gross amounts
        logger.info("STUB: calculateTotalSales for organiserId: {}, year: {}", organiserId, year);
        return 0L;
    }

    /**
     * Calculates the total event views across all events in the given year.
     * Source: add all event view counts
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The total event views
     */
    private static int calculateTotalEventViews(String organiserId, int year, DateRange dateRange) {
        // TODO: Implement
        // - Get all events for the organiser in the year
        // - For each event, get the view count
        // - Sum up all view counts
        logger.info("STUB: calculateTotalEventViews for organiserId: {}, year: {}", organiserId, year);
        return 0;
    }

    /**
     * Calculates the top 5 regular attendees for the organiser's events.
     * Source: keep a map of all attendees by iterating through orders to see how
     * many tickets they bought
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return List of top 5 attendees with their attendance counts
     */
    private static List<TopAttendee> calculateTopRegularAttendees(String organiserId, int year, DateRange dateRange) {
        // TODO: Implement
        // - Get all events for the organiser in the year
        // - For each event, iterate through the orders/purchaserMap in metadata
        // - Build a map of attendee email -> (name, total ticket count)
        // - Sort by ticket count descending
        // - Return top 5
        logger.info("STUB: calculateTopRegularAttendees for organiserId: {}, year: {}", organiserId, year);
        return List.of();
    }

    /**
     * Finds the most popular event based on view count.
     * Source: find the event with the most views
     *
     * @param organiserId The organiser's user ID
     * @param year        The year to calculate for
     * @return The most popular event details
     */
    private static MostPopularEvent calculateMostPopularEvent(String organiserId, int year, DateRange dateRange) {
        // TODO: Implement
        // - Get all events for the organiser in the year
        // - Find the event with the highest view count
        // - Get the event's details (name, image, attendance from metadata, revenue)
        // - Return MostPopularEvent record
        logger.info("STUB: calculateMostPopularEvent for organiserId: {}, year: {}", organiserId, year);
        return new MostPopularEvent("", "", "No events", 0, 0L);
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
    private static int calculateMinutesSavedBookkeeping(String organiserId, int year, int ticketsSold,
            DateRange dateRange) {
        // TODO: Implement
        // - Calculate based on average time to verify bank transfers
        // - Multiply by number of tickets that would have required manual verification
        // - For now, estimate that ~20% of tickets would be bank transfers
        logger.info("STUB: calculateMinutesSavedBookkeeping for organiserId: {}, year: {}", organiserId, year);

        // Estimate: 20% of tickets would be bank transfers, each taking
        // AVG_MINUTES_PER_BANK_TRANSFER_VERIFICATION minutes
        int estimatedBankTransfers = (int) (ticketsSold * 0.2);
        return estimatedBankTransfers * AVG_MINUTES_PER_BANK_TRANSFER_VERIFICATION;
    }

    /**
     * Calculates the fees saved compared to using Eventbrite.
     * Source: calculate total volume and compare Eventbrite fees vs Sportshub fees
     *
     * @param totalSales  The total sales volume in cents
     * @param ticketsSold The number of tickets sold
     * @return The fees saved in cents
     */
    private static long calculateFeesSavedVsEventbrite(long totalSales, int ticketsSold, DateRange dateRange) {
        // TODO: Implement with actual fee structures
        // Eventbrite fees: ~6.95% + $0.99 per ticket
        // Sportshub fees: ~2.9% (Stripe)
        logger.info("STUB: calculateFeesSavedVsEventbrite for totalSales: {}, ticketsSold: {}", totalSales,
                ticketsSold);

        // Calculate Eventbrite fees
        long eventbriteFees = (long) (totalSales * EVENTBRITE_FEE_PERCENTAGE) +
                ((long) ticketsSold * EVENTBRITE_FEE_PER_TICKET_CENTS);

        // Calculate Sportshub fees (just Stripe processing)
        long sportshubFees = (long) (totalSales * SPORTSHUB_FEE_PERCENTAGE);

        // Return the difference
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

        // Delete existing cached data if any
        if (WrappedRepository.wrappedDataExists(organiserId, year)) {
            WrappedRepository.deleteWrappedData(organiserId, year);
        }

        // Generate fresh data
        return generateWrappedData(organiserId, year);
    }
}
