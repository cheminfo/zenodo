import type { Zenodo } from '../Zenodo.ts';
import type { ZenodoRecord } from '../utilities/ZenodoRecordSchema.ts';
import { validateZenodoRecord } from '../utilities/schemaValidation.ts';

import type { Deposition } from './Deposition.ts';

export class Record {
  public value: ZenodoRecord;
  private zenodo: Zenodo;

  constructor(zenodo: Zenodo, value: unknown) {
    this.zenodo = zenodo;
    this.value = validateZenodoRecord(value);
  }

  async getDeposition(): Promise<Deposition> {
    if (this.value.id === undefined) {
      throw new Error('Deposition ID is undefined');
    }
    if (this.zenodo.accessToken === undefined) {
      throw new Error('Access token is required to retrieve a deposition');
    }
    return await this.zenodo.retrieveDeposition(this.value.id);
  }
}
