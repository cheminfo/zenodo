export interface ZenodoFile {
  id: string;
  filename: string;
  filesize: number;
  checksum: string; // md5
}

interface Creator {
  name: string;
  affiliation?: string;
  orcid?: string;
  gnd?: string;
}

interface RelatedIdentifier {
  identifier: string;
  relation: string;
  resource_type?: string;
}

interface Contributor {
  name: string;
  type: string;
  affiliation?: string;
  orcid?: string;
  gnd?: string;
}

interface Community {
  identifier: string;
}

interface Grant {
  id: string;
}

interface Subject {
  term: string;
  identifier: string;
  scheme: string;
}

interface Location {
  lat?: number;
  lon?: number;
  place: string;
  description?: string;
}

interface DateInterval {
  start?: string;
  end?: string;
  type: string;
  description?: string;
}

export interface DepositionMetadata {
  upload_type:
    | 'publication'
    | 'poster'
    | 'presentation'
    | 'dataset'
    | 'image'
    | 'video'
    | 'software'
    | 'lesson'
    | 'physicalobject'
    | 'other';
  publication_type?: string;
  image_type?: string;
  publication_date: string;
  title: string;
  creators: Creator[];
  description: string;
  access_right: 'open' | 'embargoed' | 'restricted' | 'closed';
  license?: string;
  embargo_date?: string;
  access_conditions?: string;
  doi?: string;
  prereserve_doi?: boolean | object;
  keywords?: string[];
  notes?: string;
  related_identifiers?: RelatedIdentifier[];
  contributors?: Contributor[];
  references?: string[];
  communities?: Community[];
  grants?: Grant[];
  journal_title?: string;
  journal_volume?: string;
  journal_issue?: string;
  journal_pages?: string;
  conference_title?: string;
  conference_acronym?: string;
  conference_dates?: string;
  conference_place?: string;
  conference_url?: string;
  conference_session?: string;
  conference_session_part?: string;
  imprint_publisher?: string;
  imprint_isbn?: string;
  imprint_place?: string;
  partof_title?: string;
  partof_pages?: string;
  thesis_supervisors?: Creator[];
  thesis_university?: string;
  subjects?: Subject[];
  version?: string;
  language?: string;
  locations?: Location[];
  dates?: DateInterval[];
  method?: string;
}

export interface Deposition {
  created: string; // ISO8601 timestamp
  doi?: string; // Present only for published depositions
  doi_url?: string; // URL to DOI
  files: ZenodoFile[];
  id: number;
  metadata: DepositionMetadata;
  modified: string; // ISO8601 timestamp
  owner: number;
  record_id?: number; // Present only for published depositions
  record_url?: string; // URL to public version of record
  state: 'inprogress' | 'done' | 'error';
  submitted: boolean;
  title: string;
}
