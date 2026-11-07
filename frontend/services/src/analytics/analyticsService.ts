import { sendGAEvent } from "@next/third-parties/google";
import { Environment, getEnvironment } from "../../../utilities/environment";

export type AnalyticsValue = string | number | boolean;

export const AnalyticsEvent = {
  SCREEN_VIEW: "screen_view",
  ORGANISER_CHECKLIST_CLICK: "organiser_checklist_click",
  ORGANISER_CHECKLIST_COMPLETE: "organiser_checklist_complete",
  ORGANISER_EVENT_CARD_OPEN: "organiser_event_card_open",
  ORGANISER_CREATE_EVENT_STEP: "organiser_create_event_step",
  ORGANISER_EVENT_CREATE: "organiser_event_create",
  ORGANISER_EVENT_EDIT: "organiser_event_edit",
  ORGANISER_BOOKING_DECISION: "organiser_booking_decision",
  ORGANISER_ATTENDEE_TAB: "organiser_attendee_tab",
  ORGANISER_ATTENDEE_ADD: "organiser_attendee_add",
  ORGANISER_ATTENDEE_EDIT_TICKETS: "organiser_attendee_edit_tickets",
  ORGANISER_ATTENDEE_REMOVE: "organiser_attendee_remove",
  ORGANISER_ATTENDEE_EXPORT: "organiser_attendee_export",
  ORGANISER_FORM_RESPONSE_VIEW: "organiser_form_response_view",
  ORGANISER_FORM_RESPONSE_ADD: "organiser_form_response_add",
  ORGANISER_FORM_RESPONSE_EXPORT: "organiser_form_response_export",
  ORGANISER_EVENT_IMAGE_CHANGE: "organiser_event_image_change",
  ORGANISER_EVENT_SETTING_CHANGE: "organiser_event_setting_change",
  ORGANISER_EVENT_DELETE: "organiser_event_delete",
  ORGANISER_RECURRING_TEMPLATE_CREATE: "organiser_recurring_template_create",
  ORGANISER_RECURRING_TEMPLATE_OPEN: "organiser_recurring_template_open",
  ORGANISER_RECURRING_TEMPLATE_UPDATE: "organiser_recurring_template_update",
  ORGANISER_COLLECTION_CREATE: "organiser_collection_create",
  ORGANISER_COLLECTION_UPDATE: "organiser_collection_update",
  ORGANISER_COLLECTION_VISIBILITY_CHANGE: "organiser_collection_visibility_change",
  ORGANISER_COLLECTION_ITEM_CHANGE: "organiser_collection_item_change",
  ORGANISER_COLLECTION_DELETE: "organiser_collection_delete",
  ORGANISER_CUSTOM_LINK_CREATE: "organiser_custom_link_create",
  ORGANISER_CUSTOM_LINK_COPY: "organiser_custom_link_copy",
  ORGANISER_CUSTOM_LINK_DELETE: "organiser_custom_link_delete",
  ORGANISER_FORM_CREATE: "organiser_form_create",
  ORGANISER_FORM_SECTION_ADD: "organiser_form_section_add",
  ORGANISER_FORM_SECTION_REORDER: "organiser_form_section_reorder",
  ORGANISER_FORM_SECTION_REMOVE: "organiser_form_section_remove",
  ORGANISER_FORM_SAVE: "organiser_form_save",
  ORGANISER_FORM_SAVE_DISCARD: "organiser_form_save_discard",
  ORGANISER_FORM_PREVIEW: "organiser_form_preview",
  ORGANISER_GALLERY_UPLOAD: "organiser_gallery_upload",
  ORGANISER_STRIPE_SETUP_START: "organiser_stripe_setup_start",
  ORGANISER_STRIPE_SETUP_RETURN: "organiser_stripe_setup_return",
  ORGANISER_WRAPPED_SECTION: "organiser_wrapped_section",
  ORGANISER_WRAPPED_SHARE: "organiser_wrapped_share",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

const MAX_PARAM_LENGTH = 100;
const MAX_PARAMS = 25;
const MAX_DELIVERY_ATTEMPTS = 3;

type AnalyticsParams = Record<string, AnalyticsValue | null | undefined>;

function sanitizeParams(params: AnalyticsParams | undefined): Record<string, AnalyticsValue> {
  const safe: Record<string, AnalyticsValue> = {};
  if (!params) {
    return safe;
  }

  let count = 0;
  for (const [key, value] of Object.entries(params)) {
    if (count >= MAX_PARAMS) {
      break;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        continue;
      }
      safe[key] = trimmed.slice(0, MAX_PARAM_LENGTH);
      count += 1;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      safe[key] = value;
      count += 1;
    } else if (typeof value === "boolean") {
      safe[key] = value;
      count += 1;
    }
  }
  return safe;
}

function deliver(eventName: string, params: Record<string, AnalyticsValue>, attempt: number): void {
  try {
    if (typeof window === "undefined") {
      return;
    }
    const dataLayer = (window as Window & { dataLayer?: unknown }).dataLayer;
    if (dataLayer === undefined && attempt < MAX_DELIVERY_ATTEMPTS) {
      window.setTimeout(() => deliver(eventName, params, attempt + 1), 400);
      return;
    }
    sendGAEvent("event", eventName, params);
  } catch {
    // Analytics must never surface to the user.
  }
}

/**
 * Records a product analytics event. Failures, ad blockers, and a missing tag are ignored.
 * Events are sent only in production. `screen_view` is separate from the tag's automatic
 * `page_view`, which only fires on a full page load.
 */
export function trackEvent(name: string, params?: AnalyticsParams): void {
  try {
    const eventName = typeof name === "string" ? name.trim() : "";
    if (!eventName || typeof window === "undefined") {
      return;
    }
    if (getEnvironment() !== Environment.PRODUCTION) {
      return;
    }
    const safeParams = sanitizeParams(params);
    queueMicrotask(() => deliver(eventName, safeParams, 0));
  } catch {
    // Analytics must never surface to the user.
  }
}

export function trackScreen(pageTemplate: string, pagePath: string, pageGroup: string): void {
  trackEvent(AnalyticsEvent.SCREEN_VIEW, {
    page_template: pageTemplate,
    page_path: pagePath,
    page_group: pageGroup,
  });
}
