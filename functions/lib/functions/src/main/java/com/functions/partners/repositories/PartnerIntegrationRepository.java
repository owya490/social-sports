package com.functions.partners.repositories;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

import com.functions.firebase.services.FirebaseService;
import com.functions.partners.models.PartnerIntegration;
import com.google.cloud.firestore.DocumentSnapshot;

public final class PartnerIntegrationRepository {
    private PartnerIntegrationRepository() {
    }

    public static Optional<PartnerIntegration> findById(String integrationId) {
        try {
            DocumentSnapshot snapshot = FirebaseService.getFirestore().collection("PartnerIntegrations")
                    .document(integrationId).get().get();
            return snapshot.exists() ? Optional.of(PartnerIntegration.fromData(snapshot.getData())) : Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Partner integration unavailable", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException("Partner integration unavailable", e);
        }
    }
}
