package com.functions.fulfilment.models.fulfilmentEntities;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import com.functions.fulfilment.models.PurchaserDetails;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity.FulfilmentEntityHookInput;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;

public class DetailsFulfilmentEntityTest {

    @Test
    public void purchaserDetailsMatchTheCheckoutForm() {
        assertFalse(PurchaserDetails.isValid("  ", "ada@example.com"));
        assertFalse(PurchaserDetails.isValid("Ada", "not-an-email"));
        assertFalse(PurchaserDetails.isValid(null, "ada@example.com"));
        assertTrue(PurchaserDetails.isValid(" Ada Lovelace ", " ada@example.com "));
    }

    @Test
    public void onEndHookBlocksUntilNameAndEmailArePresent() {
        assertFalse(complete(null, null));
        assertFalse(complete("Ada", "not-an-email"));
        assertFalse(complete(" ", "ada@example.com"));
        assertTrue(complete("Ada Lovelace", "ada@example.com"));
    }

    private static boolean complete(String name, String email) {
        PyngCheckoutFulfilmentSession session = PyngCheckoutFulfilmentSession.builder()
                .id("session-1")
                .purchaserName(name)
                .purchaserEmail(email)
                .build();
        DetailsFulfilmentEntity entity = DetailsFulfilmentEntity.builder().build();
        return entity.onEndHook().orElseThrow()
                .apply(new FulfilmentEntityHookInput("entity-1", session));
    }
}
