package com.functions.users.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.users.models.responses.GetPartnerUserResponse;
import com.functions.users.services.PartnerUserService;
import com.functions.utils.JavaUtils;

public class GetPartnerUserHandlerTest {
	private static final String ORGANISER = "assigned-organiser";
	private static final AuthContext PARTNER = AuthContext.partner(
			new PartnerContext("test-partner", ORGANISER, "https://partner.example"));
	private final GetPartnerUserHandler handler = new GetPartnerUserHandler();
	private MockedStatic<PartnerUserService> users;

	@Before
	public void setUp() {
		users = mockStatic(PartnerUserService.class);
	}

	@After
	public void tearDown() {
		users.close();
	}

	@Test
	public void usesTheServerOrganiserAndIgnoresAClientOrganiserId() throws Exception {
		GetPartnerUserResponse response = new GetPartnerUserResponse(
				"Ada Lovelace", "", null, null, "ada", "https://www.sportshub.net.au/user/ada");
		users.when(() -> PartnerUserService.getPublicPartnerUser(ORGANISER)).thenReturn(response);

		assertEquals(response, handler.handle(handler.parse(request(
				"{\"organiserId\":\"other-organiser\",\"partner\":\"test-partner\"}")), PARTNER));
	}

	@Test
	public void rejectsInvalidDataAndNonPartnerCallersBeforeReading() throws Exception {
		for (String data : new String[] { "null", "[]", "{\"partner\":\" \"}", "{\"partner\":1}" }) {
			try {
				handler.parse(request(data));
				fail("Expected invalid user request");
			} catch (IllegalArgumentException expected) {
			}
		}
		try {
			handler.handle(handler.parse(request("{}")), AuthContext.anonymous());
			fail("Expected a partner");
		} catch (AuthenticationException expected) {
		}
		try {
			handler.handle(handler.parse(request("{\"partner\":\"other-partner\"}")), PARTNER);
			fail("Expected a matching partner");
		} catch (IllegalArgumentException expected) {
		}
		users.verifyNoInteractions();
	}

	private UnifiedRequest request(String data) throws Exception {
		return new UnifiedRequest(EndpointType.GET_PARTNER_USER, JavaUtils.objectMapper.readTree(data));
	}
}
