import crypto from "node:crypto";

/**
 * Server-side helpers for the password-gated /proposal page.
 *
 * There is no user database — a single shared password (PROPOSAL_PASSWORD)
 * gates the deck so the link can be sent to sponsors. On success we set an
 * httpOnly cookie whose value is a hash of the password, so the raw secret
 * never lives in the browser and the cookie can be verified statelessly.
 */

export const PROPOSAL_COOKIE = "tedx_proposal";

/** The active proposal password (env-overridable, with a sensible default). */
export function proposalPassword(): string {
  return process.env.PROPOSAL_PASSWORD?.trim() || "nextisnow2026";
}

/** Opaque cookie token derived from the password. */
export function proposalToken(password: string = proposalPassword()): string {
  return crypto
    .createHash("sha256")
    .update(`tedxclifton::proposal::${password}`)
    .digest("hex");
}

/** Constant-time check of a submitted password against the configured one. */
export function verifyPassword(input: unknown): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(proposalPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Whether a cookie value grants access. */
export function isUnlocked(token: string | undefined | null): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(proposalToken());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
