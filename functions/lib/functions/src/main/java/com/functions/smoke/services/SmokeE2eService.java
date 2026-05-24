package com.functions.smoke.services;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.AbstractEventData.AttendeesMetadata;
import com.functions.events.models.Attendee;
import com.functions.events.models.EventData;
import com.functions.events.models.EventMetadata;
import com.functions.events.models.Purchaser;
import com.functions.events.repositories.EventsRepository;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.handlers.Global;
import com.functions.smoke.models.SmokeRunResponse;
import com.functions.tickets.models.Order;
import com.functions.tickets.models.Ticket;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.LoadState;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

public class SmokeE2eService {
    private static final Logger logger = LoggerFactory.getLogger(SmokeE2eService.class);

    private static final String DEFAULT_BASE_URL = "https://www.sportshub.net.au";
    private static final long DEFAULT_HOME_TIMEOUT_MS = 10_000L;
    private static final long DEFAULT_VERIFY_TIMEOUT_MS = 90_000L;
    private static final long ORDER_POLL_INTERVAL_MS = 2_000L;

    public SmokeRunResponse run() {
        Instant startedAt = Instant.now();
        String runId = UUID.randomUUID().toString();
        String runMarker = "SMOKE_" + runId;

        SmokeRunResponse response = new SmokeRunResponse();
        response.runId = runId;
        response.runMarker = runMarker;
        response.status = "FAILED";
        response.cleanupStatus = "NOT_STARTED";
        response.failedStep = "INIT";

        String baseUrl = getEnvOrDefault("BASE_URL", DEFAULT_BASE_URL);
        String sentinelEventUrl = resolveSentinelEventUrl(baseUrl);
        long homeTimeoutMs = getLongEnvOrDefault("HOME_LOAD_TIMEOUT_MS", DEFAULT_HOME_TIMEOUT_MS);
        long verifyTimeoutMs = getLongEnvOrDefault("ORDER_VERIFY_TIMEOUT_MS", DEFAULT_VERIFY_TIMEOUT_MS);
        boolean headless = getBooleanEnvOrDefault("PLAYWRIGHT_HEADLESS", true);

        Order locatedOrder = null;
        String sentinelEventId = extractEventId(sentinelEventUrl);

        try {
            response.failedStep = "HOME_LOAD";
            response.homeLoadMs = runBrowserFlowAndMeasureHomeLoad(
                    baseUrl,
                    sentinelEventUrl,
                    runMarker,
                    runMarker.toLowerCase(Locale.ROOT) + "@smoke.sportshub.invalid",
                    headless,
                    homeTimeoutMs);

            response.failedStep = "ORDER_VERIFY";
            locatedOrder = waitForOrderByRunMarker(runMarker, verifyTimeoutMs);
            response.orderId = locatedOrder.getOrderId();

            List<Ticket> orderTickets = TicketsRepository.getTicketsByIds(locatedOrder.getTickets());
            boolean tiedToSentinel = orderTickets.stream().anyMatch(t -> sentinelEventId.equals(t.getEventId()));
            if (!tiedToSentinel) {
                throw new IllegalStateException("Order found but not tied to sentinel event. orderId=" + response.orderId);
            }

            response.status = "PASSED";
            response.failedStep = "";
        } catch (Exception e) {
            response.error = e.getMessage();
            logger.error("Smoke run failed. runId={}, runMarker={}", runId, runMarker, e);
        } finally {
            response.cleanupStatus = cleanupRunArtifacts(runMarker, Optional.ofNullable(locatedOrder));
            response.durationMs = Duration.between(startedAt, Instant.now()).toMillis();
        }

        return response;
    }

    private static Long runBrowserFlowAndMeasureHomeLoad(
            String baseUrl,
            String sentinelEventUrl,
            String runMarker,
            String email,
            boolean headless,
            long homeTimeoutMs) {
        Instant homeStart = Instant.now();

        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(headless));
            Page page = browser.newPage();
            page.setDefaultTimeout(15_000);
            page.setDefaultNavigationTimeout(Math.max(homeTimeoutMs, 15_000));

