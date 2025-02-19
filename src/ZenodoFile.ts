import type { Zenodo } from './Zenodo';

export class ZenodoFile {
  private zenodo: Zenodo;
  id: string;
  filename: string;
  filesize: number;
  checksum: string; // md5
  links: Record<string, string>;

  constructor(zenodo: Zenodo, file: ZenodoFile) {
    this.zenodo = zenodo;
    this.id = file.id;
    this.filename = file.filename;
    this.filesize = file.filesize;
    this.checksum = file.checksum;
    this.links = file.links;
  }

  async getContentResponse() {
    const link = this.links.download;
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
