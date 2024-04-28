export function getUrlWithCurrentHostname(path: string) {
  const hostname = window.location.hostname;
  const protocol = hostname.includes("localhost") ? "http" : "https"
  return `${protocol}://${hostname}${path}`;
}
