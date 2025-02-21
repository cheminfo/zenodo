import type { Zenodo } from './Zenodo';
import { responseStatuses } from './responseStatuses';

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
}

export async function fetchZenodo(zenodo: Zenodo, options: FetchZenodoOptions) {
  const {
    body,
    route = 'deposit/depositions',
    method = 'GET',
    contentType = body instanceof FormData ? undefined : 'application/json',
    expectedStatus = 200,
    searchParams,
  } = options;

  let url;
  if (searchParams) {
    const urlSearchParams = new URLSearchParams(searchParams);
    url =
      zenodo.baseURL +
      route +
      (urlSearchParams ? `?${urlSearchParams.toString()}` : '');
  } else {
    url = zenodo.baseURL + route;
  }

  const headers = new Headers({
    Authorization: `Bearer ${zenodo.accessToken}`,
  });
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });
  if (response.status !== expectedStatus) {
    const errorMessage =
      responseStatuses[response.status]?.description || response.statusText;
    zenodo.logger?.error(
      `Error fetching ${url} with ${method} and ${contentType}: ${errorMessage}`,
    );
    throw new Error(errorMessage, {
      cause: { url, method, contentType, body, response },
    });
  }
  return response;
}
