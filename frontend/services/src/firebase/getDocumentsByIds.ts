import { DocumentData, collection, documentId, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { chunkIds } from "./chunkIds";

/** Firestore `in` queries accept at most 30 comparison values. */
export const FIRESTORE_IN_QUERY_LIMIT = 30;

export { chunkIds } from "./chunkIds";

/**
 * Load many documents by id with `in` queries instead of one getDoc RPC each.
 * Missing ids throw via `notFoundError` so callers keep fail-fast behavior.
 */
export async function getDocumentsByIds<T>(
  collectionPath: string,
  ids: string[],
  mapDoc: (id: string, data: DocumentData) => T,
  notFoundError: (id: string) => Error
): Promise<T[]> {
  if (ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const snapshots = await Promise.all(
    chunkIds(uniqueIds, FIRESTORE_IN_QUERY_LIMIT).map((chunk) =>
      getDocs(query(collection(db, collectionPath), where(documentId(), "in", chunk)))
    )
  );

  const byId = new Map<string, T>();
  for (const snapshot of snapshots) {
    snapshot.forEach((docSnap) => {
      byId.set(docSnap.id, mapDoc(docSnap.id, docSnap.data()));
    });
  }

  return uniqueIds.map((id) => {
    const value = byId.get(id);
    if (value === undefined) {
      throw notFoundError(id);
    }
    return value;
  });
}
