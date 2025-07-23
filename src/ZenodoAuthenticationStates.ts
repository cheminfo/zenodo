export const ZenodoAuthenticationStates = {
  NOT_TRIED: 0,
  FAILED: 1,
  SUCCEEDED: 2,
} as const;

export type ZenodoAuthenticationStatesType =
  (typeof ZenodoAuthenticationStates)[keyof typeof ZenodoAuthenticationStates];
