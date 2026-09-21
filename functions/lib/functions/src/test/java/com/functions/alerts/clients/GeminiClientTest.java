package com.functions.alerts.clients;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.Optional;

import org.junit.Test;

public class GeminiClientTest {

    @Test
    public void parseText_readsFirstCandidate() throws Exception {
        String body = """
                {
                  "candidates": [
                    {
                      "content": {
                        "parts": [
                          { "text": "  globalAppController: checkout failed on null event. Open WebhookService.process.  " }
                        ]
                      }
                    }
                  ]
                }
                """;
        Optional<String> text = GeminiClient.parseText(body);
        assertTrue(text.isPresent());
        assertEquals(
                "globalAppController: checkout failed on null event. Open WebhookService.process.",
                text.get());
    }

    @Test
    public void parseText_emptyCandidates() throws Exception {
        assertTrue(GeminiClient.parseText("{\"candidates\":[]}").isEmpty());
    }
}
