"use client";

import { PublicFooterSection } from "@/components/organiser/wrapped/sections/PublicFooterSection";
import { WrappedContent } from "@/components/organiser/wrapped/WrappedContent";
import { WrappedError } from "@/components/organiser/wrapped/WrappedError";
import { WrappedLoading } from "@/components/organiser/wrapped/WrappedLoading";
import { SportshubWrapped } from "@/interfaces/WrappedTypes";
import { Logger } from "@/observability/logger";
import { getUsernameMapping } from "@/services/src/users/usersService";
import { getWrappedData } from "@/services/src/wrapped/wrappedServices";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const WRAPPED_YEAR = 2025;
const MIN_LOADING_TIME_MS = 3000;

const publicWrappedPageLogger = new Logger("publicWrappedPageLogger");

export default function PublicWrappedPage({ params }: { params: { id: string } }) {
  const username = params.id;
  const searchParams = useSearchParams();
  const wrappedId = searchParams.get("wrappedId");

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<SportshubWrapped | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWrappedData = async () => {
      if (!wrappedId) {
        setError("Invalid share link - missing wrappedId");
        setIsLoading(false);
        return;
      }

      const startTime = Date.now();

      try {
        publicWrappedPageLogger.info(`Fetching public wrapped data for username: ${username}`);

        const usernameMapping = await getUsernameMapping(username);
        const organiserId = usernameMapping.userId;

        const wrappedData = await getWrappedData(organiserId, WRAPPED_YEAR, wrappedId);
        setData(wrappedData);

        publicWrappedPageLogger.info(`Successfully fetched public wrapped data for username: ${username}`);
      } catch (err) {
        publicWrappedPageLogger.error(`Failed to fetch public wrapped data: ${err}`);
        setError("This wrapped link is invalid or has expired.");
      } finally {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME_MS - elapsed);

        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    };

    fetchWrappedData();
  }, [username, wrappedId]);

  if (isLoading) {
    return <WrappedLoading />;
  }

  if (error || !data) {
    return <WrappedError message={error || "Something went wrong"} />;
  }

  return (
    <WrappedContent
      data={data}
      footerSection={
        <PublicFooterSection
          organiserName={data.organiserName || "Organiser"}
          year={data.year || WRAPPED_YEAR}
          username={username}
        />
      }
    />
  );
}
