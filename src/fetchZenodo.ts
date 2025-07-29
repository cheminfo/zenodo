import type { Zenodo } from './Zenodo.ts';
import { ZenodoAuthenticationStates } from './ZenodoAuthenticationStates.ts';
import { responseStatuses } from './responseStatuses.ts';

interface FetchZenodoOptions {
  /**
   * The route to append to the Zenodo base URL.
   * @default 'deposit/depositions'
   */
  route?: string;
  /**
   * The HTTP method to use for the request.
   * @default 'GET'
   */
  method?: string;
  /**
   * The content type of the request body.
   * @default 'application/json' if body is not a FormData, undefined otherwise
   */
  contentType?: string;
  /**
   * The expected status code of the response. If the response status code does not match this
   * value, we will retry.
   * @default 200
   */
  expectedStatus?: number;
  searchParams?: Record<string, string>;
  body?: string | FormData;
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number;
  /**
   * Base delay between retries in milliseconds.
   * @default 1000
   */
  baseDelay?: number;
  /**
   * Whether to use exponential backoff for retry delays.
   * @default true
   */
  useExponentialBackoff?: boolean;
  /**
   * Whether to respect rate limit headers and wait accordingly.
   * @default true
   */
  respectRateLimit?: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Extract rate limit information from response headers.
 * @param response - The fetch response object.
 * @returns The rate limit information or null if not present.
 */
function extractRateLimitInfo(response: Response): RateLimitInfo | null {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: Number.parseInt(limit, 10),
    remaining: Number.parseInt(remaining, 10),
    reset: Number.parseInt(reset, 10),
  };
}

/**
 * Calculate delay based on rate limit information.
 * @param rateLimitInfo - The rate limit information extracted from response headers.
 * @returns Delay in milliseconds to wait before retrying.
 */
function calculateRateLimitDelay(rateLimitInfo: RateLimitInfo): number {
  if (rateLimitInfo.remaining > 0) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const waitTime = Math.max(0, rateLimitInfo.reset - now);

  return (waitTime + 1) * 1000;
}

/**
 * Determine if an error is retryable based on status code.
 * @param status - The HTTP status code of the response.
 * @param zenodo - The Zenodo instance
 * @returns True if the error is retryable, false otherwise.
 */
