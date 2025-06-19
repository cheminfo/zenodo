import type { Zenodo } from './Zenodo.ts';
import type { ZenodoFileType } from './utilities/ZenodoFileSchema.ts';
import { validateZenodoFile } from './utilities/schemaValidation.ts';

export class ZenodoFile {
  private zenodo: Zenodo;
  public value: ZenodoFileType;

  constructor(zenodo: Zenodo, file: unknown) {
    this.value = validateZenodoFile(file)
      ? (file as ZenodoFileType)
      : ({} as ZenodoFileType);
    this.zenodo = zenodo;
  }

  async getContentResponse() {
    const link = this.value.links.download;
    const response = await fetch(link, {
      headers: {
        Authorization: `Bearer ${this.zenodo.accessToken}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${link}`);
    }
    return response;
  }
}
