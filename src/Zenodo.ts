import { createDeposition } from './createDeposition';
import { ListDepositionsOptions, listDepositions } from './listDepositions';
import { listFiles } from './listFiles';
import { retrieveDeposition } from './retrieveDeposition';
import { DepositionMetadata } from './types';
import { updateDeposition } from './updateDeposition';

export class Zenodo {
  host: string;
  accessToken: string;

  constructor(options) {
    const { accessToken, host = 'sandbox.zenodo.org' } = options;
    this.host = host;
    if (!accessToken) {
      throw new Error('accessToken is required');
    }
    this.accessToken = accessToken;
  }

  async listDepositions(options: ListDepositionsOptions) {
    return listDepositions(this, options);
  }

  async createDeposition(metadata: DepositionMetadata | {}) {
    return createDeposition(this, metadata);
  }

  async retrieveDeposition(id: number) {
    return retrieveDeposition(this, id);
  }

  async updateDeposition(id: number, metadata: DepositionMetadata) {
    return updateDeposition(this, id, metadata);
  }

  async listFiles(depositionId: number) {
    return listFiles(this, depositionId);
  }
}
