package com.functions.fulfilment.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.fulfilment.models.requests.CompleteFulfilmentSessionRequest;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;

public class CompleteFulfilmentSessionHandler implements Handler<CompleteFulfilmentSessionRequest, String> {

  private static final Logger logger = LoggerFactory.getLogger(CompleteFulfilmentSessionHandler.class);

  @Override
  public CompleteFulfilmentSessionRequest parse(UnifiedRequest data) {
    try {
      return JavaUtils.objectMapper.treeToValue(data.data(), CompleteFulfilmentSessionRequest.class);
    } catch (JsonProcessingException e) {
      throw new RuntimeException("Failed to parse CompleteFulfilmentSessionRequest", e);
    }
  }

  @Override
  public String handle(CompleteFulfilmentSessionRequest parsedRequestData) {
    boolean isSuccess = FulfilmentService.completeFulfilmentSession(parsedRequestData.fulfilmentSessionId(), parsedRequestData.fulfilmentEntityId());
    if (isSuccess) {
      logger.info(
                    "[CompleteFulfilmentSessionEndpoint] Fulfilment session completed successfully: {} for entity: {}",
                    parsedRequestData.fulfilmentSessionId(), parsedRequestData.fulfilmentEntityId());
      return "Fulfilment session completed successfully";
    } else {
      logger.error(
                    "[CompleteFulfilmentSessionEndpoint] Failed to complete fulfilment session: {} for entity: {}",
                    parsedRequestData.fulfilmentSessionId(), parsedRequestData.fulfilmentEntityId());
      return "Failed to complete fulfilment session";
    }
  }
}
