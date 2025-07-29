import { test, expect, vi, afterEach } from 'vitest';

import { ZenodoAuthenticationStates } from '../ZenodoAuthenticationStates.ts';
import type { ZenodoAuthenticationStatesType } from '../ZenodoAuthenticationStates.ts';
import { fetchZenodo } from '../fetchZenodo.ts';

const mockFetch = vi.fn();
global.fetch = mockFetch;
interface MockLogger {
  debug: ReturnType<typeof vi.fn>;
  child: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  trace: ReturnType<typeof vi.fn>;
  fatal: ReturnType<typeof vi.fn>;
}

interface MockZenodo {
  baseURL: string;
  accessToken: string;
  logger: MockLogger;
  host: string;
  authenticationState: ZenodoAuthenticationStatesType;
  listRecords: ReturnType<typeof vi.fn>;
  createRecord: ReturnType<typeof vi.fn>;
  retrieveRecord: ReturnType<typeof vi.fn>;
  retrieveRequests: ReturnType<typeof vi.fn>;
  retrieveVersions: ReturnType<typeof vi.fn>;
  deleteRecord: ReturnType<typeof vi.fn>;
  verifyAuthentication: ReturnType<typeof vi.fn>;
}

const mockZenodo: MockZenodo = {
  baseURL: 'https://sandbox.zenodo.org/api/',
  accessToken: 'test-token',
  logger: {
    debug: vi.fn(),
    child: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  },
  host: 'sandbox.zenodo.org',
  authenticationState: ZenodoAuthenticationStates.NOT_TRIED,
  listRecords: vi.fn(),
  createRecord: vi.fn(),
  retrieveRecord: vi.fn(),
  retrieveRequests: vi.fn(),
  retrieveVersions: vi.fn(),
  deleteRecord: vi.fn(),
  verifyAuthentication: vi
    .fn()
    .mockImplementation(async function verifyAuthentication(this: MockZenodo) {
      // Simulate the actual behavior
      this.authenticationState = ZenodoAuthenticationStates.FAILED;
      return false;
    }),
};
afterEach(() => {
  vi.clearAllMocks();
  mockZenodo.authenticationState = ZenodoAuthenticationStates.NOT_TRIED;
});

test('missing rate limit headers', async () => {
  const mockResponse = new Response('{"success": true}', {
    status: 200,
    headers: new Headers({
      'X-RateLimit-Limit': '100',
    }),
  });
  mockFetch.mockResolvedValueOnce(mockResponse);

  await fetchZenodo(mockZenodo, {});

  expect(mockZenodo.logger.debug).not.toHaveBeenCalledWith(
    expect.stringContaining('Rate limit status'),
  );
});

test('rate limit delay calculation', async () => {
  const futureTime = Math.floor(Date.now() / 1000) + 5;
  const rateLimitResponse = new Response('Rate limit exceeded', {
    status: 429,
    headers: new Headers({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': futureTime.toString(),
    }),
  });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(rateLimitResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {});

  expect(mockZenodo.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Rate limit exceeded. Waiting'),
  );
}, 15000);

test('non-retryable errors', async () => {
  // Set auth state to FAILED so 401 won't trigger auth verification
  mockZenodo.authenticationState = ZenodoAuthenticationStates.FAILED;

  const errorResponse = new Response('Unauthorized', { status: 401 });
  mockFetch.mockResolvedValueOnce(errorResponse);

  await expect(fetchZenodo(mockZenodo, {})).rejects.toThrow();
  expect(mockFetch).toHaveBeenCalledTimes(1);
}, 15000);