            page.navigate(baseUrl);
            page.waitForLoadState(LoadState.NETWORKIDLE);
            long homeLoadMs = Duration.between(homeStart, Instant.now()).toMillis();
            if (homeLoadMs > homeTimeoutMs) {
                throw new IllegalStateException("Home page load exceeded timeout: " + homeLoadMs + "ms > " + homeTimeoutMs + "ms");
            }

            page.navigate(sentinelEventUrl);
            page.waitForLoadState(LoadState.DOMCONTENTLOADED);
            page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Book Now"))
                    .first()
                    .click();

            fillCheckoutDetails(page, runMarker, email);
            submitCheckout(page);

            browser.close();
            return homeLoadMs;
        }
    }

    private static void fillCheckoutDetails(Page page, String runMarker, String email) {
        tryFill(page, List.of(
                page.getByLabel("Full name"),
                page.getByLabel("Name"),
                page.getByPlaceholder("Full name"),
                page.getByPlaceholder("Name")));
        tryFillValue(page, runMarker, List.of(
                page.getByLabel("Full name"),
                page.getByLabel("Name"),
                page.getByPlaceholder("Full name"),
                page.getByPlaceholder("Name")));

        tryFillValue(page, email, List.of(
                page.getByLabel("Email"),
                page.getByPlaceholder("Email"),
                page.locator("input[type='email']")));

        tryFillValue(page, "0400000000", List.of(
                page.getByLabel("Phone"),
                page.getByLabel("Phone number"),
                page.getByPlaceholder("Phone"),
                page.locator("input[type='tel']")));
    }

    private static void submitCheckout(Page page) {
        List<Locator> submitCandidates = List.of(
                page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                        new Page.GetByRoleOptions().setName("Pay")),
                page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                        new Page.GetByRoleOptions().setName("Complete")),
                page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                        new Page.GetByRoleOptions().setName("Book")),
                page.getByRole(com.microsoft.playwright.options.AriaRole.BUTTON,
                        new Page.GetByRoleOptions().setName("Submit"))
        );

        for (Locator candidate : submitCandidates) {
            if (candidate.count() > 0) {
                candidate.first().click();
                return;
            }
        }
        throw new IllegalStateException("Unable to find checkout submit button.");
    }

    private static void tryFill(Page page, List<Locator> candidates) {
        for (Locator candidate : candidates) {
            if (candidate.count() > 0 && candidate.first().isVisible()) {
                return;
            }
        }
    }

    private static void tryFillValue(Page page, String value, List<Locator> candidates) {
        for (Locator candidate : candidates) {
            if (candidate.count() == 0) {
                continue;
            }
            Locator first = candidate.first();
            if (!first.isVisible()) {
                continue;
            }
            try {
                first.fill(value);
                return;
            } catch (Exception ignored) {
                // Try the next locator candidate.
            }
        }
    }

    private static Order waitForOrderByRunMarker(String runMarker, long verifyTimeoutMs) throws InterruptedException {
        long deadline = System.currentTimeMillis() + verifyTimeoutMs;
        Order mostRecent = null;

        while (System.currentTimeMillis() < deadline) {
            Optional<Order> maybeOrder = OrdersRepository.getMostRecentOrderByFullName(runMarker);
            if (maybeOrder.isPresent()) {
                mostRecent = maybeOrder.get();
                break;
            }
            TimeUnit.MILLISECONDS.sleep(ORDER_POLL_INTERVAL_MS);
        }

        if (mostRecent == null) {
            throw new IllegalStateException("Could not locate order for run marker within timeout: " + runMarker);
        }
        return mostRecent;
    }

    private static String cleanupRunArtifacts(String runMarker, Optional<Order> locatedOrder) {
        try {
            Optional<Order> orderToCleanup = locatedOrder.isPresent()
                    ? locatedOrder
                    : OrdersRepository.getMostRecentOrderByFullName(runMarker);

            if (orderToCleanup.isEmpty()) {
                return "SKIPPED_NO_ORDER";
            }

            hardDeleteOrderAndRelatedData(orderToCleanup.get());
            return "SUCCESS";
        } catch (Exception e) {
            logger.error("Cleanup failed for runMarker={}", runMarker, e);
            return "FAILED";
        }
    }

    private static void hardDeleteOrderAndRelatedData(Order order) throws Exception {
        FirebaseService.createFirestoreTransaction((Transaction transaction) -> {
            Optional<Order> latestOrder = OrdersRepository.getOrderById(order.getOrderId(), Optional.of(transaction));
            if (latestOrder.isEmpty()) {
                return "already-deleted";
            }

            Order existingOrder = latestOrder.get();
            List<Ticket> tickets = TicketsRepository.getTicketsByIds(existingOrder.getTickets(), Optional.of(transaction));
            if (tickets.isEmpty()) {
                OrdersRepository.deleteOrderById(existingOrder.getOrderId(), Optional.of(transaction));
                return "order-only-deleted";
            }

            String eventId = tickets.get(0).getEventId();
            DocumentReference eventRef = EventsRepository.getEventDocumentReferenceInTransaction(eventId, transaction);
            DocumentSnapshot eventSnapshot = transaction.get(eventRef).get();
            EventData eventData = eventSnapshot.exists() ? eventSnapshot.toObject(EventData.class) : null;

            DocumentReference metadataRef = EventsRepository.getEventMetadataDocumentReference(eventId);
            DocumentSnapshot metadataSnapshot = transaction.get(metadataRef).get();
            EventMetadata eventMetadata = metadataSnapshot.exists() ? metadataSnapshot.toObject(EventMetadata.class) : null;

            int ticketCount = tickets.size();

            // Reads complete; start writes.
            for (Ticket ticket : tickets) {
                TicketsRepository.deleteTicketById(ticket.getTicketId(), Optional.of(transaction));
            }
            OrdersRepository.deleteOrderById(existingOrder.getOrderId(), Optional.of(transaction));

            if (eventData != null) {
                int currentVacancy = eventData.getVacancy() == null ? 0 : eventData.getVacancy();
                eventData.setVacancy(currentVacancy + ticketCount);

                Map<String, Integer> attendees = new HashMap<>(
                        eventData.getAttendees() == null ? Map.of() : eventData.getAttendees());
                String email = existingOrder.getEmail();
                if (email != null && attendees.containsKey(email)) {
                    int next = attendees.get(email) - ticketCount;
                    if (next <= 0) {
                        attendees.remove(email);
                    } else {
                        attendees.put(email, next);
                    }
                }
                eventData.setAttendees(attendees);

                Map<String, AttendeesMetadata> attendeesMetadata = new HashMap<>(
                        eventData.getAttendeesMetadata() == null ? Map.of() : eventData.getAttendeesMetadata());
                if (email != null && attendeesMetadata.containsKey(email)) {
                    AttendeesMetadata metadata = attendeesMetadata.get(email);
                    if (metadata != null) {
                        if (metadata.getNames() != null) {
                            metadata.getNames().remove(existingOrder.getFullName());
                        }
                        if (metadata.getPhones() != null) {
                            metadata.getPhones().remove(existingOrder.getPhone());
                        }
                        boolean namesEmpty = metadata.getNames() == null || metadata.getNames().isEmpty();
                        boolean phonesEmpty = metadata.getPhones() == null || metadata.getPhones().isEmpty();
                        if (namesEmpty && phonesEmpty) {
                            attendeesMetadata.remove(email);
                        } else {
                            attendeesMetadata.put(email, metadata);
                        }
                    }
                }
                eventData.setAttendeesMetadata(attendeesMetadata);

                EventsRepository.updateEventByReference(eventRef, "vacancy", eventData.getVacancy(), transaction);
                EventsRepository.updateEventByReference(eventRef, "attendees", eventData.getAttendees(), transaction);
                EventsRepository.updateEventByReference(eventRef, "attendeesMetadata", eventData.getAttendeesMetadata(), transaction);
            }

            if (eventMetadata != null) {
                List<String> orderIds = eventMetadata.getOrderIds() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(eventMetadata.getOrderIds());
                orderIds.remove(existingOrder.getOrderId());
                eventMetadata.setOrderIds(orderIds);

                int completeTicketCount = eventMetadata.getCompleteTicketCount() == null
                        ? 0
                        : eventMetadata.getCompleteTicketCount();
                eventMetadata.setCompleteTicketCount(Math.max(0, completeTicketCount - ticketCount));

                Map<String, Purchaser> purchaserMap = eventMetadata.getPurchaserMap();
                if (purchaserMap != null && existingOrder.getEmail() != null) {
                    Purchaser purchaser = purchaserMap.get(existingOrder.getEmail());
                    if (purchaser != null) {
                        int purchaserTotal = purchaser.getTotalTicketCount() == null ? 0 : purchaser.getTotalTicketCount();
                        purchaser.setTotalTicketCount(Math.max(0, purchaserTotal - ticketCount));

                        Map<String, Attendee> purchaserAttendees = purchaser.getAttendees();
                        if (purchaserAttendees != null && existingOrder.getFullName() != null) {
                            Attendee attendee = purchaserAttendees.get(existingOrder.getFullName());
                            if (attendee != null) {
                                int current = attendee.getTicketCount() == null ? 0 : attendee.getTicketCount();
                                int next = current - ticketCount;
                                if (next <= 0) {
                                    purchaserAttendees.remove(existingOrder.getFullName());
                                } else {
                                    attendee.setTicketCount(next);
                                    purchaserAttendees.put(existingOrder.getFullName(), attendee);
                                }
                            }
                            if (purchaserAttendees.isEmpty()) {
                                purchaserMap.remove(existingOrder.getEmail());
                            } else {
                                purchaser.setAttendees(purchaserAttendees);
                                purchaserMap.put(existingOrder.getEmail(), purchaser);
                            }
                        }
                    }
                    eventMetadata.setPurchaserMap(purchaserMap);
                }

                EventsRepository.updateEventMetadataByReference(metadataRef, eventMetadata, transaction);
            }

            return "deleted";
        });
    }

    private static String resolveSentinelEventUrl(String baseUrl) {
        String explicitUrl = Global.getEnv("SENTINEL_EVENT_URL");
        if (explicitUrl != null && !explicitUrl.isBlank()) {
            return explicitUrl;
        }

        String sentinelEventId = Global.getEnv("SENTINEL_EVENT_ID");
        if (sentinelEventId == null || sentinelEventId.isBlank()) {
            throw new IllegalArgumentException("Either SENTINEL_EVENT_URL or SENTINEL_EVENT_ID must be set.");
        }

        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalizedBase + "/event/" + sentinelEventId;
    }

    private static String extractEventId(String sentinelEventUrl) {
        URI uri = URI.create(sentinelEventUrl);
        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Invalid sentinel event URL path: " + sentinelEventUrl);
        }

        String[] segments = path.split("/");
        for (int i = 0; i < segments.length; i++) {
            if ("event".equals(segments[i]) && i + 1 < segments.length && !segments[i + 1].isBlank()) {
                return segments[i + 1];
            }
        }
        throw new IllegalArgumentException("Could not parse event id from sentinel URL: " + sentinelEventUrl);
    }

    private static String getEnvOrDefault(String key, String fallback) {
        String value = Global.getEnv(key);
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }

    private static long getLongEnvOrDefault(String key, long fallback) {
        String value = Global.getEnv(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static boolean getBooleanEnvOrDefault(String key, boolean fallback) {
        String value = Global.getEnv(key);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return Boolean.parseBoolean(value.trim());
    }
}
