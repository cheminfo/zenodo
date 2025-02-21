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
    const zenodoFile = new ZenodoFile(this.zenodo, await response.json());
    this.zenodo.logger?.info(
      `Created file ${zenodoFile.value.id} for deposition ${this.value.id}`,
    );
    return zenodoFile;
  }

  async listFiles(): Promise<ZenodoFile[]> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files`,
    });
    const files = (await response.json()) as unknown[];
    this.zenodo.logger?.info(
      `Listed ${files.length} files for deposition ${this.value.id}`,
    );
    return files.map((file) => new ZenodoFile(this.zenodo, file));
  }

  async deleteFile(fileId: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${fileId}`,
      method: 'DELETE',
      expectedStatus: 204,
    });
    this.zenodo.logger?.info(
      `Deleted file ${fileId} for deposition ${this.value.id}`,
    );
  }

  async retrieveFile(fileId: string): Promise<ZenodoFile> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${fileId}`,
    });
    const deposition = new ZenodoFile(this.zenodo, await response.json());
    this.zenodo.logger?.info(
      `Retrieved file ${fileId} for deposition ${this.value.id}`,
    );
    return deposition;
  }

  /**
   * Update the metadata of the deposition
   * @param metadata
   * @returns
   */
  async update(metadata: DepositionMetadata): Promise<Deposition> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}`,
      method: 'PUT',
      body: JSON.stringify({ metadata }),
    });
    const deposition = new Deposition(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Updated deposition ${this.value.id}`);
    return deposition;
  }
}
