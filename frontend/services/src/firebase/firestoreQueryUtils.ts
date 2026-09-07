/** Firestore `in` / `array-contains-any` disjunction limit. */
export const FIRESTORE_IN_QUERY_LIMIT = 30;

export function chunkForInQuery<T>(values: T[]): T[][] {
  const unique: T[] = [];
  const seen = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    unique.push(value);
  }

  const chunks: T[][] = [];
  for (let index = 0; index < unique.length; index += FIRESTORE_IN_QUERY_LIMIT) {
    chunks.push(unique.slice(index, index + FIRESTORE_IN_QUERY_LIMIT));
  }
  return chunks;
}
