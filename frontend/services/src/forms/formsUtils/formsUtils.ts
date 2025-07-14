// TODO: functions to abstract away editing forms

import { FormId, FormResponseId, SectionId } from "@/interfaces/FormTypes";
import { FormResponsePaths, FormTemplatePaths } from "../formsConstants";
import { db } from "../../firebase";
import { doc, DocumentData, DocumentReference, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { formsServiceLogger } from "../formsServices";
import { EventId } from "@/interfaces/EventTypes";

/**
 * Searches all form template subcollections for a document reference matching the given form ID.
 *
 * @param formId - The unique identifier of the form to locate
 * @returns The Firestore document reference for the form if found
 * @throws If no matching form document is found in any subcollection
 */
export async function findFormDocRef(formId: FormId): Promise<DocumentReference<DocumentData, DocumentData>> {
  try {
    // Search through paths
    for (const path of Object.values(FormTemplatePaths)) {
      // Attempt to retrieve the document from current subcollection
      const formDocRef = doc(db, path, formId);
      const formDoc = await getDoc(formDocRef);
      if (formDoc.exists()) {
        formsServiceLogger.info(`Found form document reference for formId: ${formId}, form: ${formDoc}`);
        return formDocRef;
      }
    }

    // If no document found, log and throw an error
    formsServiceLogger.error(`Form document reference not found in any subcollection for formId: ${formId}`);
    throw new Error(`No form document reference found in any subcollection with formId: ${formId}`);
  } catch (error) {
    formsServiceLogger.error(`findFormDoc: Failed to find form doc reference: ${error}`);
    throw error;
  }
}

export async function findFormDoc(formId: FormId): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    const formDocRef = await findFormDocRef(formId);
    const formDoc = await getDoc(formDocRef);

    if (formDoc.exists()) {
      formsServiceLogger.info(`Found form document for formId: ${formId}, form: ${formId}`);
      return formDoc;
    }
    throw new Error(`No form document found in any subcollection with formId: ${formId}`);
  } catch (error) {
    formsServiceLogger.error(`findFormDoc: Failed to find form doc: ${error}`);
    throw error;
  }
}

/**
 * Searches all configured subcollections to locate and return a Firestore document reference for a specific form response.
 *
 * @param formId - The ID of the form associated with the response
 * @param eventId - The ID of the event associated with the response
 * @param formResponseId - The unique identifier of the form response to locate
 * @returns The Firestore document reference for the matching form response
 * @throws If no matching form response document is found in any subcollection
 */
export async function findFormResponseDocRef(
  formId: FormId,
  eventId: EventId,
  formResponseId: FormResponseId
): Promise<DocumentReference<DocumentData, DocumentData>> {
  try {
    // Search through paths
    for (const path of Object.values(FormResponsePaths)) {
      const formResponseDocRef = doc(db, path, formId, eventId, formResponseId);
      const formDoc = await getDoc(formResponseDocRef);

      if (formDoc.exists()) {
        formsServiceLogger.info(
          `findFormResponseDocRef: Found form response document reference for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
        );
        return formResponseDocRef;
      }
    }

    formsServiceLogger.error(
      `findFormResponseDocRef: Form response document reference not found in any subcollection for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
    throw new Error(
      `findFormResponseDocRef: No form response document reference found in any subcollection with formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
  } catch (error) {
    formsServiceLogger.error(`findFormResponseDocRef: Failed to find form response doc reference: ${error}`);
    throw error;
  }
}

export async function findFormResponseDoc(
  formId: FormId,
  eventId: EventId,
  formResponseId: FormResponseId
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    const formResponseDocRef = await findFormResponseDocRef(formId, eventId, formResponseId);
    const formResponseDoc = await getDoc(formResponseDocRef);
    if (formResponseDoc.exists()) {
      formsServiceLogger.info(
        `findFormResponseDoc: Found form response document for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
      );
      return formResponseDoc;
    }

    formsServiceLogger.error(
      `findFormResponseDoc: Form response document not found in any subcollection for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
    throw new Error("findFormResponseDoc: Form response not found.");
  } catch (error) {
    formsServiceLogger.error(`findFormResponseDoc: Failed to find form response doc: ${error}`);
    throw error;
  }
}
export function archiveSection(sectionId: SectionId): void {
  // TODO
}
