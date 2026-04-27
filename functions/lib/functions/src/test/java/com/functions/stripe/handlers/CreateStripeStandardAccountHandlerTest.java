package com.functions.stripe.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import org.junit.Test;

import com.functions.auth.exceptions.UnauthenticatedException;
import com.functions.auth.exceptions.UnauthorizedException;
import com.functions.auth.models.AuthenticatedUser;
import com.functions.auth.models.RequestContext;
import com.functions.stripe.models.requests.CreateStripeStandardAccountRequest;

public class CreateStripeStandardAccountHandlerTest {

    @Test(expected = UnauthenticatedException.class)
    public void handleRequiresAuthentication() throws Exception {
        CreateStripeStandardAccountHandler handler = new CreateStripeStandardAccountHandler();
        handler.handle(new CreateStripeStandardAccountRequest(
                "organiser-123",
                "https://sportshub.com/return",
                "https://sportshub.com/refresh"), new RequestContext(null));
    }

    @Test
    public void handleRejectsUidMismatch() {
        CreateStripeStandardAccountHandler handler = new CreateStripeStandardAccountHandler();
        try {
            handler.handle(new CreateStripeStandardAccountRequest(
                    "organiser-123",
                    "https://sportshub.com/return",
                    "https://sportshub.com/refresh"),
                    new RequestContext(new AuthenticatedUser("different-user")));
            fail("Expected UnauthorizedException");
        } catch (Exception e) {
            assertEquals(UnauthorizedException.class, e.getClass());
        }
    }
}
