// TODO: functions to abstract away editing forms

import { FormId, FormSection, SectionId } from "@/interfaces/FormTypes";
import { FormPaths } from "../formsConstants";
import { db } from "../../firebase";
import { doc, DocumentData, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { formsServiceLogger } from "../formsServices";

export async function findFormDoc(formId: FormId): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    // Search through paths
    for (const path of Object.values(FormPaths)) {
      // Attempt to retrieve the document from current subcollection
      const formDocRef = doc(db, path, formId);
      const formDoc = await getDoc(formDocRef);

      if (formDoc.exists()) {
        formsServiceLogger.info(`Found form document reference for formId: ${formId}, form: ${formDoc}`);
        return formDoc;
      }
    }

    // If no document found, log and throw an error
    formsServiceLogger.error(`Form document not found in any subcollection for formId: ${formId}`);
    throw new Error("No form found in any subcollection");
  } catch (error) {
    formsServiceLogger.error(`findFormDoc Error: failed to find form doc: ${error}`);
    throw error;
  }
}

export function archiveSection(sectionId: SectionId): void {}
