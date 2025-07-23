import type { Logger } from 'cheminfo-types';

import { ZenodoAuthenticationStates } from './ZenodoAuthenticationStates.ts';
import type { ZenodoAuthenticationStatesType } from './ZenodoAuthenticationStates.ts';
import { Deposition } from './depositions/Deposition.ts';
import type { ListDepositionsOptions } from './depositions/ListDepositionsOptions.ts';
import { Record } from './depositions/Record.ts';
import { fetchZenodo } from './fetchZenodo.ts';
import type { ZenodoMetadata } from './utilities/ZenodoMetadataSchema.ts';
import type { ZenodoReview } from './utilities/ZenodoReviewSchema.ts';

interface ZenodoOptions {
  accessToken: string;
  host?: string;
  logger?: Logger;
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

  static async create(options: ZenodoOptions): Promise<Zenodo> {
    const zenodo = new Zenodo(options);
    const response = await fetchZenodo(zenodo, {
      route: 'deposit/depositions',
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

  async listDepositions(
    options: ListDepositionsOptions = {},
  ): Promise<Deposition[]> {
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
      route: 'deposit/depositions',
      searchParams: optionsWithStrings,
    });
    const depositions = (await response.json()) as unknown[];
    this.logger?.info(`Listed ${depositions.length} depositions`);
    return depositions.map(
      (deposition: unknown) => new Deposition(this, deposition),
    );
  }

  async createDeposition(metadata: ZenodoMetadata): Promise<Deposition> {
    const response = await fetchZenodo(this, {
      route: 'deposit/depositions',
      expectedStatus: 201,
      method: 'POST',
      body: JSON.stringify({ metadata }),
    });
    const deposition = new Deposition(this, await response.json());
    this.logger?.info(`Created deposition ${deposition.value.id}`);
    return deposition;
  }

  async retrieveDeposition(id: number): Promise<Deposition> {
    const response = await fetchZenodo(this, {
      route: `deposit/depositions/${id}`,
    });
    const deposition = await response.json();
    this.logger?.info(`Retrieved deposition ${id}`);
    return new Deposition(this, deposition);
  }

  /**
   * Retrieve a public deposition record
   * @param id - the deposition id
   * @throws {Error} If the deposition does not exist or the ID is undefined
   * @returns - The public deposition record
   */
  async retrieveRecord(id: number): Promise<Record> {
    const response = await fetchZenodo(this, {
      route: `records/${id}`,
    });
    const deposition = await response.json();
    this.logger?.info(`Retrieved public deposition ${id}`);
    return new Record(this, deposition);
  }

  async retrieveRequests(
    depositionId?: number,
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
  async retrieveVersions(id: number): Promise<unknown[]> {
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

  async deleteDeposition(id: number): Promise<void> {
    await fetchZenodo(this, {
      method: 'DELETE',
      route: `deposit/depositions/${id}`,
      expectedStatus: 204,
    });
    this.logger?.info(`Deleted deposition ${id}`);
  }
}
