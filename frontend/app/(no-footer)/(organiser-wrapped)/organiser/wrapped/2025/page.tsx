"use client";

import { BackButton } from "@/components/organiser/wrapped/BackButton";
import { ProgressIndicator } from "@/components/organiser/wrapped/ProgressIndicator";
import { ShareSection } from "@/components/organiser/wrapped/sections/ShareSection";
import { WrappedContent } from "@/components/organiser/wrapped/WrappedContent";
import { WrappedError } from "@/components/organiser/wrapped/WrappedError";
import { WrappedLoading } from "@/components/organiser/wrapped/WrappedLoading";
import { useUser } from "@/components/utility/UserContext";
import { SportshubWrapped } from "@/interfaces/WrappedTypes";
import { Logger } from "@/observability/logger";
import { getWrappedData } from "@/services/src/wrapped/wrappedServices";
import { useEffect, useState } from "react";

const WRAPPED_YEAR = 2025;
const MIN_LOADING_TIME_MS = 10000;

const wrappedPageLogger = new Logger("wrappedPageLogger");

export default function WrappedPage() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SportshubWrapped | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWrappedData = async () => {
      if (!user.userId) {
        return;
      }

      const startTime = Date.now();

      try {
        wrappedPageLogger.info(`Fetching wrapped data for user: ${user.userId}`);
        const wrappedData = await getWrappedData(user.userId, WRAPPED_YEAR);
        setData(wrappedData);
        wrappedPageLogger.info(`Successfully fetched wrapped data for user: ${user.userId}`);
      } catch (err) {
        wrappedPageLogger.error(`Failed to fetch wrapped data: ${err}`);
        setError("Failed to load your wrapped data. Please try again later.");
      } finally {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsed);

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    fetchWrappedData();
  }, []);

  if (isLoading || !data) {
    return <WrappedLoading />;
  }

  if (error) {
    return (
      <WrappedError
        message={error}
        linkHref="/organiser/dashboard"
        linkText="Return to Dashboard"
        className="-mt-[var(--navbar-height)]"
      />
    );
  }

  return (
    <WrappedContent
      data={data}
      className="-mt-[var(--navbar-height)]"
      headerElements={
        <>
          <BackButton />
          <ProgressIndicator />
        </>
      }
      footerSection={
        <ShareSection
          organiserName={data.organiserName || "Organiser"}
          year={data.year || WRAPPED_YEAR}
          wrappedId={data.wrappedId || ""}
        />
      }
    />
  );
}
