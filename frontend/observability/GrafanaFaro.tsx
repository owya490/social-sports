"use client";
import getEnvironment, { Environment } from "@/utilities/environment";
import type { Faro } from "@grafana/faro-core";
import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { useLayoutEffect, useRef } from "react";

export default function GrafanaFaro(props: { children: React.ReactNode }) {
  const faroRef = useRef<Faro | null>(null);

  useLayoutEffect(() => {
    const { url, env } = getUrlAndEnvironment();
    let paused = false;
    if (env === Environment.DEVELOPMENT) {
      paused = true;
      console.log(paused);
      console.log(url);
    }
    if (!faroRef.current) {
      faroRef.current = initializeFaro({
        paused: paused,
        url: url,
        app: {
          name: "Sports Hub",
          version: "1.0.0",
          environment: env,
        },

        instrumentations: [
          // Mandatory, overwriting the instrumentations array would cause the default instrumentations to be omitted
          ...getWebInstrumentations(),

          // Initialization of the tracing package.
          // This packages is optional because it increases the bundle size noticeably. Only add it if you want tracing data.
          new TracingInstrumentation(),
        ],
      });
    }
  }, []);
  return <>{props.children}</>;
}

function getUrlAndEnvironment(): { url: string; env: Environment } {
  let url = "dud.com";
  let env = Environment.DEVELOPMENT;

  switch (getEnvironment()) {
    case Environment.PREVIEW: {
      url =
        "https://faro-collector-prod-au-southeast-1.grafana.net/collect/6dfb35745e2a9d2aa277fe712536a793";
      env = Environment.PREVIEW;
      break;
    }
    case Environment.PRODUCTION: {
      url =
        "https://faro-collector-prod-au-southeast-1.grafana.net/collect/641616bbf5ed87939de6443e0e3b08ad";
      env = Environment.PRODUCTION;
      break;
    }
  }

  return { url, env };
}
