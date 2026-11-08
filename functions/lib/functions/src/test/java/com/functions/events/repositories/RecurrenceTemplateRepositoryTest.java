package com.functions.events.repositories;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.ACTIVE;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.ARCHIVED;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.INACTIVE;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

import com.functions.events.models.NewEventData;
import com.functions.events.models.RecurrenceTemplate;

public class RecurrenceTemplateRepositoryTest {

    @Test
    public void archivedTemplateUsesTheArchivedFolderEvenWhenMarkedActive() {
        NewEventData eventData = new NewEventData();
        eventData.setIsActive(true);
        eventData.setIsPrivate(true);
        RecurrenceTemplate template = RecurrenceTemplate.builder()
                .eventData(eventData)
                .archived(true)
                .build();

        assertEquals(ARCHIVED, RecurrenceTemplateRepository.statusFolder(template));
    }

    @Test
    public void activeTemplateUsesTheActiveFolder() {
        NewEventData eventData = new NewEventData();
        eventData.setIsActive(true);
        RecurrenceTemplate template = RecurrenceTemplate.builder().eventData(eventData).build();

        assertEquals(ACTIVE, RecurrenceTemplateRepository.statusFolder(template));
    }

    @Test
    public void inactiveTemplateUsesTheInactiveFolder() {
        NewEventData eventData = new NewEventData();
        eventData.setIsActive(false);
        RecurrenceTemplate template = RecurrenceTemplate.builder().eventData(eventData).archived(false).build();

        assertEquals(INACTIVE, RecurrenceTemplateRepository.statusFolder(template));
    }
}
