import { createDeposition } from './depositions/createDeposition';
import { deleteDeposition } from './depositions/deleteDeposition';
import type { ListDepositionsOptions } from './depositions/listDepositions';
import { listDepositions } from './depositions/listDepositions';
import { retrieveDeposition } from './depositions/retrieveDeposition';
import { updateDeposition } from './depositions/updateDeposition';
import { createFile } from './files/createFile';
import { deleteFile } from './files/deleteFile';
import { listFiles } from './files/listFiles';
import { retrieveFile } from './files/retrieveFile';
import { sortFiles } from './files/sortFiles';
import type { DepositionMetadata } from './types';

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

  async listDepositions(options: ListDepositionsOptions = {}) {
    return listDepositions(this, options);
  }

  async createDeposition(metadata: DepositionMetadata | {} = {}) {
    return createDeposition(this, metadata);
  }

  async retrieveDeposition(id: number) {
    return retrieveDeposition(this, id);
  }

  async updateDeposition(id: number, metadata: DepositionMetadata) {
    return updateDeposition(this, id, metadata);
  }

  async deleteDeposition(id: number) {
    return deleteDeposition(this, id);
  }

  async listFiles(depositionId: number) {
    return listFiles(this, depositionId);
  }

  async createFile(depositionId: number, file: File) {
    return createFile(this, depositionId, file);
  }

  async retrieveFile(depositionId: number, fileId: number) {
    return retrieveFile(this, depositionId, fileId);
  }

  async deleteFile(depositionId: number, fileId: string) {
    return deleteFile(this, depositionId, fileId);
  }
}
