package com.functions.fulfilment.models;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Optional;

/**
 * The type name is the simple class name of the fulfilment entity.
 * e.g., StripeFulfilmentEntity will have the type name "StripeFulfilmentEntity".
 */
@Getter
public enum FulfilmentEntityType {
    STRIPE(StripeFulfilmentEntity.class),
    FORMS(FormsFulfilmentEntity.class);

    private final String typeName;

    FulfilmentEntityType(Class<?> clazz) {
        this.typeName = clazz.getSimpleName();
    }

    public static Optional<FulfilmentEntityType> fromTypeNameString(String typeName) {
        for (FulfilmentEntityType type : values()) {
            if (type.getTypeName().equals(typeName)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
