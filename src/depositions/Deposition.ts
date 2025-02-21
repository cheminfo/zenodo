import type { Zenodo } from '../Zenodo';
import { ZenodoFile } from '../ZenodoFile';
import { fetchZenodo } from '../fetchZenodo';

import { zenodoDepositionSchema } from './depositionSchema';
import type { DepositionMetadata, ZenodoDeposition } from './depositionSchema';

export class Deposition {
  private zenodo: Zenodo;
  public value: ZenodoDeposition;

  constructor(zenodo: Zenodo, deposition: unknown) {
    this.zenodo = zenodo;
    this.value = zenodoDepositionSchema.parse(deposition);
  }

  async createFile(file: File): Promise<ZenodoFile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files`,
      method: 'POST',
      body: formData,
      expectedStatus: 201,
    });
    return new ZenodoFile(this.zenodo, await response.json());
  }

  async listFiles(): Promise<ZenodoFile[]> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files`,
    });
    const files = (await response.json()) as any[];
    return files.map((file) => new ZenodoFile(this.zenodo, file));
  }

  async deleteFile(fileId: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${fileId}`,
      method: 'DELETE',
      expectedStatus: 204,
    });
  }

  async retrieveFile(fileId: string): Promise<ZenodoFile> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${fileId}`,
    });
    return new ZenodoFile(this.zenodo, await response.json());
  }

  async update(metadata: DepositionMetadata): Promise<Deposition> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}`,
      method: 'PUT',
      body: JSON.stringify({ metadata }),
    });
    return new Deposition(this.zenodo, await response.json());
  }
}
