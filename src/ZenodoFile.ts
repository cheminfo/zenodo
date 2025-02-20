import { z } from 'zod';

import type { Zenodo } from './Zenodo';

export class ZenodoFile {
  private zenodo: Zenodo;
  id: string;
  filename: string;
  filesize: number;
  checksum: string; // md5
  links: {
    download: string;
    self: string;
  };

  static schema = z.object({
    id: z.string(),
    filename: z.string(),
    filesize: z.number(),
    checksum: z.string().regex(/^[a-fA-F0-9]{32}$/, 'Invalid MD5 checksum'),
    links: z.object({
      download: z.string().url(),
      self: z.string().url(),
    }),
  });

  constructor(zenodo: Zenodo, file: unknown) {
    const validatedFile = ZenodoFile.schema.parse(file);
    this.zenodo = zenodo;
    this.id = validatedFile.id;
    this.filename = validatedFile.filename;
    this.filesize = validatedFile.filesize;
    this.checksum = validatedFile.checksum;
    this.links = validatedFile.links;
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
