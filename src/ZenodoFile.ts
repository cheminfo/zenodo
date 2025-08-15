import type { Zenodo } from './Zenodo.ts';

interface ZenodoFileType {
  created: string;
  updated: string;
  mimetype: string;
  version_id: string;
  file_id: string;
  bucket_id: string;
  metadata: object;
  access: { hidden: boolean };
  links: {
    self: string;
    content: string;
    commit: string;
  };
  key: string;
  transfer: { type: string };
  status: string;
  checksum: string;
  size: number;
  storage_class: string;
}

export class ZenodoFile {
  private zenodo: Zenodo;
  public value: ZenodoFileType;

  constructor(zenodo: Zenodo, file: unknown) {
    this.value = file as ZenodoFileType;
    this.zenodo = zenodo;
  }

  async getContentResponse() {
    const link = this.value.links.content;
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