test('retryable errors 408', async () => {
  const errorResponse = new Response('Timeout', { status: 408 });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(errorResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {});
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('non-retryable errors 409', async () => {
  const errorResponse = new Response('Conflict', { status: 409 });
  mockFetch.mockResolvedValueOnce(errorResponse);

  await expect(fetchZenodo(mockZenodo, {})).rejects.toThrow();
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

test('exponential backoff', async () => {
  const errorResponse = new Response('Server error', { status: 500 });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(errorResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {
    baseDelay: 100,
    useExponentialBackoff: true,
  });

  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('linear backoff', async () => {
  const errorResponse = new Response('Server error', { status: 500 });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(errorResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {
    baseDelay: 100,
    useExponentialBackoff: false,
  });

  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('success after retries logging', async () => {
  const errorResponse = new Response('Server error', { status: 500 });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(errorResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {});

  expect(mockZenodo.logger.info).toHaveBeenCalledWith(
    'Request succeeded after 1 retries',
  );
});

test('max retries exceeded', async () => {
  const errorResponse = new Response('Server error', { status: 500 });
  mockFetch.mockResolvedValue(errorResponse);

  await expect(fetchZenodo(mockZenodo, { maxRetries: 1 })).rejects.toThrow();

  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('rate limit without respect option', async () => {
  const rateLimitResponse = new Response('Rate limit exceeded', {
    status: 429,
    headers: new Headers({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '1234567890',
    }),
  });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(rateLimitResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {
    respectRateLimit: false,
  });

  expect(mockZenodo.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Retryable error (429)'),
  );
});

test('network error retry', async () => {
  const networkError = new Error('Network error');
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockRejectedValueOnce(networkError)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {});

  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockZenodo.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Network error: Network error'),
  );
});

test.todo('network error max retries', async () => {
  const networkError = new Error('Network error');
  mockFetch.mockRejectedValue(networkError);

  await expect(fetchZenodo(mockZenodo, { maxRetries: 3 })).rejects.toThrow(
    'Network error',
  );

  expect(mockFetch).toHaveBeenCalledTimes(4);
});

test('network error linear backoff', async () => {
  const networkError = new Error('Network error');
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockRejectedValueOnce(networkError)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {
    useExponentialBackoff: false,
    baseDelay: 100,
  });

  expect(mockFetch).toHaveBeenCalledTimes(2);
});

test('error with existing cause', async () => {
  const errorWithCause = new Error('Error with cause', {
    cause: { response: new Response('', { status: 500 }) },
  });
  mockFetch.mockRejectedValueOnce(errorWithCause);

  await expect(fetchZenodo(mockZenodo, {})).rejects.toBe(errorWithCause);
});

test('non-error exception', async () => {
  const stringError = 'String error';
  mockFetch.mockRejectedValueOnce(stringError);

  await expect(fetchZenodo(mockZenodo, {})).rejects.toBe(stringError);
});

test('no logger', async () => {
  const mockResponse = new Response('{"success": true}', { status: 200 });
  mockFetch.mockResolvedValueOnce(mockResponse);

  const result = await fetchZenodo(mockZenodo, {});
  expect(result).toStrictEqual(mockResponse);
});

test('formdata body', async () => {
  const mockResponse = new Response('{"success": true}', { status: 200 });
  mockFetch.mockResolvedValueOnce(mockResponse);
  const formData = new FormData();

  await fetchZenodo(mockZenodo, {
    method: 'POST',
    body: formData,
  });

  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs).toBeDefined();
  // @ts-expect-error callArgs is unknown type
  expect(callArgs[1].body).toBe(formData);
});

test('authentication error triggers verification', async () => {
  mockZenodo.authenticationState = ZenodoAuthenticationStates.NOT_TRIED;
  mockZenodo.verifyAuthentication.mockResolvedValueOnce(true);
  mockZenodo.verifyAuthentication.mockImplementation(
    async function verifyAuthentication(this: MockZenodo) {
      this.authenticationState = ZenodoAuthenticationStates.SUCCEEDED;
      return true;
    },
  );

  const authErrorResponse = new Response('Unauthorized', { status: 401 });
  const successResponse = new Response('{"success": true}', { status: 200 });

  mockFetch
    .mockResolvedValueOnce(authErrorResponse)
    .mockResolvedValueOnce(successResponse);

  await fetchZenodo(mockZenodo, {});

  expect(mockZenodo.verifyAuthentication).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
