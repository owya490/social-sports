"use client";

import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventFormAttachmentIntent, EventFormAttachmentResult, EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { EventFormAttachmentTargetError, updateEventFormAttachment } from "@/services/src/events/eventsService";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useEventFormAttachment({ eventId, canSave, isCurrentAccount, onSaved, onReloadTargets }: {
  eventId: EventId;
  canSave: boolean;
  isCurrentAccount: () => boolean;
  onSaved: (result: EventFormAttachmentResult) => void;
  onReloadTargets: () => Promise<void>;
}) {
  const logger = useMemo(() => new Logger("EventHubRegistration"), []);
  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReloadingTargets, setIsReloadingTargets] = useState(false);
  const [targetRecovery, setTargetRecovery] = useState<"reload" | "choose" | "apply" | null>(null);
  const [intent, setIntent] = useState<EventFormAttachmentIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<EventFormAttachmentResult | null>(null);
  const [revision, setRevision] = useState(0);
  const inFlightRef = useRef(false);
  const lifetimeRef = useRef({ active: true, generation: 0 });
  const optionsRef = useRef({ canSave, isCurrentAccount, onSaved, onReloadTargets, targetRecovery });
  optionsRef.current = { canSave, isCurrentAccount, onSaved, onReloadTargets, targetRecovery };

  useEffect(() => {
    const lifetime = lifetimeRef.current;
    lifetime.active = true;
    lifetime.generation += 1;
    return () => {
      lifetime.active = false;
      lifetime.generation += 1;
    };
  }, []);

  const save = useCallback(async (requested: EventFormAttachmentIntent) => {
    if (inFlightRef.current || !lifetimeRef.current.active || !optionsRef.current.isCurrentAccount() || !optionsRef.current.canSave || requested.eventId !== eventId ||
      optionsRef.current.targetRecovery === "reload" || optionsRef.current.targetRecovery === "choose") return;
    inFlightRef.current = true;
    const generation = lifetimeRef.current.generation;
    const isCurrentGeneration = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation;
    const isCurrent = () => isCurrentGeneration() && optionsRef.current.isCurrentAccount();
    setIsSaving(true);
    setIntent(requested);
    setError(null);
    setTargetRecovery(null);
    setSavedResult(null);
    try {
      let result: EventFormAttachmentResult;
      try {
        result = await updateEventFormAttachment(requested);
      } catch (err) {
        if (isCurrent()) {
          logger.error(`Failed to ${requested.formId ? "attach" : "detach"} form: ${err}`);
          setError(err instanceof EventFormAttachmentTargetError
            ? err.message
            : `The form could not be ${requested.formId ? "attached" : "detached"}. Your choice is kept. Please try again.`);
          if (err instanceof EventFormAttachmentTargetError) setTargetRecovery("reload");
        }
        return;
      }
      if (!isCurrent()) return;
      optionsRef.current.onSaved(result);
      if (!isCurrent()) return;
      setIntent(null);
      setSavedResult(result);
      setRevision((current) => current + 1);
      setPanelOpen(false);
    } finally {
      if (isCurrentGeneration()) {
        inFlightRef.current = false;
        setIsSaving(false);
      }
    }
  }, [eventId, logger]);

  const reloadTargets = useCallback(async () => {
    if (inFlightRef.current || !lifetimeRef.current.active || !optionsRef.current.isCurrentAccount() || !optionsRef.current.canSave || optionsRef.current.targetRecovery !== "reload") return;
    inFlightRef.current = true;
    const generation = lifetimeRef.current.generation;
    const isCurrentGeneration = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation;
    const isCurrent = () => isCurrentGeneration() && optionsRef.current.isCurrentAccount();
    setIsReloadingTargets(true);
    try {
      await optionsRef.current.onReloadTargets();
      if (!isCurrent()) return;
      setSelectedTypeId(null);
      setTargetRecovery("choose");
      setError(null);
    } catch (err) {
      if (isCurrent()) {
        logger.error(`Failed to reload form attachment targets: ${err}`);
        setError("Ticket types could not be reloaded. Your form choice is kept. Retry loading ticket types.");
      }
    } finally {
      if (isCurrentGeneration()) {
        inFlightRef.current = false;
        setIsReloadingTargets(false);
      }
    }
  }, [logger]);

  const selectType = useCallback((typeId: EventTicketTypeId | null) => {
    if (inFlightRef.current || !lifetimeRef.current.active || !optionsRef.current.isCurrentAccount() || optionsRef.current.targetRecovery === "reload") return;
    setSelectedTypeId(typeId);
    if (optionsRef.current.targetRecovery) {
      setIntent((current) => current ? { ...current, target: typeId
        ? { kind: "ticketType", eventTicketTypeId: typeId }
        : { kind: "legacyEvent" } } : null);
      setTargetRecovery("apply");
    } else {
      setIntent(null);
    }
    setError(null);
    setSavedResult(null);
  }, []);

  const showPanel = useCallback((open: boolean) => {
    if (!inFlightRef.current && lifetimeRef.current.active && optionsRef.current.isCurrentAccount()) setPanelOpen(open);
  }, []);

  return { selectedTypeId, selectType, panelOpen, showPanel, isSaving, isReloadingTargets, targetRecovery, reloadTargets, intent, error, savedResult, revision, save };
}

export type EventFormAttachmentController = ReturnType<typeof useEventFormAttachment>;
