import type { Zenodo } from './Zenodo';
import { responseStatuses } from './responseStatuses';

interface Headers {
  Authorization: string;
  'Content-Type'?: string;
}
interface FetchZenodoOptions {
  route?: string;
  method?: string;
  contentType?: string;
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

  const headers: Headers = {
    Authorization: `Bearer ${zenodo.accessToken}`,
  };
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });
  if (response.status !== expectedStatus) {
    throw new Error(
      responseStatuses[response.status]?.description || response.statusText,
      { cause: { url, method, contentType, body, response } },
    );
  }
  return response;
}
