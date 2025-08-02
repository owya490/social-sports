"use client";

import FormResponder from "@/components/forms/FormResponder";
import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import { FormResponseId } from "@/interfaces/FormTypes";
import {
  FulfilmentEntityId,
  FulfilmentEntityType,
  FulfilmentSessionId,
  GetFulfilmentEntityInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import {
  getFulfilmentEntityInfo,
  getNextFulfilmentEntityUrl,
  getPrevFulfilmentEntityUrl,
  updateFulfilmentEntityWithFormResponseId,
} from "@/services/src/fulfilment/fulfilmentServices";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Routing page for fulfilment session entities.
 */
const FulfilmentSessionEntityPage = ({
  params,
}: {
  params: { fulfilmentSessionId: FulfilmentSessionId; fulfilmentEntityId: FulfilmentEntityId };
}) => {
  const fulfilmentSessionEntityPageLogger = new Logger("fulfilmentSessionEntityPageLogger");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [getFulfilmentEntityInfoResponse, setGetFulfilmentEntityInfoResponse] =
    useState<GetFulfilmentEntityInfoResponse | null>(null);
  useEffect(() => {
    const fetchFulfilmentEntityInfo = async () => {
      const { fulfilmentSessionId, fulfilmentEntityId } = params;
      try {
        const getFulfilmentEntityInfoResponse = await getFulfilmentEntityInfo(fulfilmentSessionId, fulfilmentEntityId);
        setGetFulfilmentEntityInfoResponse(getFulfilmentEntityInfoResponse);
      } catch (error) {
        fulfilmentSessionEntityPageLogger.error(`Error fetching fulfilment entity info ${error}`);
        router.push("/error");
        return;
      }
      setLoading(false);
    };
    fetchFulfilmentEntityInfo();
  }, []);

  const handleNext = async () => {
    try {
      const nextUrl = await getNextFulfilmentEntityUrl(params.fulfilmentSessionId, params.fulfilmentEntityId);
      if (nextUrl) {
        router.push(nextUrl);
      } else {
        fulfilmentSessionEntityPageLogger.info("No next fulfilment entity available");
      }
    } catch (error) {
      fulfilmentSessionEntityPageLogger.error(`Error navigating to next entity: ${error}`);
    }
  };

  const handlePrev = async () => {
    try {
      const prevUrl = await getPrevFulfilmentEntityUrl(params.fulfilmentSessionId, params.fulfilmentEntityId);
      if (prevUrl) {
        router.push(prevUrl);
      } else {
        fulfilmentSessionEntityPageLogger.info("No previous fulfilment entity available");
      }
    } catch (error) {
      fulfilmentSessionEntityPageLogger.error(`Error navigating to previous entity: ${error}`);
    }
  };

  if (loading) {
    return <Loading />;
  }

  switch (getFulfilmentEntityInfoResponse?.type) {
    case FulfilmentEntityType.STRIPE:
      if (getFulfilmentEntityInfoResponse.url === null) {
        fulfilmentSessionEntityPageLogger.error(
          `Stripe Fulfilment Entity URL is null when it should not be, fulfilmentSessionId: ${
            params.fulfilmentSessionId
          }, fulfilmentEntityId: ${params.fulfilmentEntityId}, getFulfilmentEntityInfoResponse: ${JSON.stringify(
            getFulfilmentEntityInfoResponse
          )}`
        );
        router.push("/error");
        return;
      }
      router.push(getFulfilmentEntityInfoResponse.url);
    case FulfilmentEntityType.FORMS:
      if (getFulfilmentEntityInfoResponse.formId === null || getFulfilmentEntityInfoResponse.eventId === null) {
        fulfilmentSessionEntityPageLogger.error(
          `Forms Fulfilment Entity formId or eventId is null when it should not be, fulfilmentSessionId: ${
            params.fulfilmentSessionId
          }, fulfilmentEntityId: ${params.fulfilmentEntityId}, getFulfilmentEntityInfoResponse: ${JSON.stringify(
            getFulfilmentEntityInfoResponse
          )}`
        );
        router.push("/error");
        return;
      }

      const onSaveFormResponse = async (formResponseId: FormResponseId): Promise<void> => {
        fulfilmentSessionEntityPageLogger.info(
          `Form response saved with ID: ${formResponseId}, fulfilmentSessionId: ${params.fulfilmentSessionId}, fulfilmentEntityId: ${params.fulfilmentEntityId}`
        );

        await updateFulfilmentEntityWithFormResponseId(
          params.fulfilmentSessionId,
          params.fulfilmentEntityId,
          formResponseId
        );
      };

      return (
        <FulfilmentEntityPage onNext={handleNext} onPrev={handlePrev}>
          <FormResponder
            formId={getFulfilmentEntityInfoResponse.formId}
            eventId={getFulfilmentEntityInfoResponse.eventId}
            formResponseId={getFulfilmentEntityInfoResponse.formResponseId}
            onSaveFormResponse={onSaveFormResponse}
            canEditForm={true}
            isPreview={false}
          />
        </FulfilmentEntityPage>
      );
    case FulfilmentEntityType.END:
      if (getFulfilmentEntityInfoResponse.url === null) {
        fulfilmentSessionEntityPageLogger.error(
          `End Fulfilment Entity URL is null when it should not be, fulfilmentSessionId: ${
            params.fulfilmentSessionId
          }, fulfilmentEntityId: ${params.fulfilmentEntityId}, getFulfilmentEntityInfoResponse: ${JSON.stringify(
            getFulfilmentEntityInfoResponse
          )}`
        );
        router.push("https://sportshub.net.au/dashboard");
        return;
      }
      router.push(getFulfilmentEntityInfoResponse.url);
      return;
    default:
      return <div className="mt-14">Unknown Fulfilment Entity Type</div>;
  }
};

export default FulfilmentSessionEntityPage;
