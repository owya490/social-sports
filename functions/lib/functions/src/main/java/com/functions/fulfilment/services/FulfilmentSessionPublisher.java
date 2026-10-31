package com.functions.fulfilment.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.utils.JavaUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;
import com.google.api.core.ApiFuture;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;

/**
 * Publishes the whole fulfilment session. The queue handler deserializes that
 * JSON and does not read the session back from Firestore.
 */
public final class FulfilmentSessionPublisher {
    static final String TOPIC = "process-fulfilment-sessions-topic";
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionPublisher.class);
    private static volatile Publisher publisher;

    @FunctionalInterface
    public interface Transport {
        void publish(String json) throws Exception;
    }

    public static volatile Transport transport = FulfilmentSessionPublisher::publishToPubSub;

    private FulfilmentSessionPublisher() {
    }

    public static void publish(FulfilmentSession session) throws Exception {
        transport.publish(JavaUtils.objectMapper.writeValueAsString(session));
    }

    public static void resetTransport() {
        transport = FulfilmentSessionPublisher::publishToPubSub;
    }

    private static void publishToPubSub(String json) throws Exception {
        Publisher client = client();
        PubsubMessage message = PubsubMessage.newBuilder()
                .setData(ByteString.copyFromUtf8(json))
                .build();
        ApiFuture<String> published = client.publish(message);
        String messageId = published.get();
        logger.info("Published fulfilment session to {} as {}", TOPIC, messageId);
    }

    private static Publisher client() throws Exception {
        Publisher current = publisher;
        if (current != null) {
            return current;
        }
        synchronized (FulfilmentSessionPublisher.class) {
            if (publisher == null) {
                Environment environment = EnvironmentUtils.getEnvironment();
                if (environment == null) {
                    throw new IllegalStateException("PROJECT_NAME is not a known SPORTSHUB project");
                }
                publisher = Publisher.newBuilder(TopicName.of(environment.getProjectName(), TOPIC)).build();
            }
            return publisher;
        }
    }
}
