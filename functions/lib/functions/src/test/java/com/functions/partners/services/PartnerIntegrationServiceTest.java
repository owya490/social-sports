package com.functions.partners.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.exceptions.AuthorizationException;
import com.functions.global.testutils.FakeHttpRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.partners.models.PartnerIntegration;
import com.functions.partners.repositories.PartnerIntegrationRepository;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class PartnerIntegrationServiceTest {
    private static final String KEY = "partner-one." + "A".repeat(43);
    private static final String DIGEST = "68aa689dc8cc473bdc24bae7b501e446d7918796f277b896273ff8245ddadd13";
    private static final String ORIGIN = "https://partner.example";
    private MockedStatic<EnvironmentUtils> environment;
    private MockedStatic<PartnerIntegrationRepository> repository;

    @Before
    public void setUp() {
        environment = mockStatic(EnvironmentUtils.class);
        repository = mockStatic(PartnerIntegrationRepository.class);
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
        configure(true, List.of(ORIGIN), List.of(DIGEST));
    }

    @After
    public void tearDown() {
        repository.close();
        environment.close();
    }

    @Test
    public void acceptedKeyAssignsServerIdentityAfterOneDirectRead() {
        PartnerContext context = PartnerIntegrationService.verify(request(KEY, ORIGIN));

        assertEquals(new PartnerContext("partner-one", "owner-one", ORIGIN), context);
        repository.verify(() -> PartnerIntegrationRepository.findById("partner-one"));
        repository.verifyNoMoreInteractions();
    }

    @Test
    public void comparesCanonicalSchemeHostAndEffectivePortButEchoesVerifiedOrigin() {
        assertEquals("https://PARTNER.example:443",
                PartnerIntegrationService.verify(request(KEY, "https://PARTNER.example:443")).verifiedOrigin());
        for (String denied : List.of("https://partner.example:444", "https://www.partner.example",
                "https://partner.example.evil.test", "https://evilpartner.example")) {
            expectFailure(AuthorizationException.class,
                    () -> PartnerIntegrationService.verify(request(KEY, denied)));
        }
    }

    @Test
    public void malformedAndMultipleKeysRejectBeforeConfigurationReads() {
        expectFailure(AuthenticationException.class,
                () -> PartnerIntegrationService.verify(FakeHttpRequest.withHeaders("Origin", ORIGIN)));
        expectFailure(AuthenticationException.class, () -> PartnerIntegrationService.verify(
                FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, KEY,
                        "x-sportshub-partner-key", KEY, "Origin", ORIGIN)));
        for (String invalid : List.of("", " " + KEY, KEY + "," + KEY, "../" + KEY,
                "partner-one." + "A".repeat(42) + "B", "partner-one." + "A".repeat(42),
                "a".repeat(65) + "." + "A".repeat(43))) {
            expectFailure(AuthenticationException.class,
                    () -> PartnerIntegrationService.verify(request(invalid, ORIGIN)));
        }
        repository.verifyNoInteractions();
    }

    @Test
    public void malformedMissingAndMultipleOriginsRejectBeforeConfigurationReads() {
        expectFailure(AuthorizationException.class, () -> PartnerIntegrationService.verify(
                FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, KEY)));
        expectFailure(AuthorizationException.class, () -> PartnerIntegrationService.verify(
                FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, KEY,
                        "Origin", ORIGIN, "origin", ORIGIN)));
        for (String invalid : List.of("null", "*", ORIGIN + ",https://other.example", ORIGIN + "/",
                ORIGIN + "/path", ORIGIN + "?query=1", ORIGIN + "#fragment", "https://user@partner.example",
                "http://partner.example:80", "http://localhost:3000", ORIGIN + ":", ORIGIN + ":65536")) {
            expectFailure(AuthorizationException.class,
                    () -> PartnerIntegrationService.verify(request(KEY, invalid)));
        }
        repository.verifyNoInteractions();
    }

    @Test
    public void missingDisabledAndUnknownKeysShareTheSameDenial() {
        repository.when(() -> PartnerIntegrationRepository.findById("partner-one")).thenReturn(Optional.empty());
        assertInvalidKey(KEY);
        configure(false, List.of(ORIGIN), List.of(DIGEST));
        assertInvalidKey(KEY);
        configure(true, List.of(ORIGIN), List.of("0".repeat(64)));
        assertInvalidKey(KEY);
        repository.verify(() -> PartnerIntegrationRepository.findById("partner-one"), times(3));
    }

    @Test
    public void twoKeyOverlapAndManualRemovalTakeEffectWithoutACache() {
        String secondKey = "partner-one." + "A".repeat(42) + "E";
        configure(true, List.of(ORIGIN), List.of(DIGEST, PartnerIntegrationService.digestKey(secondKey)));
        assertEquals("owner-one", PartnerIntegrationService.verify(request(KEY, ORIGIN)).organiserId());
        assertEquals("owner-one", PartnerIntegrationService.verify(request(secondKey, ORIGIN)).organiserId());

        configure(true, List.of(ORIGIN), List.of(PartnerIntegrationService.digestKey(secondKey)));
        assertInvalidKey(KEY);
        assertEquals("owner-one", PartnerIntegrationService.verify(request(secondKey, ORIGIN)).organiserId());
        repository.verify(() -> PartnerIntegrationRepository.findById("partner-one"), times(4));
    }

    @Test
    public void developmentAllowsOnlyExplicitConfiguredLoopbackPorts() {
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.DEVELOPMENT);
        for (String origin : List.of("http://localhost:3000", "http://127.0.0.1:3001", "http://[::1]:3002")) {
            configure(true, List.of(origin), List.of(DIGEST));
            assertEquals(origin, PartnerIntegrationService.verify(request(KEY, origin)).verifiedOrigin());
        }
        for (String origin : List.of("http://localhost", "http://127.0.0.1", "http://partner.example:3000",
                "http://localhost.evil.test:3000")) {
            expectFailure(AuthorizationException.class, () -> PartnerIntegrationService.verify(request(KEY, origin)));
        }
        configure(true, List.of("http://localhost:3000"), List.of(DIGEST));
        expectFailure(AuthorizationException.class,
                () -> PartnerIntegrationService.verify(request(KEY, "http://localhost:3001")));
    }

    @Test
    public void malformedConfigurationAndReadFailuresFailAsServerErrors() {
        for (String origin : List.of("https://partner.example/path", "http://localhost:3000", "*")) {
            configure(true, List.of(origin), List.of(DIGEST));
            expectFailure(IllegalStateException.class, () -> PartnerIntegrationService.verify(request(KEY, ORIGIN)));
        }
        repository.when(() -> PartnerIntegrationRepository.findById("partner-one"))
                .thenThrow(new IllegalStateException("private dependency details"));
        expectFailure(IllegalStateException.class, () -> PartnerIntegrationService.verify(request(KEY, ORIGIN)));
    }

    @Test
    public void unknownEnvironmentFailsBeforeConfigurationReads() {
        environment.when(EnvironmentUtils::getEnvironment).thenReturn(null);
        expectFailure(IllegalStateException.class, () -> PartnerIntegrationService.verify(request(KEY, ORIGIN)));
        repository.verifyNoInteractions();
    }

    @Test
    public void configurationRejectsCoercionUnknownFieldsAndInvalidDigestCounts() {
        Map<String, Object> good = Map.of("enabled", true, "organiserId", "owner-one",
                "allowedOrigins", List.of(ORIGIN), "keyDigests", List.of(DIGEST));
        for (Map.Entry<String, Object> bad : Map.<String, Object>of(
                "enabled", "true", "organiserId", " ", "allowedOrigins", List.of(42),
                "keyDigests", List.of(DIGEST, "0".repeat(64), "1".repeat(64))).entrySet()) {
            Map<String, Object> data = new HashMap<>(good);
            data.put(bad.getKey(), bad.getValue());
            expectFailure(IllegalStateException.class, () -> PartnerIntegration.fromData(data));
        }
        Map<String, Object> unexpected = new HashMap<>(good);
        unexpected.put("organizerId", "typo");
        expectFailure(IllegalStateException.class, () -> PartnerIntegration.fromData(unexpected));
        expectFailure(IllegalStateException.class,
                () -> new PartnerIntegration(true, "owner-one", List.of(ORIGIN), List.of()));
        expectFailure(IllegalStateException.class,
                () -> new PartnerIntegration(true, "owner-one", List.of(ORIGIN), List.of("not-sha256")));
    }

    @Test
    public void generatedKeysHaveIndependentThirtyTwoByteSecretsAndWholeKeyDigests() {
        String first = PartnerIntegrationService.generateKey("partner-one");
        String second = PartnerIntegrationService.generateKey("partner-one");
        assertTrue(first.matches("partner-one\\.[A-Za-z0-9_-]{43}"));
        assertNotEquals(first, second);
        assertEquals(DIGEST, PartnerIntegrationService.digestKey(KEY));
        assertNotEquals(DIGEST, PartnerIntegrationService.digestKey("partner-two." + "A".repeat(43)));
    }

    private void assertInvalidKey(String key) {
        assertEquals("Invalid partner key", expectFailure(AuthenticationException.class,
                () -> PartnerIntegrationService.verify(request(key, ORIGIN))).getMessage());
    }

    private void configure(boolean enabled, List<String> origins, List<String> digests) {
        repository.when(() -> PartnerIntegrationRepository.findById("partner-one"))
                .thenReturn(Optional.of(new PartnerIntegration(enabled, "owner-one", origins, digests)));
    }

    private FakeHttpRequest request(String key, String origin) {
        return FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, key, "Origin", origin);
    }

    private <T extends RuntimeException> T expectFailure(Class<T> expected, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException failure) {
            if (!expected.isInstance(failure)) {
                throw failure;
            }
            return expected.cast(failure);
        }
        throw new AssertionError("Expected " + expected.getSimpleName());
    }
}
