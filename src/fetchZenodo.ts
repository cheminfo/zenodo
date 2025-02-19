import { F } from 'vitest/dist/chunks/config.BRtC-JeT';

import type { Zenodo } from './Zenodo';

interface FetchZenodoOptions {
  route?: string;
  method?: string;
  contentType?: string;
  expectedStatus?: number;
  searchParams?: Record<string, string | number>;
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
      zenodo.baseURL + route + (urlSearchParams ? `?${urlSearchParams}` : '');
  } else {
    url = zenodo.baseURL + route;
  }

  const headers = {
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
    console.error({ url, method, contentType, body, response });
    throw new Error(
      responseStatuses[response.status]?.message || response.statusText,
    );
  }
  return response;
}
