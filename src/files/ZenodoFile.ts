export class ZenodoFile {
  id: string;
  filename: string;
  filesize: number;
  checksum: string; // md5
  links: Record<string, string>;

  constructor(file: ZenodoFile) {
    this.id = file.id;
    this.filename = file.filename;
    this.filesize = file.filesize;
    this.checksum = file.checksum;
    this.links = file.links;
  }
}
