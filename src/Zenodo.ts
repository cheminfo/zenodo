import type { Logger } from 'cheminfo-types';

import { ZenodoAuthenticationStates } from './ZenodoAuthenticationStates.ts';
import type { ZenodoAuthenticationStatesType } from './ZenodoAuthenticationStates.ts';
import { fetchZenodo } from './fetchZenodo.ts';
import type { ListDepositionsOptions } from './records/ListDepositionsOptions.ts';
import { Record } from './records/Record.ts';
import type { ZenodoMetadata, Identifier } from './records/RecordType.ts';
import type { ZenodoReview } from './records/RequestType.ts';

interface ZenodoOptions {
  accessToken: string;
  host?: string;
  logger?: Logger;
}

export interface PublicRecordOptions {
  isPublished?: boolean;
}

export class Zenodo {
  host: string;
  accessToken: string;
  baseURL: string;
  logger?: Logger;
  authenticationState: ZenodoAuthenticationStatesType;

  constructor(options: ZenodoOptions) {
    const { accessToken, host = 'sandbox.zenodo.org', logger } = options;
    this.host = host;
    this.baseURL = `https://${host}/api/`;
    this.logger = logger;
    this.accessToken = accessToken;
    this.authenticationState = ZenodoAuthenticationStates.NOT_TRIED;
  }

  /**
   * Create a new Zenodo instance.
   * This method authenticates the user and initializes a new Zenodo instance.
   * @param options - the options for creating a Zenodo instance
   * @throws {Error} If the authentication fails
   * @returns a new Zenodo instance
   */
  static async create(options: ZenodoOptions): Promise<Zenodo> {
    const zenodo = new Zenodo(options);
    const response = await fetchZenodo(zenodo, {
      route: 'user/records',
      expectedStatus: 200,
    });
    if (!response.ok) {
      throw new Error(`Failed to authenticate: ${response.statusText}`);
    }
    zenodo.logger?.info('Authenticated successfully');
    zenodo.authenticationState = ZenodoAuthenticationStates.SUCCEEDED;
    return zenodo;
  }

  /**
   * Verify the authentication state of the Zenodo instance.
   * This method checks if the access token is valid by making a request to the Zenodo API.
   * @returns true if authentication is successful, false otherwise.
   */
  async verifyAuthentication(): Promise<boolean> {
    const url = `${this.baseURL}deposit/depositions`;
    const headers = new Headers();

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    // can't use fetchZenodo to avoid circular dependency
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.status === 200) {
        this.authenticationState = ZenodoAuthenticationStates.SUCCEEDED;
        this.logger?.info('Authentication verified successfully');
        return true;
      } else {
        this.authenticationState = ZenodoAuthenticationStates.FAILED;
        this.logger?.warn(
          `Authentication failed with status ${response.status}`,
        );
        return false;
      }
    } catch (error) {
      this.authenticationState = ZenodoAuthenticationStates.FAILED;
      this.logger?.error(
        `Authentication verification failed: ${String(error)}`,
      );
      return false;
    }
  }

  /**
   * Lists all records in the Zenodo instance.
   * @param options - options for listing records
   * @description Lists all records in the Zenodo instance.
   * @returns An array of Record objects representing the records in the Zenodo instance.
   */
  async listRecords(options: ListDepositionsOptions = {}): Promise<Record[]> {
    // all the values must be string
    const optionsWithStrings = Object.fromEntries(
      Object.entries(options).map(([key, value]) => {
        if (key === 'allVersions') {
          return ['all_versions', String(value)];
        }
        return [key, String(value)];
      }),
    );

    const response = await fetchZenodo(this, {
      route: 'user/records',
      searchParams: optionsWithStrings,
    });
    const records = (await response.json()) as { hits: { hits: unknown[] } };
    this.logger?.info(`Listed ${records.hits.hits.length} records`);
    return records.hits.hits.map((record: unknown) => new Record(this, record));
  }

  /**
   * Creates a new record in the Zenodo instance.
   * @param metadata - the metadata for the new record
   * @throws {Error} If the metadata is invalid or the request fails
   * @returns The created record object
   */
  async createRecord(metadata: ZenodoMetadata): Promise<Record> {
    const response = await fetchZenodo(this, {
      route: 'records',
      expectedStatus: 201,
      method: 'POST',
      body: JSON.stringify({ metadata }),
    });
    const record = new Record(this, await response.json());
    this.logger?.info(`Created record ${record.value.id}`);
    return record;
  }

  /**
   * Retrieve a public deposition record
   * @param id - the deposition id
   * @param options - additional options for the request
   * @throws {Error} If the deposition does not exist or the ID is undefined
   * @returns The public deposition record
   */
  async retrieveRecord(
    id: Identifier,
    options: PublicRecordOptions = {},
  ): Promise<Record> {
    const { isPublished = false } = options;
    const route = isPublished ? `records/${id}` : `records/${id}/draft`;
    const response = await fetchZenodo(this, {
      route,
    });
    const deposition = await response.json();
    this.logger?.info(`Retrieved public deposition ${id}`);
    return new Record(this, deposition);
  }

  /**
   * List files in a deposition
   * @param depositionId - the deposition id to retrieve requests for
   * @returns An object containing the total number of requests and the list of requests
   */
  async retrieveRequests(
    depositionId?: Identifier,
  ): Promise<{ hits: { total: number; hits: ZenodoReview[] } }> {
    const response = await fetchZenodo(this, {
      route: `requests/`,
      searchParams: {
        q: String(depositionId),
      },
    });
    const requests = (await response.json()) as {
      hits: { total: number; hits: ZenodoReview[] };
    };
    this.logger?.info(
      `Retrieved ${requests.hits.total} requests for deposition ${depositionId}`,
    );
    return requests;
  }

  /**
   * Retrieve all versions of a deposition
   * @param id - the deposition id
   * @returns unvalidated array of deposition versions
   */
  async retrieveVersions(id: Identifier): Promise<unknown[]> {
    const response = await fetchZenodo(this, {
      route: `records/${id}/versions`,
    });
    const versions = (await response.json()) as {
      hits: { total: number; hits: unknown[] };
    };
    this.logger?.info(
      `Retrieved ${versions?.hits.total} versions for deposition ${id}`,
    );

    return versions?.hits.hits || [];
  }

  async deleteRecord(
    id: Identifier,
    options: PublicRecordOptions = {},
  ): Promise<void> {
    const { isPublished = false } = options;
    const route = isPublished ? `records/${id}` : `records/${id}/draft`;
    await fetchZenodo(this, {
      method: 'DELETE',
      route,
      expectedStatus: 204,
    });
    this.logger?.info(`Deleted record ${id}`);
  }
}
