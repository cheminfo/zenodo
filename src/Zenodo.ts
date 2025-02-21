import { Deposition } from './depositions/Deposition';
import type { ListDepositionsOptions } from './depositions/ListDepositionsOptions';
import type { DepositionMetadata } from './depositions/types';
import { fetchZenodo } from './fetchZenodo';

interface ZenodoOptions {
  accessToken: string;
  host?: string;
}
export class Zenodo {
  host: string;
  accessToken: string;
  baseURL: string;

  constructor(options: ZenodoOptions) {
    const { accessToken, host = 'sandbox.zenodo.org' } = options;
    this.host = host;
    this.baseURL = `https://${host}/api/`;
    if (!accessToken) {
      throw new Error('accessToken is required');
    }
    this.accessToken = accessToken;
  }

  async listDepositions(options: ListDepositionsOptions = {}) {
    // all the values must be string
    const optionsWithStrings = Object.fromEntries(
      Object.entries(options).map(([key, value]) => [key, String(value)]),
    );
    const response = await fetchZenodo(this, {
      route: 'deposit/depositions',
      searchParams: optionsWithStrings,
    });
    const depositions = await response.json();
    return depositions.map((deposition) => new Deposition(this, deposition));
  }

  async createDeposition(metadata: DepositionMetadata): Promise<Deposition> {
    const response = await fetchZenodo(this, {
      route: 'deposit/depositions',
      expectedStatus: 201,
      method: 'POST',
      body: JSON.stringify({ metadata }),
    });
    const deposition = new Deposition(this, await response.json());
    return deposition;
  }

  async retrieveDeposition(id: number) {
    const response = await fetchZenodo(this, {
      route: `deposit/depositions/${id}`,
    });
    const depositions = await response.json();
    return depositions.map((deposition) => new Deposition(this, deposition));
  }

  async deleteDeposition(id: number): Promise<void> {
    await fetchZenodo(this, {
      method: 'DELETE',
      route: `deposit/depositions/${id}`,
      expectedStatus: 204,
    });
  }
}
