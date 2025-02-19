import type { Zenodo } from '../Zenodo';
import { fetchZenodo } from '../fetchZenodo';
import { ZenodoFile } from '../files/ZenodoFile';
import type { DepositionMetadata } from '../types';

export class Deposition {
  private zenodo: Zenodo;
  created: string; // ISO8601 timestamp
  modified: string; // ISO8601 timestamp
  id: number;
  metadata: DepositionMetadata;
  title: string;

  doi?: string; // Present only for published depositions
  doi_url?: string; // URL to DOI
  record_url?: string; // URL to public version of record

  links: Record<string, string>;
  record_id?: number; // Present only for published depositions
  owner: number;
  files: ZenodoFile[];
  state: 'unsubmitted' | 'inprogress' | 'done' | 'error';
  submitted: boolean;

  constructor(zenodo: Zenodo, deposition: Deposition) {
    this.zenodo = zenodo;
    this.created = deposition.created;
    this.modified = deposition.modified;
    this.id = deposition.id;
    this.metadata = deposition.metadata;
    this.title = deposition.title;

    this.doi = deposition.doi;
    this.doi_url = deposition.doi_url;
    this.record_url = deposition.record_url;

    this.links = deposition.links;
    this.record_id = deposition.record_id;
    this.owner = deposition.owner;
    this.files = deposition.files;
    this.state = deposition.state;
    this.submitted = deposition.submitted;
  }

  async createFile(file: File): Promise<ZenodoFile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.id}/files`,
      method: 'POST',
      body: formData,
      expectedStatus: 201,
    });
    return new ZenodoFile(await response.json());
  }

  async listFiles() {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.id}/files`,
    });
    const files = await response.json();
    return files.map((file) => new ZenodoFile(file));
  }

  async deleteFile(fileId: string): Promise<void> {
    await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.id}/files/${fileId}`,
      method: 'DELETE',
      expectedStatus: 204,
    });
  }

  async retrieveFile(fileId: string) {
    const response = await fetchZenodo(this.zenodo, {
      route: `deposit/depositions/${this.id}/files/${fileId}`,
    });
    return new ZenodoFile(await response.json());
  }
}
