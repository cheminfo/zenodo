/**
 * Represents the different states of Zenodo authentication for retry logic.
 *
 * Usage in retry mechanism (src/services/zenodoService.ts):
 * The Zenodo API sometimes returns 401 Unauthorized or 403 Forbidden due to temporary issues.
 * - If SUCCEEDED: Access token is valid, safe to retry the request
 * - If FAILED: Access token is invalid/expired, do not retry
 * - If NOT_TRIED: Can attempt authentication once to determine next steps
 */
export const ZenodoAuthenticationStates = {
  /** Authentication verification has not been attempted yet. */
  NOT_TRIED: 0,
  /** Authentication verification has failed (token is invalid/expired). */
  FAILED: 1,
  /** Authentication verification has succeeded (token is valid). */
  SUCCEEDED: 2,
} as const;

/**
 * Type representing the authentication state numeric codes.
 */
export type ZenodoAuthenticationStatesType =
  (typeof ZenodoAuthenticationStates)[keyof typeof ZenodoAuthenticationStates];
