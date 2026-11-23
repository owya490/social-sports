package com.functions.emails.reminder;

import java.util.List;

import com.functions.emails.reminder.EmailReminderService.ActiveEventSource;
import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;

final class FirestoreActiveEvents implements ActiveEventSource {
    @Override
    public List<EventData> listPublic() {
        return EventsRepository.listActiveEvents(false);
    }

    @Override
    public List<EventData> listPrivate() {
        return EventsRepository.listActiveEvents(true);
    }
}
