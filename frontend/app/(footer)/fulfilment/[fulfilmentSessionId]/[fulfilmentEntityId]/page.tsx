"use client";

import FormResponder, { FormResponderRef } from "@/components/forms/FormResponder";
import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import {
  FulfilmentEntityId,
  FulfilmentEntityType,
  FulfilmentSessionId,
  GetFulfilmentEntityInfoResponse,
  GetFulfilmentSessionInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import {
  completeFulfilmentSession,
  getFulfilmentEntityInfo,
  getFulfilmentSessionInfo,
  getNextFulfilmentEntityUrl,
  getPrevFulfilmentEntityUrl,
} from "@/services/src/fulfilment/fulfilmentServices";
import { Alert } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [fulfilmentSessionInfo, setFulfilmentSessionInfo] = useState<GetFulfilmentSessionInfoResponse | null>(null);
  const formResponderRef = useRef<FormResponderRef>(null);

  // Error state management
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    };
    const fetchFulfilmentSessionInfo = async () => {
      const { fulfilmentSessionId, fulfilmentEntityId } = params;
      try {
        const fulfilmentSessionInfo = await getFulfilmentSessionInfo(fulfilmentSessionId, fulfilmentEntityId);
        setFulfilmentSessionInfo(fulfilmentSessionInfo);
        console.log("fulfilmentSessionInfo", fulfilmentSessionInfo);
      } catch (error) {
        fulfilmentSessionEntityPageLogger.error(`Error fetching fulfilment session info ${error}`);
        router.push("/error");
        return;
      }
    };

    Promise.all([fetchFulfilmentEntityInfo(), fetchFulfilmentSessionInfo()]).then(() => {
      setLoading(false);
    });
  }, []);

  const handleNext = async () => {
    try {
      setLoading(true);
      const nextUrl = await getNextFulfilmentEntityUrl(params.fulfilmentSessionId, params.fulfilmentEntityId);
      if (nextUrl) {
        router.push(nextUrl);
      } else {
        fulfilmentSessionEntityPageLogger.info("No next fulfilment entity available");
        setLoading(false);
      }
    } catch (error) {
      fulfilmentSessionEntityPageLogger.error(`Error navigating to next entity: ${error}`);
      // We need to update fulfilment entity info response to show the latest answers
      const getFulfilmentEntityInfoResponse = await getFulfilmentEntityInfo(
        params.fulfilmentSessionId,
        params.fulfilmentEntityId
      );
      setGetFulfilmentEntityInfoResponse(getFulfilmentEntityInfoResponse);
      setErrorMessage("Failed to navigate to the next step. Please try again.");
      setShowErrorAlert(true);
      setLoading(false);
    }
  };

  const handlePrev = async () => {
    try {
      setLoading(true);
      const prevUrl = await getPrevFulfilmentEntityUrl(params.fulfilmentSessionId, params.fulfilmentEntityId);
      if (prevUrl) {
        router.push(prevUrl);
      } else {
        fulfilmentSessionEntityPageLogger.info("No previous fulfilment entity available");
        setLoading(false);
      }
    } catch (error) {
      fulfilmentSessionEntityPageLogger.error(`Error navigating to previous entity: ${error}`);
      setErrorMessage("Failed to navigate to the previous step. Please try again.");
      setShowErrorAlert(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Loading />
        <Alert
          open={showErrorAlert}
          onClose={() => setShowErrorAlert(false)}
          color="red"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
        >
          {errorMessage}
        </Alert>
      </>
    );
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
        return (
          <Alert
            open={showErrorAlert}
            onClose={() => setShowErrorAlert(false)}
            color="red"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
          >
            {errorMessage}
          </Alert>
        );
      }
      router.push(getFulfilmentEntityInfoResponse.url);
      return (
        <Alert
          open={showErrorAlert}
          onClose={() => setShowErrorAlert(false)}
          color="red"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
        >
          {errorMessage}
        </Alert>
      );
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

      const onFormsFulfilmentEntitySaveAndNext = async (): Promise<void> => {
        if (!formResponderRef.current) {
          fulfilmentSessionEntityPageLogger.error("FormResponder ref is not available");
          return;
        }

        try {
          const savedFormResponseId = await formResponderRef.current.save();
          fulfilmentSessionEntityPageLogger.info(
            `Form response saved with ID: ${savedFormResponseId}, fulfilmentSessionId: ${params.fulfilmentSessionId}, fulfilmentEntityId: ${params.fulfilmentEntityId}`
          );

          await handleNext();
        } catch (error) {
          fulfilmentSessionEntityPageLogger.error(`Error saving form and navigating to next: ${error}`);
        }
      };

      return (
        <>
          <FulfilmentEntityPage
            onNext={onFormsFulfilmentEntitySaveAndNext}
            onPrev={async () => await handlePrev()}
            fulfilmentSessionInfo={fulfilmentSessionInfo}
          >
            <FormResponder
              ref={formResponderRef}
              formId={getFulfilmentEntityInfoResponse.formId}
              eventId={getFulfilmentEntityInfoResponse.eventId}
              formResponseId={getFulfilmentEntityInfoResponse.formResponseId}
              fulfilmentInfo={{
                fulfilmentSessionId: params.fulfilmentSessionId,
                fulfilmentEntityId: params.fulfilmentEntityId,
              }}
              canEditForm={true}
              isPreview={false}
            />
          </FulfilmentEntityPage>
          <Alert
            open={showErrorAlert}
            onClose={() => setShowErrorAlert(false)}
            color="red"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
          >
            {errorMessage}
          </Alert>
        </>
      );
    case FulfilmentEntityType.END:
      completeFulfilmentSession(params.fulfilmentSessionId, params.fulfilmentEntityId);
      fulfilmentSessionEntityPageLogger.info(
        `Fulfilment session ended, fulfilmentSessionId: ${params.fulfilmentSessionId}, fulfilmentEntityId: ${params.fulfilmentEntityId}`
      );
      if (getFulfilmentEntityInfoResponse.url === null) {
        fulfilmentSessionEntityPageLogger.error(
          `End Fulfilment Entity URL is null when it should not be, fulfilmentSessionId: ${
            params.fulfilmentSessionId
          }, fulfilmentEntityId: ${params.fulfilmentEntityId}, getFulfilmentEntityInfoResponse: ${JSON.stringify(
            getFulfilmentEntityInfoResponse
          )}`
        );
        router.push("https://sportshub.net.au/dashboard");
        return (
          <Alert
            open={showErrorAlert}
            onClose={() => setShowErrorAlert(false)}
            color="red"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
          >
            {errorMessage}
          </Alert>
        );
      }
      router.push(getFulfilmentEntityInfoResponse.url);
      return (
        <Alert
          open={showErrorAlert}
          onClose={() => setShowErrorAlert(false)}
          color="red"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
        >
          {errorMessage}
        </Alert>
      );
    default:
      return (
        <>
          <div className="mt-14">Unknown Fulfilment Entity Type</div>
          <Alert
            open={showErrorAlert}
            onClose={() => setShowErrorAlert(false)}
            color="red"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
          >
            {errorMessage}
          </Alert>
        </>
      );
  }
};

export default FulfilmentSessionEntityPage;
