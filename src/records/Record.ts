/* eslint-disable no-await-in-loop */
import type { Zenodo, PublicRecordOptions } from '../Zenodo.ts';
import { ZenodoFile } from '../ZenodoFile.ts';
import { fetchZenodo } from '../fetchZenodo.ts';
import type { ZenodoMetadata } from '../utilities/ZenodoMetadataSchema.ts';
import type { ZenodoRecord } from '../utilities/ZenodoRecordSchema.ts';
import type { ZenodoReview } from '../utilities/ZenodoReviewSchema.ts';
import { validateZenodoRecord } from '../utilities/schemaValidation.ts';
import { zipFiles } from '../utilities/zipFiles.ts';

export class Record {
  public value: ZenodoRecord;
  private zenodo: Zenodo;

  constructor(zenodo: Zenodo, value: unknown) {
    this.zenodo = zenodo;
    this.value = validateZenodoRecord(value);
  }

  async uploadFiles(files: File[]): Promise<ZenodoFile[]> {
    // step 1: Start draft file upload(s)
    const step1Body = files.map((file) => ({
      key: file.name,
    }));
    await fetchZenodo(this.zenodo, {
      route: `/records/${this.value.id}/draft/files`,
      method: 'POST',
      body: JSON.stringify(step1Body),
      contentType: 'application/json',
      expectedStatus: 201,
    });

    // step 2: Upload a draft file(s) content
    const response = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        await fetchZenodo(this.zenodo, {
          route: `records/${this.value.id}/draft/files/${file.name}/content`,
          method: 'PUT',
          body: formData,
          contentType: 'application/octet-stream',
          expectedStatus: 200,
        });
        // step 3: Complete a draft file upload
        return await fetchZenodo(this.zenodo, {
          route: `records/${this.value.id}/draft/files/${file.name}/commit`,
          method: 'POST',
          expectedStatus: 200,
        });
      }),
    );
    const zenodoFiles = await Promise.all(
      response.map(
        async (res) => new ZenodoFile(this.zenodo, await res.json()),
      ),
    );
    return zenodoFiles;
  }

  async uploadFilesAsZip(
    files: File[],
    zipFileName: string,
  ): Promise<ZenodoFile[]> {
    const zippedFiles = await zipFiles(files, zipFileName);
    return await this.uploadFiles([zippedFiles]);
  }

  async listFiles(): Promise<ZenodoFile[]> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/files`,
    });
    const files = (await response.json()) as {
      entries: unknown[];
      links: {
        self: string;
        next?: string;
      };
    };

    if (files.entries.length === 0) {
      this.zenodo.logger?.info(`No files found for record ${this.value.id}`);
      return [];
    } else if (files.links.next) {
      this.zenodo.logger?.warn(
        `Multiple pages of files found for record ${this.value.id}. Only the first page is returned.`,
      );
    }
    this.zenodo.logger?.info(
      `Listed ${files.entries.length} files for deposition ${this.value.id}`,
    );

    return files.entries.map((file) => new ZenodoFile(this.zenodo, file));
  }

  async deleteFile(filename: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/files/${filename}`,
      method: 'DELETE',
      expectedStatus: 204,
    });
    this.zenodo.logger?.info(
      `Deleted file ${filename} for record ${this.value.id}`,
    );
  }

  async deleteAllFiles(): Promise<void> {
    const files = await this.listFiles();
    for (const file of files) {
      await this.deleteFile(file.value.key);
    }
    this.zenodo.logger?.info(`Deleted all files for record ${this.value.id}`);
  }

  async retrieveFile(filename: string): Promise<ZenodoFile> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/files/${filename}`,
    });
    const file = new ZenodoFile(this.zenodo, await response.json());
    this.zenodo.logger?.info(
      `Retrieved file ${filename} for record ${this.value.id}`,
    );
    return file;
  }

  async update(
    metadata: ZenodoMetadata,
    options: PublicRecordOptions = {},
  ): Promise<Record> {
    const { isPublished = false } = options;
    const route = isPublished
      ? `records/${this.value.id}`
      : `records/${this.value.id}/draft`;
    const response = await fetchZenodo(this.zenodo, {
      route,
      method: 'PUT',
      body: JSON.stringify({ metadata }),
      contentType: 'application/json',
      expectedStatus: 200,
    });
    const updatedRecord = new Record(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Updated record ${this.value.id}`);
    return updatedRecord;
  }

  async publish(): Promise<Record> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/actions/publish`,
      method: 'POST',
      expectedStatus: 201,
    });
    const publishedRecord = new Record(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Published record ${this.value.id}`);
    return publishedRecord;
  }

  async newVersion(): Promise<Record> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/actions/newversion`,
      method: 'POST',
      expectedStatus: 201,
    });
    const newVersionRecord = new Record(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Created new version for record ${this.value.id}`);
    return newVersionRecord;
  }

  async submitForReview(url?: string): Promise<ZenodoReview> {
    if (url) {
      url = url.replace(/.*requests\//, 'requests/');
      const response = await fetchZenodo(this.zenodo, {
        route: url,
        method: 'POST',
      });
      this.zenodo.logger?.info(
        `Submitted deposition ${this.value.id} for review via URL ${url}`,
      );
      return (await response.json()) as ZenodoReview;
    } else {
      const response = await fetchZenodo(this.zenodo, {
        route: `requests`,
      });
      const requests = (await response.json()) as {
        hits: {
          total: number;
          hits: ZenodoReview[];
        };
      };
      const request = requests.hits.hits.find(
        (req) => req.topic.record === String(this.value.id),
      );
      await fetchZenodo(this.zenodo, {
        route: request?.links.actions?.submit,
        method: 'POST',
        expectedStatus: 202,
      });
      this.zenodo.logger?.info(
        `Submitted deposition ${this.value.id} for review`,
      );
      return request as ZenodoReview;
    }
  }

  /**
   * Adds the deposition to a community.
   * This method adds the deposition to a community by creating a review request.
   * @param communityId - the ID of the community to add the deposition to
   * @returns the response from the Zenodo API
   */
  async addToCommunity(communityId: string): Promise<unknown> {
    const body = JSON.stringify({
      receiver: { community: communityId },
      type: 'community-submission',
    });
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/review`,
      method: 'PUT',
      body,
      expectedStatus: 200,
    });
    this.zenodo.logger?.info(
      `Added deposition ${this.value.id} to community ${communityId}`,
    );
    return await response.json();
  }

  async reserveDOI(): Promise<Record> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/pids/doi`,
      method: 'POST',
      expectedStatus: 201,
    });
    const updatedRecord = new Record(this.zenodo, await response.json());
    this.zenodo.logger?.info(`Reserved DOI for record ${this.value.id}`);
    return updatedRecord;
  }
}
