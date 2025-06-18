import { z } from 'zod';

import type { Zenodo } from './Zenodo.ts';

// Define the Zod schema
export const zenodoFileSchema = z.object({
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

export class ZenodoFile {
  private zenodo: Zenodo;
  public value: ZenodoFileType;

  constructor(zenodo: Zenodo, file: unknown) {
    this.value = zenodoFileSchema.parse(file);
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
