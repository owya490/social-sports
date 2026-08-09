package com.functions.utils;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.events.models.EventTicketType;

public class JavaUtilsObjectMapperTest {

    @Test
    public void objectMapperIgnoresUnknownEventTicketTypeFields() {
        Map<String, Object> ticketType = new LinkedHashMap<>();
        ticketType.put("id", "type-1");
        ticketType.put("name", "Test");
        ticketType.put("price", 50);
        ticketType.put("capacity", 20);
        ticketType.put("vacancy", 17);
        ticketType.put("formId", "uWVKbptU8InNCJZg5upb");
        ticketType.put("futureField", "should-be-ignored");

        Map<String, Object> eventTicketTypes = new LinkedHashMap<>();
        eventTicketTypes.put("type-1", ticketType);

        Map<String, Object> eventDataMap = new LinkedHashMap<>();
        eventDataMap.put("eventId", "cr52yV7whtZnyAzVjTCF");
        eventDataMap.put("name", "Social Scrimmage");
        eventDataMap.put("eventTicketTypes", eventTicketTypes);

        EventData eventData = JavaUtils.objectMapper.convertValue(eventDataMap, EventData.class);

        assertNotNull(eventData.getEventTicketTypes());
        EventTicketType resolved = eventData.getEventTicketTypes().get("type-1");
        assertNotNull(resolved);
        assertEquals("type-1", resolved.getId());
        assertEquals("Test", resolved.getName());
        assertEquals("uWVKbptU8InNCJZg5upb", resolved.getFormId());
    }
}
