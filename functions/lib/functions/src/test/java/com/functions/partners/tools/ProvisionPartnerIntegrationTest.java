package com.functions.partners.tools;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;

import com.google.api.core.ApiFutures;
import com.google.api.gax.rpc.AlreadyExistsException;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.WriteResult;

public class ProvisionPartnerIntegrationTest {
    private final ByteArrayOutputStream output = new ByteArrayOutputStream();
    private final ByteArrayOutputStream errors = new ByteArrayOutputStream();
    private final Firestore firestore = mock(Firestore.class);
    private final DocumentReference document = mock(DocumentReference.class);
    private MockedStatic<FirestoreOptions> options;
    private FirestoreOptions.Builder builder;

    @Before
    public void setUp() {
        builder = mock(FirestoreOptions.Builder.class);
        FirestoreOptions settings = mock(FirestoreOptions.class);
        options = mockStatic(FirestoreOptions.class);
        options.when(FirestoreOptions::newBuilder).thenReturn(builder);
        when(builder.setProjectId(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(settings);
        when(settings.getService()).thenReturn(firestore);
        when(firestore.document("PartnerIntegrations/example-club")).thenReturn(document);
        when(document.create(anyMap())).thenReturn(ApiFutures.immediateFuture(mock(WriteResult.class)));
    }

    @After
    public void tearDown() {
        options.close();
    }

    @Test
    public void previewUsesExplicitProjectAndValidatesOriginsWithoutConnectingOrDisplayingAKey() {
        assertEquals(0, run("--environment", "prod", "--partner", "example-club", "--organiser", "owner-one",
                "--origin", "https://partner.example", "--origin", "https://www.partner.example"));
        assertTrue(output.toString().contains("Project: socialsportsprod"));
        assertTrue(output.toString().contains("https://partner.example, https://www.partner.example"));
        assertFalse(output.toString().contains("KEY:"));
        options.verifyNoInteractions();

        assertEquals(0, run("--environment", "dev", "--partner", "example-club", "--organiser", "owner-one",
                "--origin", "http://localhost:3000"));
        assertTrue(output.toString().contains("Project: socialsports-44162"));
        options.verifyNoInteractions();
    }

    @Test
    public void invalidArgumentsNeverConnectToFirestore() {
        for (String[] args : List.of(
                new String[] { "--environment", "other", "--apply" },
                new String[] { "--environment", "prod", "--partner", "../club", "--apply" },
                new String[] { "--environment", "prod", "--partner", "example-club", "--organiser", "owner-one",
                        "--origin", "https://partner.example/path", "--apply" },
                new String[] { "--environment", "prod", "--partner", "example-club", "--organiser", "owner-one",
                        "--origin", "http://localhost:3000", "--apply" },
                new String[] { "--environment", "prod", "--environment", "dev", "--apply" },
                new String[] { "--environment", "prod", "--partner", "example-club", "--organiser", "owner-one",
                        "--apply" })) {
            assertEquals(2, run(args));
        }
        options.verifyNoInteractions();
        assertFalse(output.toString().contains("KEY:"));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void applyCreatesOnlyTheHashAndDisplaysTheMatchingKeyOnceAfterSuccess() throws Exception {
        assertEquals(0, run(applyArgs()));
        Matcher keyLine = Pattern.compile("(?m)^KEY: (example-club\\.[A-Za-z0-9_-]{43})$")
                .matcher(output.toString());
        assertTrue(keyLine.find());
        String key = keyLine.group(1);
        assertFalse(keyLine.find());
        String digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(key.getBytes(StandardCharsets.UTF_8)));
        ArgumentCaptor<Map<String, Object>> data = ArgumentCaptor.forClass(Map.class);
        verify(document).create(data.capture());
        assertEquals(Map.of("enabled", true, "organiserId", "owner-one",
                "allowedOrigins", List.of("https://partner.example"), "keyDigests", List.of(digest)), data.getValue());
        verify(builder).setProjectId("socialsportsprod");
        verify(firestore).close();
        assertEquals("", errors.toString());
    }

    @Test
    public void existingRecordAndUnknownWriteOutcomeNeverDisplayKeysOrDependencyDetails() {
        when(document.create(anyMap())).thenReturn(ApiFutures.immediateFailedFuture(mock(AlreadyExistsException.class)));
        assertEquals(1, run(applyArgs()));
        assertTrue(errors.toString().contains("Nothing was overwritten"));
        when(document.create(anyMap())).thenReturn(
                ApiFutures.immediateFailedFuture(new IllegalStateException("private-provider-canary")));
        assertEquals(1, run(applyArgs()));
        assertTrue(errors.toString().contains("outcome is unknown"));
        assertFalse(output.toString().contains("KEY:"));
        assertFalse(errors.toString().contains("private-provider-canary"));
    }

    @Test
    public void applyRefusesAnInheritedEmulatorSettingBeforeConnecting() {
        assertEquals(2, ProvisionPartnerIntegration.run(applyArgs(), Map.of("FIRESTORE_EMULATOR_HOST", "localhost:8787"),
                new PrintStream(output), new PrintStream(errors)));
        options.verifyNoInteractions();
        assertFalse(output.toString().contains("KEY:"));
    }

    private int run(String... args) {
        return ProvisionPartnerIntegration.run(args, Map.of(), new PrintStream(output), new PrintStream(errors));
    }

    private String[] applyArgs() {
        return new String[] { "--environment", "prod", "--partner", "example-club", "--organiser", "owner-one",
                "--origin", "https://partner.example", "--apply" };
    }
}
