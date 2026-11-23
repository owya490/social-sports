import { decodeProtectedHeader, importX509, jwtVerify, type JWTPayload } from "jose";
import { isAllowedReportingUser } from "./allowedUser";

const GOOGLE_SECURE_TOKEN_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export class FirebaseTokenError extends Error {
  constructor(message = "Sign-in could not be verified.") {
    super(message);
    this.name = "FirebaseTokenError";
  }
}

export class ReportingAccessError extends Error {
  constructor() {
    super("This account cannot access the internal dashboard.");
    this.name = "ReportingAccessError";
  }
}

type CertCache = {
  certs: Record<string, string>;
  expiresAtMs: number;
};

let certCache: CertCache | null = null;

export function resetFirebaseCertCache(): void {
  certCache = null;
}

export async function loadGoogleSecureTokenCerts(nowMs = Date.now()): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAtMs > nowMs) {
    return certCache.certs;
  }
  const response = await fetch(GOOGLE_SECURE_TOKEN_CERTS_URL);
  if (!response.ok) {
    throw new FirebaseTokenError();
  }
  const certs = (await response.json()) as Record<string, string>;
  const maxAgeMatch = response.headers.get("cache-control")?.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 60 * 60;
  certCache = { certs, expiresAtMs: nowMs + maxAgeSeconds * 1000 };
  return certs;
}

export async function verifyReportingIdToken(
  idToken: string,
  projectId: string,
  loadCerts: () => Promise<Record<string, string>> = () => loadGoogleSecureTokenCerts()
): Promise<JWTPayload> {
  if (!projectId) {
    throw new FirebaseTokenError();
  }
  if (idToken.length === 0 || idToken.length > 4096) {
    throw new FirebaseTokenError();
  }

  const header = decodeProtectedHeader(idToken);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new FirebaseTokenError();
  }

  const certificate = (await loadCerts())[header.kid];
  if (!certificate) {
    throw new FirebaseTokenError();
  }

  let payload: JWTPayload;
  try {
    const key = await importX509(certificate, "RS256");
    const verified = await jwtVerify(idToken, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"],
      clockTolerance: 5,
    });
    payload = verified.payload;
  } catch (error) {
    if (error instanceof FirebaseTokenError || error instanceof ReportingAccessError) {
      throw error;
    }
    throw new FirebaseTokenError();
  }

  const uid = typeof payload.sub === "string" ? payload.sub : undefined;
  const userIdClaim = payload.user_id;
  if (typeof userIdClaim === "string" && userIdClaim !== uid) {
    throw new FirebaseTokenError();
  }
  // The uid is trusted only after this Firebase project's signature, issuer, and audience have been checked.
  if (!isAllowedReportingUser(uid)) {
    throw new ReportingAccessError();
  }
  return payload;
}