async function shouldRetry(status: number, zenodo: Zenodo): Promise<boolean> {
  if (status === 429 || (status >= 500 && status < 600) || status === 408) {
    zenodo.logger?.debug(`Retrying status ${status} - server/rate limit error`);
    return true;
  }

  const isAuthError =
    (status === 401 || status === 403) &&
    (zenodo.authenticationState === ZenodoAuthenticationStates.NOT_TRIED ||
      zenodo.authenticationState === ZenodoAuthenticationStates.SUCCEEDED);

  if (isAuthError) {
    zenodo.logger?.debug(
      `Auth error detected (${status}), current state: ${zenodo.authenticationState}`,
    );
    zenodo.logger?.debug('Attempting to verify authentication...');

    try {
      await zenodo.verifyAuthentication();
      zenodo.logger?.debug(
        `Authentication verification completed, new state: ${zenodo.authenticationState}`,
      );
      return true;
    } catch (error) {
      zenodo.logger?.error(
        `Authentication verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  return false;
}

/**
 * Sleep for a specified number of milliseconds.
 * @param ms - The number of milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Calculate the appropriate delay for a retry attempt.
 * @param attempt - Current attempt number (0-based)
 * @param response - The failed response
 * @param rateLimitInfo - Rate limit information from headers
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(
  attempt: number,
  response: Response,
  rateLimitInfo: RateLimitInfo | null,
  options: Pick<
    FetchZenodoOptions,
    'baseDelay' | 'useExponentialBackoff' | 'respectRateLimit'
  >,
): number {
  const {
    baseDelay = 1000,
    useExponentialBackoff = true,
    respectRateLimit = true,
  } = options;

  if (response.status === 429 && respectRateLimit && rateLimitInfo) {
    // Rate limit hit - respect the rate limit headers
    return calculateRateLimitDelay(rateLimitInfo);
  }

  // Other retryable error - use exponential backoff
  const delay = useExponentialBackoff ? baseDelay * 2 ** attempt : baseDelay;

  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Perform a single fetch attempt.
 * @param zenodo - The Zenodo instance
 * @param url - The URL to fetch
 * @param requestOptions - The fetch options
 * @param expectedStatus - The expected response status
 * @param attempt - Current attempt number (0-based)
 * @returns The response or throws an error
 */
async function performFetchAttempt(
  zenodo: Zenodo,
  url: string,
  requestOptions: RequestInit,
  expectedStatus: number,
  attempt: number,
): Promise<Response> {
  zenodo.logger?.debug(
    `Attempt ${attempt + 1} for ${requestOptions.method} ${url}`,
  );

  try {
    const response = await fetch(url, requestOptions);

    // Check rate limit headers
    const rateLimitInfo = extractRateLimitInfo(response);
    if (rateLimitInfo && zenodo.logger) {
      zenodo.logger.debug(
        `Rate limit status: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining, resets at ${rateLimitInfo.reset}`,
      );
    }

    // Log response details for debugging
    zenodo.logger?.debug(
      `Response status: ${response.status} ${response.statusText}`,
    );

    return response;
  } catch (fetchError) {
    zenodo.logger?.error(
      {
        url,
        method: requestOptions.method,
        error:
          fetchError instanceof Error ? fetchError.message : String(fetchError),
      },
      `Network error on attempt ${attempt + 1}:`,
    );
    throw fetchError;
  }
}

/**
 * Handle a failed response and determine if retry is appropriate.
 * @param zenodo - The Zenodo instance
 * @param response - The failed response
 * @param url - The request URL
 * @param method - The request method
 * @param contentType - The request content type
 * @param body - The request body
 * @returns Error to throw
 */
async function handleFailedResponse(
  zenodo: Zenodo,
  response: Response,
  url: string,
  method: string,
  contentType: string | undefined,
  body: string | FormData | undefined,
): Promise<Error> {
  const baseErrorMessage =
    responseStatuses[response.status]?.description || response.statusText;
  let detailedErrorMessage = baseErrorMessage;
  let errorDetails: unknown = null;
  try {
    const responseText = await response.text();
    if (responseText) {
      try {
        errorDetails = JSON.parse(responseText);
        if (errorDetails && typeof errorDetails === 'object') {
          const errorObj = errorDetails as Record<string, unknown>;
          if (errorObj.message && typeof errorObj.message === 'string') {
            detailedErrorMessage = `${baseErrorMessage}: ${errorObj.message}`;
          } else if (errorObj.error && typeof errorObj.error === 'string') {
            detailedErrorMessage = `${baseErrorMessage}: ${errorObj.error}`;
          } else if (errorObj.errors && Array.isArray(errorObj.errors)) {
            const errorMessages = errorObj.errors
              .map((err: unknown) =>
                typeof err === 'string'
                  ? err
                  : err &&
                      typeof err === 'object' &&
                      'message' in err &&
                      typeof (err as Record<string, unknown>).message ===
                        'string'
                    ? ((err as Record<string, unknown>).message as string)
                    : JSON.stringify(err),
              )
              .join(', ');
            detailedErrorMessage = `${baseErrorMessage}: ${errorMessages}`;
          } else {
            detailedErrorMessage = `${baseErrorMessage}: ${JSON.stringify(errorDetails)}`;
          }
        } else {
          detailedErrorMessage = `${baseErrorMessage}: ${responseText}`;
        }
      } catch {
        detailedErrorMessage = `${baseErrorMessage}: ${responseText}`;
      }
    }
  } catch (textError) {
    // If we can't read the response body, log the attempt
    zenodo.logger?.warn(
      `Could not read error response body: ${textError instanceof Error ? textError.message : String(textError)}`,
    );
  }
  if (!(await shouldRetry(response.status, zenodo))) {
    zenodo.logger?.error(
      `Non-retryable error fetching ${url} with ${method}: ${detailedErrorMessage}`,
    );
    zenodo.logger?.error(
      {
        url,
        method,
        contentType,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        errorDetails,
      },
      `Request details:`,
    );
  }
  const error = new Error(detailedErrorMessage, {
    cause: {
      url,
      method,
      contentType,
      body,
      response,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      errorDetails,
    },
  });
  return error;
}

/**
 * Retry logic using recursive approach to avoid await in loops.
 * @param zenodo - The Zenodo instance
 * @param url - The URL to fetch
 * @param requestOptions - The fetch options
 * @param fetchOptions - The original fetch options
 * @param attempt - Current attempt number (0-based)
 * @returns The successful response
 */
async function retryFetch(
  zenodo: Zenodo,
  url: string,
  requestOptions: RequestInit,
  fetchOptions: Required<
    Pick<
      FetchZenodoOptions,
      | 'expectedStatus'
      | 'maxRetries'
      | 'baseDelay'
      | 'useExponentialBackoff'
      | 'respectRateLimit'
    >
  > &
    Pick<FetchZenodoOptions, 'method' | 'contentType' | 'body'>,
  attempt: number,
): Promise<Response> {
  const {
    expectedStatus,
    maxRetries,
    method = 'GET',
    contentType,
    body,
  } = fetchOptions;

  try {
    const response = await performFetchAttempt(
      zenodo,
      url,
      requestOptions,
      expectedStatus,
      attempt,
    );

    if (response.status === expectedStatus) {
      if (attempt > 0) {
        zenodo.logger?.info(`Request succeeded after ${attempt} retries`);
      }
      return response;
    }

    if (!(await shouldRetry(response.status, zenodo))) {
      throw await handleFailedResponse(
        zenodo,
        response,
        url,
        method,
        contentType,
        body,
      );
    }

    if (attempt >= maxRetries) {
      throw await handleFailedResponse(
        zenodo,
        response,
        url,
        method,
        contentType,
        body,
      );
    }

    const rateLimitInfo = extractRateLimitInfo(response);
    const delay = calculateRetryDelay(
      attempt,
      response,
      rateLimitInfo,
      fetchOptions,
    );

    if (
      response.status === 429 &&
      fetchOptions.respectRateLimit &&
      rateLimitInfo
    ) {
      zenodo.logger?.warn(
        `Rate limit exceeded. Waiting ${delay}ms before retry (attempt ${attempt + 1}/${maxRetries + 1})`,
      );
    } else {
      zenodo.logger?.warn(
        `Retryable error (${response.status}). Waiting ${delay}ms before retry (attempt ${attempt + 1}/${maxRetries + 1})`,
      );
    }

    await sleep(delay);
    return await retryFetch(
      zenodo,
      url,
      requestOptions,
      fetchOptions,
      attempt + 1,
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.cause &&
        typeof error.cause === 'object' &&
        'response' in error.cause
      ) {
        throw error;
      }

      if (attempt >= maxRetries) {
        zenodo.logger?.error(
          `All ${maxRetries + 1} attempts failed for ${method} ${url}`,
        );
        throw error;
      }

      const delay = fetchOptions.useExponentialBackoff
        ? fetchOptions.baseDelay * 2 ** attempt
        : fetchOptions.baseDelay;

      zenodo.logger?.warn(
        `Network error: ${error.message}. Waiting ${delay}ms before retry (attempt ${attempt + 1}/${maxRetries + 1})`,
      );

      await sleep(delay);
      return retryFetch(zenodo, url, requestOptions, fetchOptions, attempt + 1);
    } else {
      throw error;
    }
  }
}

/**
 * Fetch data from the Zenodo API with retry logic.
 * @param zenodo - The Zenodo instance containing the base URL and access token.
 * @param options - The options for the fetch request.
 * @returns The response from the Zenodo API.
 */
export async function fetchZenodo(
  zenodo: Zenodo,
  options: FetchZenodoOptions,
): Promise<Response> {
  const {
    body,
    route = 'deposit/depositions',
    method = 'GET',
    contentType = body instanceof FormData ? undefined : 'application/json',
    expectedStatus = 200,
    searchParams,
    maxRetries = 3,
    baseDelay = 1000,
    useExponentialBackoff = true,
    respectRateLimit = true,
  } = options;

  let url: string;
  if (searchParams) {
    const urlSearchParams = new URLSearchParams(searchParams);
    url =
      zenodo.baseURL +
      route +
      (urlSearchParams ? `?${urlSearchParams.toString()}` : '');
  } else {
    url = zenodo.baseURL + route;
  }

  const headers = new Headers();
  if (zenodo.accessToken) {
    headers.set('Authorization', `Bearer ${zenodo.accessToken}`);
  }
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const requestOptions: RequestInit = {
    method,
    headers,
    body,
  };

  const fetchOptionsWithDefaults = {
    expectedStatus,
    maxRetries,
    baseDelay,
    useExponentialBackoff,
    respectRateLimit,
    method,
    contentType,
    body,
  };

  return retryFetch(zenodo, url, requestOptions, fetchOptionsWithDefaults, 0);
}
