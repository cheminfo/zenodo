import { Deposition } from './depositions/Deposition';
import type { ListDepositionsOptions } from './depositions/ListDepositionsOptions';
import { updateDeposition } from './depositions/updateDeposition';
import { fetchZenodo } from './fetchZenodo';
import type { DepositionMetadata } from './types';

export class Zenodo {
  host: string;
  accessToken: string;
  baseURL: string;

  constructor(options) {
    const { accessToken, host = 'sandbox.zenodo.org' } = options;
    this.host = host;
    this.baseURL = `https://${host}/api/`;
    if (!accessToken) {
      throw new Error('accessToken is required');
    }
    this.accessToken = accessToken;
  }

  async listDepositions(options: ListDepositionsOptions = {}) {
    const response = await fetchZenodo(this, {
      route: 'deposit/depositions',
      searchParams: options,
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

  async updateDeposition(id: number, metadata: DepositionMetadata) {
    return updateDeposition(this, id, metadata);
  }

  async deleteDeposition(id: number): Promise<void> {
    await fetchZenodo(this, {
      method: 'DELETE',
      route: `deposit/depositions/${id}`,
      expectedStatus: 204,
    });
  }
}
