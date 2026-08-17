/** True when the URL targets an in-page fragment that should keep native hash scrolling. */
export function hasHashTarget(hash: string): boolean {
  return hash.length > 1;
}

export function resetWindowScroll(scrollTo: (x: number, y: number) => void): void {
  scrollTo(0, 0);
}
