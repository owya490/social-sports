package com.functions.fulfilment.models.fulfilmentEntities;

import java.util.Optional;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.functions.forms.models.FormResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class FormsFulfilmentEntity extends FulfilmentEntity {

    private static final Logger logger = LoggerFactory.getLogger(FormsFulfilmentEntity.class);

    {
        setType(FulfilmentEntityType.FORMS);
    }
    private String formId;
    private String eventId;
    private String formResponseId;

    /**
     * Validates that the form response is complete before allowing progression to the next entity.
     * Returns false if the form is not complete, preventing progression.
     * Returns true if the form is complete, allowing progression.
     */
    @Override
    @JsonIgnore
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onEndHook() {
        return Optional.of(input -> {
            if (formResponseId == null || formResponseId.isEmpty()) {
                logger.error(
                        "Form response ID missing for form ID: {}, event ID: {}; entity is incomplete",
                        formId, eventId);
                return false;
            }

            Optional<FormResponse> maybeFormResponse = FormsRepository.getFormResponseById(
                    formId, eventId, formResponseId);
            if (maybeFormResponse.isEmpty()) {
                logger.error(
                        "Form response not found for form ID: {}, event ID: {}, response ID: {}",
                        formId, eventId, formResponseId);
                return false;
            }

            FormResponse formResponse = maybeFormResponse.get();
            if (!FormsUtils.isFormResponseComplete(formResponse)) {
                logger.error(
                        "Form response is not complete for form ID: {}, event ID: {}, response ID: {}",
                        formId, eventId, formResponseId);
                return false;
            }

            logger.info("Form entity completed successfully for form ID: {}, event ID: {}, response ID: {}",
                    formId, eventId, formResponseId);
            return true;
        });
    }
}
