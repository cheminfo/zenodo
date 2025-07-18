import type { Zenodo } from './Zenodo.ts';
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

  // If no requests remaining, wait until reset time
  const now = Math.floor(Date.now() / 1000);
  const waitTime = Math.max(0, rateLimitInfo.reset - now);

  // Add a small buffer to ensure the rate limit has actually reset
  return (waitTime + 1) * 1000;
}

/**
 * Determine if an error is retryable based on status code.
 * @param status - The HTTP status code of the response.
 * @returns True if the error is retryable, false otherwise.
 */
function isRetryableError(status: number): boolean {
  // Retry on rate limit (429), server errors (5xx), and some specific client errors
  // 404 (Not Found) is NOT retryable - the resource doesn't exist
  // 401 (Unauthorized) and 403 (Forbidden) are NOT retryable - auth issues
  return status === 429 || status >= 500 || status === 408 || status === 409;
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

  const response = await fetch(url, requestOptions);

  // Check rate limit headers
  const rateLimitInfo = extractRateLimitInfo(response);
  if (rateLimitInfo && zenodo.logger) {
    zenodo.logger.debug(
      `Rate limit status: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining, resets at ${rateLimitInfo.reset}`,
    );
  }

  return response;
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
function handleFailedResponse(
  zenodo: Zenodo,
  response: Response,
  url: string,
  method: string,
  contentType: string | undefined,
  body: string | FormData | undefined,
): Error {
  const errorMessage =
    responseStatuses[response.status]?.description || response.statusText;

  if (!isRetryableError(response.status)) {
    zenodo.logger?.error(
      `Non-retryable error fetching ${url} with ${method}: ${errorMessage}`,
    );
  }

  return new Error(errorMessage, {
    cause: { url, method, contentType, body, response },
  });
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

    // If we got the expected status, return the response
    if (response.status === expectedStatus) {
      if (attempt > 0) {
        zenodo.logger?.info(`Request succeeded after ${attempt} retries`);
      }
      return response;
    }

    // Check if this is a retryable error
    if (!isRetryableError(response.status)) {
      throw handleFailedResponse(
        zenodo,
        response,
        url,
        method,
        contentType,
        body,
      );
    }

    // If we've exhausted retries, throw the error
    if (attempt >= maxRetries) {
      throw handleFailedResponse(
        zenodo,
        response,
        url,
        method,
        contentType,
        body,
      );
    }

    // Calculate delay and log warning
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

    // Wait and retry recursively
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

      // Network errors are usually retryable
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
