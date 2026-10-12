package com.functions.events.utils;

import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.AbstractEventData;
import com.functions.utils.TimeUtils;
import com.google.cloud.Timestamp;

import net.iakovlev.timeshape.TimeZoneEngine;

/**
 * Venue zone for recurring events. Coordinates win over a stored id so a moved
 * pin follows the new place. The stored id is an IANA name, never a fixed offset.
 * The boundary index is limited to Australia and nearby territories; that box
 * only chooses which polygons to load.
 */
public final class EventTimeZone {
    private static final Logger logger = LoggerFactory.getLogger(EventTimeZone.class);

    public static final String FALLBACK_ID = "Australia/Sydney";
    public static final ZoneId FALLBACK = ZoneId.of(FALLBACK_ID);

    // Cocos (west), Cape York (north), Macquarie (south), Norfolk (east).
    private static final double MIN_LAT = -55.0;
    private static final double MIN_LON = 96.0;
    private static final double MAX_LAT = -9.0;
    private static final double MAX_LON = 168.5;

    private static volatile TimeZoneEngine engine;

    private EventTimeZone() {
    }

    public static void warm() {
        engine();
    }

    public static ZoneId stamp(AbstractEventData event) {
        ZoneId zone = resolve(event);
        if (event != null) {
            event.setTimezone(zone.getId());
        }
        return zone;
    }

    public static ZoneId resolve(AbstractEventData event) {
        if (event == null) {
            return FALLBACK;
        }
        ZoneId fromCoordinates = lookup(event.getLocationLatLng());
        if (fromCoordinates != null) {
            return fromCoordinates;
        }
        ZoneId fromField = parseIana(event.getTimezone());
        if (fromField != null) {
            return fromField;
        }
        return FALLBACK;
    }

    /**
     * Applies the template's wall-clock gap between {@code templateStart} and
     * {@code templateMark} to {@code occurrenceStart}. A fixed UTC duration is an
     * hour wrong when that gap contains a daylight-saving transition the template
     * week did not.
     */
    public static Timestamp applyLocalRelationship(Timestamp templateStart, Timestamp templateMark,
            Timestamp occurrenceStart, ZoneId zone) {
        ZoneId eventZone = zone == null ? FALLBACK : zone;
        LocalDateTime startLocal = toZoned(templateStart, eventZone).toLocalDateTime();
        LocalDateTime markLocal = toZoned(templateMark, eventZone).toLocalDateTime();
        LocalDateTime occurrenceLocal = toZoned(occurrenceStart, eventZone).toLocalDateTime();
        Duration localGap = Duration.between(startLocal, markLocal);
        return TimeUtils.convertZonedDateTimeToTimestamp(occurrenceLocal.plus(localGap).atZone(eventZone));
    }

    private static ZoneId lookup(AbstractEventData.LocationLatLng latLng) {
        if (!hasUsableCoordinates(latLng)) {
            return null;
        }
        double lat = latLng.getLat();
        double lng = latLng.getLng();
        try {
            Optional<ZoneId> zone = engine().query(lat, lng);
            if (zone.isPresent()) {
                ZoneId parsed = parseIana(zone.get().getId());
                if (parsed != null) {
                    return parsed;
                }
            }
            logger.info("No IANA zone for lat={} lng={}, falling back", lat, lng);
        } catch (RuntimeException e) {
            logger.error("Timezone lookup failed for lat={} lng={}", lat, lng, e);
        }
        return null;
    }

    static ZoneId parseIana(String timezone) {
        if (timezone == null || timezone.isBlank() || !timezone.contains("/")) {
            return null;
        }
        try {
            ZoneId zone = ZoneId.of(timezone.trim());
            if (zone.normalized() instanceof ZoneOffset) {
                return null;
            }
            return zone;
        } catch (DateTimeException e) {
            return null;
        }
    }

    private static boolean hasUsableCoordinates(AbstractEventData.LocationLatLng latLng) {
        if (latLng == null || latLng.getLat() == null || latLng.getLng() == null) {
            return false;
        }
        double lat = latLng.getLat();
        double lng = latLng.getLng();
        if (Double.isNaN(lat) || Double.isNaN(lng) || Double.isInfinite(lat) || Double.isInfinite(lng)) {
            return false;
        }
        if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
            return false;
        }
        // Create-form placeholders before a place is chosen.
        if ((lat == 0.0 && lng == 0.0) || (lat == -1.0 && lng == -1.0)) {
            return false;
        }
        return true;
    }

    private static ZonedDateTime toZoned(Timestamp timestamp, ZoneId zone) {
        return Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()).atZone(zone);
    }

    private static TimeZoneEngine engine() {
        TimeZoneEngine current = engine;
        if (current == null) {
            synchronized (EventTimeZone.class) {
                current = engine;
                if (current == null) {
                    logger.info("Loading timezone boundaries for Australia");
                    current = TimeZoneEngine.initialize(MIN_LAT, MIN_LON, MAX_LAT, MAX_LON, false);
                    engine = current;
                }
            }
        }
        return current;
    }
}
