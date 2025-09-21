"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import FormResponder, { FormResponderRef } from "@/components/forms/FormResponder";
import UnsavedChangesModal from "@/components/forms/UnsavedChangesModal";
import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import {
  FulfilmentEntityId,
  FulfilmentEntityType,
  FulfilmentSessionId,
  GetFulfilmentEntityInfoResponse,
  GetFulfilmentSessionInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { URL } from "@/interfaces/Types";
import { Logger } from "@/observability/logger";
import {
  getFulfilmentEntityInfo,
  getFulfilmentSessionInfo,
  getNextFulfilmentEntityUrl,
  getPrevFulfilmentEntityUrl,
} from "@/services/src/fulfilment/fulfilmentServices";
import { HomeIcon } from "@heroicons/react/24/outline";
import { Alert } from "@material-tailwind/react";
import Link from "next/link";
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
  const [areAllRequiredFieldsFilled, setAreAllRequiredFieldsFilled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Unsaved changes modal state
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

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
        fulfilmentSessionEntityPageLogger.info(`fulfilmentSessionInfo: ${JSON.stringify(fulfilmentSessionInfo)}`);
      } catch (error) {
        fulfilmentSessionEntityPageLogger.error(`Error fetching fulfilment session info ${error}`);
        router.push("/error");
        return;
      }
    };

    Promise.all([fetchFulfilmentEntityInfo(), fetchFulfilmentSessionInfo()]).then(() => {
      setLoading(false);
    });
  }, [params.fulfilmentSessionId, params.fulfilmentEntityId, router]);

  const handleValidationChange = (isValid: boolean) => {
    setAreAllRequiredFieldsFilled(isValid);
  };

  const handleSaveLoadingChange = (isLoading: boolean) => {
    setIsSaving(isLoading);
  };

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
      try {
        // Update fulfilment entity info response to show the latest answers
        const refreshed = await getFulfilmentEntityInfo(params.fulfilmentSessionId, params.fulfilmentEntityId);
        setGetFulfilmentEntityInfoResponse(refreshed);
      } catch (refreshError) {
        fulfilmentSessionEntityPageLogger.error(`Error refreshing fulfilment entity info: ${refreshError}`);
      } finally {
        setErrorMessage("Failed to navigate to the next step. Please try again.");
        setShowErrorAlert(true);
        setLoading(false);
      }
    }
  };

  const handlePrev = async () => {
    // Check if there are unsaved changes
    if (formResponderRef.current?.hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);
      return;
    }

    // If no unsaved changes, proceed with navigation
    await navigateToPrev();
  };

  const navigateToPrev = async () => {
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
      try {
        // We need to update fulfilment entity info response to show the latest answers
        const getFulfilmentEntityInfoResponse = await getFulfilmentEntityInfo(
          params.fulfilmentSessionId,
          params.fulfilmentEntityId
        );
        setGetFulfilmentEntityInfoResponse(getFulfilmentEntityInfoResponse);
      } catch (refreshError) {
        fulfilmentSessionEntityPageLogger.error(`Error refreshing fulfilment entity info: ${refreshError}`);
      } finally {
        setErrorMessage("Failed to navigate to the previous step. Please try again.");
        setShowErrorAlert(true);
        setLoading(false);
      }
    }
  };

  const handleUnsavedChangesConfirm = async () => {
    setShowUnsavedChangesModal(false);
    await navigateToPrev();
  };

  const handleUnsavedChangesCancel = () => {
    setShowUnsavedChangesModal(false);
  };

  const renderErrorAlert = () => (
    <Alert
      open={showErrorAlert}
      onClose={() => setShowErrorAlert(false)}
      color="red"
      className="fixed top-4 left-1/2 transform -translate-x-1/2 w-fit z-50"
    >
      {errorMessage}
    </Alert>
  );

  if (loading) {
    return (
      <>
        <Loading />
        {renderErrorAlert()}
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
        return renderErrorAlert();
      }
      router.push(getFulfilmentEntityInfoResponse.url.toString());
      return renderErrorAlert();
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

      // Determine if we should show prev/next buttons based on current position
      const currentIndex = fulfilmentSessionInfo?.currentEntityIndex ?? 0;
      const totalEntities = fulfilmentSessionInfo?.fulfilmentEntityTypes?.length ?? 0;
      const isFirstEntity = currentIndex === 0;
      const isLastEntity = currentIndex === totalEntities - 1;

      return (
        <>
          <FulfilmentEntityPage
            onNext={onFormsFulfilmentEntitySaveAndNext}
            onPrev={async () => await handlePrev()}
            showPrevButton={!isFirstEntity}
            showNextButton={!isLastEntity}
            fulfilmentSessionInfo={fulfilmentSessionInfo}
            areAllRequiredFieldsFilled={areAllRequiredFieldsFilled}
            isSaving={isSaving}
            fulfilmentSessionId={params.fulfilmentSessionId}
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
              onValidationChange={handleValidationChange}
              onSaveLoadingChange={handleSaveLoadingChange}
            />
          </FulfilmentEntityPage>
          <UnsavedChangesModal
            isOpen={showUnsavedChangesModal}
            onConfirm={handleUnsavedChangesConfirm}
            onCancel={handleUnsavedChangesCancel}
          />
          {renderErrorAlert()}
        </>
      );
    case FulfilmentEntityType.END:
      return (
        <EndFulfilmentHandler
          fulfilmentSessionId={params.fulfilmentSessionId}
          fulfilmentEntityId={params.fulfilmentEntityId}
          url={getFulfilmentEntityInfoResponse.url}
          logger={fulfilmentSessionEntityPageLogger}
        />
      );
    default:
      return (
        <>
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="screen-width-dashboard text-center px-4">
              {/* 404 Number */}
              <div className="mb-8">
                <h1 className="text-9xl font-extrabold text-core-text opacity-20">404</h1>
              </div>

              {/* Main Content */}
              <div className="max-w-md mx-auto mb-12">
                <h2 className="text-3xl font-bold text-core-text mb-4">Unknown Fulfilment Entity Type</h2>
                <p className="text-lg text-gray-600 mb-8 font-light">
                  We encountered an unexpected fulfilment entity type that we don&apos;t recognize. This might be due to
                  a configuration issue or an outdated link.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/dashboard">
                  <HighlightButton text="Go to Dashboard" className="flex items-center gap-2">
                    <HomeIcon className="h-5 w-5" />
                  </HighlightButton>
                </Link>
              </div>
            </div>
          </div>
          {renderErrorAlert()}
        </>
      );
  }
};

function EndFulfilmentHandler({
  fulfilmentSessionId,
  fulfilmentEntityId,
  url,
  logger,
}: {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  url: URL | null;
  logger: Logger;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        logger.info(
          `Fulfilment session ended, fulfilmentSessionId: ${fulfilmentSessionId}, fulfilmentEntityId: ${fulfilmentEntityId}`
        );
        if (url) {
          router.push(url as unknown as string);
        } else {
          logger.error(
            `End Fulfilment Entity URL is null when it should not be, fulfilmentSessionId: ${fulfilmentSessionId}, fulfilmentEntityId: ${fulfilmentEntityId}`
          );
          router.push("/dashboard");
        }
      } catch (error) {
        if (!cancelled) {
          logger.error(`Error completing session: ${error}`);
          router.push("/error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fulfilmentSessionId, fulfilmentEntityId, url, router]);

  return <Loading />;
}

export default FulfilmentSessionEntityPage;
