"use client";

import { Logger } from "@/observability/logger";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { parseTicketQrPayload, ScannedTicketPreview } from "./parseTicketQr";

const logger = new Logger("EventHubQrScanner");

type QrBarcodeDetector = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

type EventHubQrScannerProps = {
  paused: boolean;
  onScan: (preview: ScannedTicketPreview) => void;
  onInvalidCode?: () => void;
};

function tryCreateBarcodeDetector(): QrBarcodeDetector | null {
  const Detector = (
    globalThis as {
      BarcodeDetector?: new (options: { formats: string[] }) => QrBarcodeDetector;
    }
  ).BarcodeDetector;
  if (!Detector) return null;
  try {
    return new Detector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera permission was denied. Allow camera access to scan tickets.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found on this device.";
  }
  if (name === "NotReadableError") {
    return "The camera is already in use by another app.";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Camera access needs a secure (HTTPS) connection.";
  }
  return "Couldn't start the camera.";
}

export function EventHubQrScanner({ paused, onScan, onInvalidCode }: EventHubQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const lockRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onInvalidRef = useRef(onInvalidCode);
  const lastInvalidAtRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) lockRef.current = false;
  }, [paused]);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onInvalidRef.current = onInvalidCode;
  }, [onInvalidCode]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let stream: MediaStream | null = null;
    let cancelled = false;
    let rafId = 0;
    let detecting = false;
    const detector = tryCreateBarcodeDetector();
    let detectorActive = detector !== null;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const handleDecoded = (raw: string) => {
      if (pausedRef.current || lockRef.current) return;
      const preview = parseTicketQrPayload(raw);
      if (preview) {
        lockRef.current = true;
        onScanRef.current(preview);
        return;
      }
      const now = Date.now();
      if (now - lastInvalidAtRef.current > 2500) {
        lastInvalidAtRef.current = now;
        onInvalidRef.current?.();
      }
    };

    const tick = () => {
      if (cancelled) return;
      rafId = window.requestAnimationFrame(tick);
      if (pausedRef.current || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !ctx) {
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      if (detectorActive && detector) {
        if (!detecting) {
          detecting = true;
          void detector
            .detect(canvas)
            .then((codes) => {
              if (pausedRef.current || cancelled) return;
              const raw = codes[0]?.rawValue;
              if (raw) handleDecoded(raw);
            })
            .catch((detectError) => {
              detectorActive = false;
              logger.warn(`BarcodeDetector failed, falling back to jsQR: ${detectError}`);
            })
            .finally(() => {
              detecting = false;
            });
        }
        return;
      }

      const image = ctx.getImageData(0, 0, width, height);
      const code = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) handleDecoded(code.data);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser cannot open the camera.");
        setStarting(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        setStarting(false);
        rafId = window.requestAnimationFrame(tick);
      } catch (startError) {
        if (cancelled) return;
        logger.warn(`Failed to start check-in camera: ${startError}`);
        setError(cameraErrorMessage(startError));
        setStarting(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-[3/4] sm:aspect-[4/3] max-h-[min(70vh,36rem)]">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
        autoPlay
        aria-label="Ticket QR scanner camera"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-[58%] w-[72%] max-w-xs">
          <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-2 border-l-2 border-white/90" />
          <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-2 border-r-2 border-white/90" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-white/90" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-white/90" />
        </div>
      </div>

      {starting ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-sm text-white font-sans">Starting camera…</p>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
          <p className="text-sm text-white font-sans text-center max-w-xs leading-relaxed">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
