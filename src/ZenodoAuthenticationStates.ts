/**
 * Represents the different states of Zenodo authentication for retry logic.
 *
 * States:
 * - NOT_TRIED: Authentication verification has not been attempted yet
 * - FAILED: Authentication verification has failed
 * - SUCCEEDED: Authentication verification has succeeded
 *
 * Usage in retry mechanism (src/services/zenodoService.ts):
 * The Zenodo API sometimes returns 401 Unauthorized or 403 Forbidden due to temporary issues.
 * - If SUCCEEDED: Access token is valid, safe to retry the request
 * - If FAILED: Access token is invalid/expired, do not retry
 * - If NOT_TRIED: Can attempt authentication once to determine next steps
 */
export const ZenodoAuthenticationStates = {
  NOT_TRIED: 0,
  FAILED: 1,
  SUCCEEDED: 2,
} as const;

export type ZenodoAuthenticationStatesType =
  (typeof ZenodoAuthenticationStates)[keyof typeof ZenodoAuthenticationStates];
