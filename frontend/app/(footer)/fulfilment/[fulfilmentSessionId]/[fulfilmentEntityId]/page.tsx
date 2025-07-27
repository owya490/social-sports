"use client";

import Loading from "@/components/loading/Loading";
import {
  FulfilmentEntityId,
  FulfilmentEntityType,
  FulfilmentSessionId,
  GetFulfilmentEntityInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getFulfilmentEntityInfo } from "@/services/src/fulfilment/fulfilmentServices";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  if (loading) {
    return <Loading />;
  }

  switch (getFulfilmentEntityInfoResponse?.type) {
    case FulfilmentEntityType.STRIPE:
      if (getFulfilmentEntityInfoResponse.url === null) {
        fulfilmentSessionEntityPageLogger.error(
          `Stripe Fulfilment Entity URL is null when it should not be, getFulfilmentEntityInfoResponse: ${JSON.stringify(
            getFulfilmentEntityInfoResponse
          )}`
        );
        router.push("/error");
        return;
      }
      router.push(getFulfilmentEntityInfoResponse.url);
    case FulfilmentEntityType.FORMS:
      return (
        // <FormResponder
        //   formId={getFulfilmentEntityInfoResponse.formId}
        //   eventId={getFulfilmentEntityInfoResponse.eventId}
        // />
        <div></div>
      );
    case FulfilmentEntityType.END:
      if (getFulfilmentEntityInfoResponse.url === null) {
        fulfilmentSessionEntityPageLogger.error(
          `End Fulfilment Entity URL is null when it should not be, getFulfilmentEntityInfoResponse: ${JSON.stringify(
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
