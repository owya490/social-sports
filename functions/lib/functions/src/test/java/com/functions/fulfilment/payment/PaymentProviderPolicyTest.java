package com.functions.fulfilment.payment;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.List;

import org.junit.Test;

import com.functions.events.models.EventData;
import com.functions.events.models.PaymentProvider;
import com.functions.users.models.PrivateUserData;

public class PaymentProviderPolicyTest {

    @Test
    public void allowsPyngCheckoutWhenEventListsPyng() {
        EventData event = new EventData();
        event.setOrganiserId("organiser");
        assertFalse(PaymentProviderPolicy.allowsPyngCheckout(event));

        event.setSupportedPaymentProviders(List.of(PaymentProvider.STRIPE, PaymentProvider.PYNG));
        assertTrue(PaymentProviderPolicy.allowsPyngCheckout(event));
    }

    @Test
    public void newEventsInheritOrganiserProviders() {
        PrivateUserData organiser = new PrivateUserData();
        assertEquals(List.of(PaymentProvider.STRIPE), PaymentProviderPolicy.organiserPaymentProviders(organiser));

        organiser.setSupportedPaymentProviders(List.of(PaymentProvider.STRIPE, PaymentProvider.PYNG));
        assertEquals(List.of(PaymentProvider.STRIPE, PaymentProvider.PYNG),
                PaymentProviderPolicy.organiserPaymentProviders(organiser));

        organiser.setSupportedPaymentProviders(null);
        assertEquals(List.of(PaymentProvider.STRIPE), PaymentProviderPolicy.organiserPaymentProviders(organiser));
        assertEquals(List.of(PaymentProvider.STRIPE), PaymentProviderPolicy.organiserPaymentProviders(null));
    }
}
