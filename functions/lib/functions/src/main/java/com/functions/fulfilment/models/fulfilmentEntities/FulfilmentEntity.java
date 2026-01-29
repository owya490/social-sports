package com.functions.fulfilment.models.fulfilmentEntities;

import java.util.Optional;
import java.util.function.Function;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
public abstract class FulfilmentEntity {
    /**
     * Store the type of FulfilmentEntity for the purpose of deserialisation from Firebase so we know
     * which concrete class to instantiate. Unfortunately, Firebase does not support polymorphism directly.
     */
    private FulfilmentEntityType type;

    /**
     * Hook executed when this entity starts processing.
     * Override in subclasses to define custom start behavior.
     * Not persisted to Firebase.
     * Returns true if the hook was successful, false otherwise.
     */
    @JsonIgnore
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onStartHook() {
        return Optional.empty();
    }

    /**
     * Hook executed when this entity completes processing.
     * Override in subclasses to define custom completion behavior.
     * Not persisted to Firebase.
     * Returns true if the hook was successful, false otherwise.
     */
    @JsonIgnore
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onEndHook() {
        return Optional.empty();
    }

    public record FulfilmentEntityHookInput(String fulfilmentEntityId, FulfilmentSession fulfilmentSession) {}
}
