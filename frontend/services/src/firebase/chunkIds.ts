export function chunkIds<T>(ids: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error("chunkIds size must be positive");
  }
  const chunks: T[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}
