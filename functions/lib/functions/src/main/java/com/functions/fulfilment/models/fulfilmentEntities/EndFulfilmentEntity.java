package com.functions.fulfilment.models.fulfilmentEntities;

import java.util.Optional;
import java.util.function.Function;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSessionType;
import com.functions.waitlist.services.WaitlistService;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class EndFulfilmentEntity extends FulfilmentEntity {
    private String url;

    {
        setType(FulfilmentEntityType.END);
    }

    @Override
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onStartHook() {
        return Optional.of(input -> {
            FulfilmentSession fulfilmentSession = input.fulfilmentSession();
            FulfilmentSessionType type = fulfilmentSession.getType();
            String eventId = fulfilmentSession.getEventData().getEventId();
            switch (type) {
                case WAITLIST:
                    return fulfilmentSession.getFulfilmentEntityMap().values().stream()
                            .filter(entity -> entity.getType() == FulfilmentEntityType.WAITLIST)
                            .map(entity -> (WaitlistFulfilmentEntity) entity)
                            .filter(entity -> WaitlistService.validateWaitlistEntry(eventId, entity.getEmail(),
                                    entity.getName(), entity.getTicketCount()))
                            .map(entity -> {
                                try {
                                    WaitlistService.joinEventWaitlist(eventId, entity.getEmail(), entity.getName(),
                                            entity.getTicketCount());
                                } catch (Exception e) {
                                    return false;
                                }
                                return true;
                            }).allMatch(bool -> bool == true); // All waitlist entries must be valid to proceed
                default:
                    return true; // Other entity types are considered complete by default
            }
        });
    }
}
