export function getUrlWithCurrentHostname(path: string) {
  const hostname = window.location.hostname;
  const protocol = isLocalHost(hostname) ? "http" : "https";
  const port = isLocalHost(hostname) ? ":3000" : "";
  return `${protocol}://${hostname}${port}${path}`;
}

function isLocalHost(hostname: string) {
  return hostname.includes("localhost");
}
