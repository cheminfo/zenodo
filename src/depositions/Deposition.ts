/* eslint-disable no-await-in-loop */
import type { Zenodo } from '../Zenodo.ts';
import { ZenodoFile } from '../ZenodoFile.ts';
import { fetchZenodo } from '../fetchZenodo.ts';
import type { ZenodoDeposition } from '../utilities/ZenodoDepositionSchema.ts';
import type { ZenodoMetadata } from '../utilities/ZenodoMetadataSchema.ts';
import type { ZenodoReview } from '../utilities/ZenodoReviewSchema.ts';
import { validateZenodoDeposition } from '../utilities/schemaValidation.ts';
import { zipFiles } from '../utilities/zipFiles.ts';

export class Deposition {
  private zenodo: Zenodo;
  public value: ZenodoDeposition;

  constructor(zenodo: Zenodo, deposition: unknown) {
    this.zenodo = zenodo;
    this.value = validateZenodoDeposition(deposition, zenodo.logger);
  }

  /**
   * This method creates a new file in the deposition. If the file is already it will first
   * delete the existing file and then create a new one.
   * @param file - the file to create in the deposition
   * @returns the created file object
   */
  async createFile(file: File): Promise<ZenodoFile> {
    const createdFile = await this.createFiles([file]);
    if (!createdFile[0]) {
      throw new Error('Failed to create file: No status object returned.');
    }
    return createdFile[0];
  }

  /**
   * Creates multiple files in the deposition. It will attempt to create each file
   * multiple times with delays in between until all files are successfully created or
   * the maximum number of attempts is reached.
   * @param filesAndNames - an array of File objects to be created in the deposition
   * @returns an array of the created ZenodoFile objects
   */
  async createFiles(filesAndNames: File[]): Promise<ZenodoFile[]> {
    const promises = filesAndNames.map((file) => this.uploadFile(file));
    return await Promise.all(promises);
  }

  /**
   * Creates a zip file from multiple files and uploads it to the deposition.
   * @param filesAndNames - an array of File objects to be created in the deposition
   * @param zipName - the name of the zip file to be created
   * @returns an array of the created ZenodoFile objects
   */
  async createFilesAsZip(
    filesAndNames: File[],
    zipName: string,
  ): Promise<ZenodoFile[]> {
    const zippedFile = await zipFiles(filesAndNames, zipName);
    return this.createFiles([zippedFile]);
  }

  /**
   * List all files in the deposition
   * @returns an array of ZenodoFile objects
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
   * delete all files from the deposition
   */
  async deleteAllFiles(): Promise<void> {
    const files = await this.listFiles();
    for (const file of files) {
      await this.deleteFile(file.value.id);
    }
    this.zenodo.logger?.info(
      `Deleted all files for deposition ${this.value.id}`,
    );
  }

  /**
   * Retrieve a file from the deposition
   * @param id - the ID or the name of the file to retrieve
   * @returns the file object
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
   * @returns the updated deposition object
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
   * @returns the updated deposition object after publishing
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
   * @returns a new deposition object that is a new version of the current deposition
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

  /**
   * Upload a file to the deposition
   * @param file - the file to upload to the deposition
   * @returns the created file object
   */
  async uploadFile(file: File): Promise<ZenodoFile> {
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
    this.value.files?.push(zenodoFile.value);
    return zenodoFile;
  }

  /**
   * Submits the deposition for review via browser.
   * CORS request won't work from the other endpoint when using a browser.
   * If a URL is provided, it will use that URL to submit the request.
   * Otherwise, it will find the request for the current deposition and submit it.
   * This is not the intended endpoint for submitting requests via browser.
   * But the base endpoint is not CORS enabled.
   * You can find the method with the right endpoint at:
   * https://github.com/cheminfo/zenodo/blob/7fbf3e8bb44246b3465b94b68c21cd3f4fee3bf6/src/depositions/Deposition.ts#L286-L301
   * @param url - optional URL to submit the request
   * @returns The submitted Zenodo request object
   */
  async submitForReview(url?: string): Promise<ZenodoReview> {
    if (url) {
      // If a URL is provided, we assume it's a full API endpoint for submitting the request
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
}
