declare module "lscache" {
  interface LSCache {
    set(key: string, value: unknown, time?: number): boolean;
    get(key: string): unknown;
    remove(key: string): void;
    flush(): void;
    flushExpired(): void;
    setBucket(bucket: string): void;
    resetBucket(): void;
    setExpiryMilliseconds(milliseconds: number): void;
    supported(): boolean;
  }

  const lscache: LSCache;
  export default lscache;
}
