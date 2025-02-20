import { z } from 'zod';

import type { Zenodo } from './Zenodo';

// Define the Zod schema
const zenodoFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  filesize: z.number(),
  checksum: z.string(),
  links: z.object({
    download: z.string().url(),
    self: z.string().url(),
  }),
});

type ZenodoFileType = z.infer<typeof zenodoFileSchema>;

export class ZenodoFile implements ZenodoFileType {
  private zenodo: Zenodo;
  public id: string;
  public filename: string;
  public filesize: number;
  public checksum: string;
  public links: {
    download: string;
    self: string;
  };

  constructor(zenodo: Zenodo, file: unknown) {
    const validatedFile = zenodoFileSchema.parse(file);
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
