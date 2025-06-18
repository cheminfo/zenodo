/* eslint-disable no-await-in-loop */
import type { Zenodo } from '../Zenodo.ts';
import { ZenodoFile } from '../ZenodoFile.ts';
import { fetchZenodo } from '../fetchZenodo.ts';

import { zenodoDepositionSchema } from './depositionSchema.ts';
import type {
  DepositionMetadata,
  ZenodoDeposition,
} from './depositionSchema.ts';

interface ZenodoFileCreationOptions {
  delays?: number[];
}

interface StatusObject {
  status: 'fulfilled' | 'rejected';
  modified?: boolean;
  error?: string;
  value?: ZenodoFile;
  filename?: string;
}

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

  async createFiles(
    filesAndNames: Array<{ blob: Blob; name: string }>,
    options: ZenodoFileCreationOptions = {},
  ): Promise<StatusObject[]> {
    const { delays = [0, 1000, 2000, 4000, 8000, 16000] } = options;
    let remaining = filesAndNames.slice();
    const successes: ZenodoFile[] = [];
    let results: Array<PromiseSettledResult<ZenodoFile>> = [];
    const statuses: StatusObject[] = [];

    for (const delay of delays) {
      await new Promise((res) => {
        setTimeout(res, delay);
      });

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
            filename: remaining[index]?.name,
          };
        }
      }),
    );

    return statuses;
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
