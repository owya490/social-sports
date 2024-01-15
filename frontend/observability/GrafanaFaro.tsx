"use client";
import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { useEffect } from "react";

export default function GrafanaFaro(props: { children: React.ReactNode }) {
  useEffect(() => {
    var faro = initializeFaro({
      url: "https://faro-collector-prod-au-southeast-1.grafana.net/collect/641616bbf5ed87939de6443e0e3b08ad",
      app: {
        name: "Sports Hub",
        version: "1.0.0",
        environment: "production",
      },

      instrumentations: [
        // Mandatory, overwriting the instrumentations array would cause the default instrumentations to be omitted
        ...getWebInstrumentations(),

        // Initialization of the tracing package.
        // This packages is optional because it increases the bundle size noticeably. Only add it if you want tracing data.
        new TracingInstrumentation(),
      ],
    });
  });
  return <>{props.children}</>;
}
