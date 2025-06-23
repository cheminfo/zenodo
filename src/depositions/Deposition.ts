/* eslint-disable no-await-in-loop */
import delay from 'delay';

import type { Zenodo } from '../Zenodo.ts';
import { ZenodoFile } from '../ZenodoFile.ts';
import { fetchZenodo } from '../fetchZenodo.ts';
import type { ZenodoDeposition } from '../utilities/ZenodoDepositionSchema.ts';
import type { ZenodoMetadata } from '../utilities/ZenodoMetadataSchema.ts';
import { validateZenodoDeposition } from '../utilities/schemaValidation.ts';

interface ZenodoFileCreationOptions {
  delays?: number[];
}

interface StatusObject {
  status: 'fulfilled' | 'rejected';
  error?: string;
  value?: ZenodoFile;
  filename: string;
}

export class Deposition {
  private zenodo: Zenodo;
  public value: ZenodoDeposition;

  constructor(zenodo: Zenodo, deposition: unknown) {
    this.zenodo = zenodo;
    this.value = validateZenodoDeposition(deposition);
  }

  /**
   * This method creates a new file in the deposition. If the file is already it will first
   * delete the existing file and then create a new one.
   * @param file - the file to create in the deposition
   * @returns ZenodoFile - the created file object
   */
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

  async createFiles(
    filesAndNames: Array<{ blob: Blob; name: string }>,
    options: ZenodoFileCreationOptions = {},
  ): Promise<StatusObject[]> {
    const { delays = [0, 1000, 2000, 4000, 8000, 16000] } = options;
    let remaining = filesAndNames.slice();
    const successes: ZenodoFile[] = [];
    let results: Array<PromiseSettledResult<ZenodoFile>> = [];
    const statuses: StatusObject[] = [];

    for (const wait of delays) {
      await delay(wait);

      const promises = remaining.map(({ blob, name }) =>
        this.createFile(
          new File([blob], name, {
            type: blob.type || 'application/octet-stream',
          }),
        ),
      );

      results = await Promise.allSettled(promises);

      successes.push(
        ...results
          .filter(
            (result): result is PromiseFulfilledResult<ZenodoFile> =>
              result.status === 'fulfilled',
          )
          .map((result) => result.value),
      );

      const rejectedIndices = new Set(
        results
          .map((result, i) => (result.status === 'rejected' ? i : -1))
          .filter((index) => index !== -1),
      );
      remaining = remaining.filter((_, i) => rejectedIndices.has(i));
      if (remaining.length === 0) break;
    }

    if (remaining.length > 0) {
      this.zenodo.logger?.warn(
        `Failed to upload ${remaining.length} files after ${delays.length} attempts: ${remaining.map((f) => f.name).join(', ')}`,
      );
    } else {
      this.zenodo.logger?.info(
        `Successfully uploaded all files for deposition ${this.value.id}`,
      );
    }
    statuses.push(
      ...results.map((result, index): StatusObject => {
        if (result.status === 'fulfilled') {
          return {
            status: 'fulfilled',
            value: result.value,
            filename: result.value.value.filename,
          };
        } else {
          return {
            status: 'rejected',
            error:
              result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
            filename: remaining[index] ? remaining[index].name : 'unknown',
          };
        }
      }),
    );
    return statuses;
  }

  /**
   * List all files in the deposition
   * @returns ZenodoFile[] - an array of ZenodoFile objects
   */
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

  /**
   * Delete a file from the deposition
   * @param id - the ID or the name of the file to delete
   */
  async deleteFile(id: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${id}`,
      method: 'DELETE',
      expectedStatus: 204,
    });
    this.zenodo.logger?.info(
      `Deleted file ${id} for deposition ${this.value.id}`,
    );
  }

  /**
   * Retrieve a file from the deposition
   * @param id - the ID or the name of the file to retrieve
   * @returns ZenodoFile - the file object
   */
  async retrieveFile(id: string): Promise<ZenodoFile> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/files/${id}`,
    });
    const file = new ZenodoFile(this.zenodo, await response.json());
    this.zenodo.logger?.info(
      `Retrieved file ${id} for deposition ${this.value.id}`,
    );
    return file;
  }

  /**
   * Update the metadata of the deposition
   * @param metadata - the new metadata to update the deposition with
   * @returns Deposition - the updated deposition object
   */
  async update(metadata: ZenodoMetadata): Promise<Deposition> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}`,
      method: 'PUT',
      body: JSON.stringify({ metadata }),
    });
    const deposition = new Deposition(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Updated deposition ${this.value.id}`);
    return deposition;
  }

  /**
   * Publish the deposition. This will make it publicly available.
   * !!! Note that the deposition cannot be deleted after it is published.
   * @returns Deposition - the updated deposition object after publishing
   */
  async publish(): Promise<Deposition> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/actions/publish`,
      method: 'POST',
      expectedStatus: 202,
    });
    const deposition = new Deposition(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Published deposition ${this.value.id}`);
    return deposition;
  }

  /**
   * Creates a new version of a published deposition.
   * This is useful for updating the deposition with new files or metadata.
   * The new version will have a new ID and will not overwrite the existing deposition.
   * @returns Deposition - a new deposition object that is a new version of the current deposition
   */
  async newVersion(): Promise<Deposition> {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.value.id}/actions/newversion`,
      method: 'POST',
      expectedStatus: 201,
    });
    const deposition = new Deposition(this.zenodo, await response.json());
    if (
      deposition.value.metadata &&
      !deposition.value.metadata?.publication_date
    ) {
      deposition.value.metadata.publication_date = new Date()
        .toISOString()
        .split('T')[0];
      await deposition.update(deposition.value.metadata);
    }
    this.zenodo.logger?.info(
      `Created new version for deposition ${this.value.id}`,
    );
    return deposition;
  }
}
