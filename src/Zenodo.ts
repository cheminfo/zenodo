import type { Logger } from 'cheminfo-types';

import { Deposition } from './depositions/Deposition';
import type { ListDepositionsOptions } from './depositions/ListDepositionsOptions';
import type { DepositionMetadata } from './depositions/depositionSchema';
import { fetchZenodo } from './fetchZenodo';

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

  constructor(options: ZenodoOptions) {
    const { accessToken, host = 'sandbox.zenodo.org', logger } = options;
    this.host = host;
    this.baseURL = `https://${host}/api/`;
    this.logger = logger;
    if (!accessToken) {
      throw new Error('accessToken is required');
    }
    this.accessToken = accessToken;
  }

  async listDepositions(
    options: ListDepositionsOptions = {},
  ): Promise<Deposition[]> {
    // all the values must be string
    const optionsWithStrings = Object.fromEntries(
      Object.entries(options).map(([key, value]) => [key, String(value)]),
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

  async createDeposition(metadata: DepositionMetadata): Promise<Deposition> {
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

  async deleteDeposition(id: number): Promise<void> {
    await fetchZenodo(this, {
      method: 'DELETE',
      route: `deposit/depositions/${id}`,
      expectedStatus: 204,
    });
    this.logger?.info(`Deleted deposition ${id}`);
  }
}
