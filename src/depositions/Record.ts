import type { Zenodo } from '../Zenodo.ts';
import { ZenodoFile } from '../ZenodoFile.ts';
import { fetchZenodo } from '../fetchZenodo.ts';
import type { ZenodoRecord } from '../utilities/ZenodoRecordSchema.ts';
import { validateZenodoRecord } from '../utilities/schemaValidation.ts';
import { zipFiles } from '../utilities/zipFiles.ts';

export class Record {
  public value: ZenodoRecord;
  private zenodo: Zenodo;

  constructor(zenodo: Zenodo, value: unknown) {
    this.zenodo = zenodo;
    this.value = validateZenodoRecord(value);
  }

  async uploadFiles(files: File[]): Promise<Record> {
    // step 1: Start draft file upload(s)
    console.log('step 1: Starting draft file upload(s)');
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
    console.log('step 2: Uploading draft file(s) content');
    await Promise.all(
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
        console.log(`step 3: Completing draft file upload for ${file.name}`);
        await fetchZenodo(this.zenodo, {
          route: `records/${this.value.id}/draft/files/${file.name}/commit`,
          method: 'POST',
          expectedStatus: 201,
        });
      }),
    );

    return await this.zenodo.retrieveRecord(this.value.id);
  }

  async uploadFilesAsZip(files: File[], zipFileName: string): Promise<Record> {
    const zippedFiles = await zipFiles(files, zipFileName);
    return await this.uploadFiles([zippedFiles]);
  }

  async listFiles(): Promise<ZenodoFile[]> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/files`,
    });
    const files = (await response.json()) as unknown[];
    this.zenodo.logger?.info(
      `Listed ${files.length} files for deposition ${this.value.id}`,
    );

    return files.map((file) => new ZenodoFile(this.zenodo, file));
  }

  async deleteFile(filename: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}/draft/files/${filename}`,
      method: 'DELETE',
      expectedStatus: 200,
    });
    this.zenodo.logger?.info(
      `Deleted file ${filename} for record ${this.value.id}`,
    );
  }

  async deleteAllFiles(): Promise<void> {
    const files = await this.listFiles();
    for (const file of files) {
      await this.deleteFile(file.value.filename);
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

  async update(record: ZenodoRecord): Promise<Record> {
    const response = await fetchZenodo(this.zenodo, {
      route: `records/${this.value.id}`,
      method: 'PUT',
      body: JSON.stringify({ record }),
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
}
