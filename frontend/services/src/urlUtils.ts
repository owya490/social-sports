export function getUrlWithCurrentHostname(path: string) {
  const hostname = window.location.hostname;
  const protocol = isLocalHost(hostname) ? "http" : "https";
  const port = isLocalHost(hostname) ? ":3000" : "";
  return `${protocol}://${hostname}${port}${path}`;
}

export function validateURL(url: string | URL): boolean {
  try {
    new URL(url); // Checks if the string is a valid URL
    return true;
  } catch {
    return false;
  }
}

function isLocalHost(hostname: string) {
  return hostname.includes("localhost");
}

export function getErrorUrl(error: any) {
  return `/error?message=${encodeURIComponent(error as string)}`;
}

/** Full-page navigation for external URLs (e.g. Stripe Checkout). Avoids App Router client navigation flashes. */
export function redirectToExternalUrl(url: string | URL) {
  window.location.assign(url.toString());
}

export function isExternalUrl(url: string | URL): boolean {
  try {
    const parsed = new URL(url.toString(), window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}
