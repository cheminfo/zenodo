/**
 * An identifier.
 */
export type Identifier = string | number;
/**
 * Type of name.
 */
export type NameType = 'personal' | 'organizational';
/**
 * A scheme.
 */
export type Scheme = string;
export type Affiliations = Affiliation[];
export type Subjects = Subject[];
export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONLineString
  | GeoJSONPolygon
  | GeoJSONMultiPoint
  | GeoJSONMultiLineString
  | GeoJSONMultiPolygon;
/**
 * An agent (user, software process, community, ...).
 */
export type Agent = User | null;

export interface ZenodoRecord {
  $schema?: string;
  id?: Identifier;
  pid?: InternalPid;
  /**
   * External persistent identifiers for a record including e.g. OAI-PMH identifier, minted DOIs and more. PIDs are registered in the PIDStore.
   */
  pids?: Record<string, ExternalPid>;
  links?: {
    self?: string;
    self_html?: string;
    preview_html?: string;
    reserve_doi?: string;
    doi?: string;
    doi_html?: string;
    parent_doi?: string;
    parent_doi_html?: string;
    self_iiif_manifest?: string;
    self_iiif_sequence?: string;
    files?: string;
    media_files?: string;
    archive?: string;
    archive_media?: string;
    versions?: string;
    record?: string;
    record_html?: string;
    publish?: string;
    review?: string;
    access_links?: string;
    access_grants?: string;
    access_users?: string;
    access_request?: string;
    access?: string;
    communities?: string;
    communities_suggestions?: string;
    requests?: string;
  };
  metadata?: ZenodoMetadata;
  /**
   * Configured additional metadata
   */
  custom_fields?: Record<string, unknown>;
  /**
   * Tombstone information for the record.
   */
  tombstone?: {
    /**
     * Reason for record removal.
     */
    removal_reason?: {
      id?: Identifier;
    };
    /**
     * Public note about the removal.
     */
    note?: string;
    removed_by?: Agent;
    /**
     * ISO8601 formatted timestamp in UTC.
     */
    removal_date?: string;
    /**
     * The record citation text to be displayed on the tombstone page.
     */
    citation_text?: string;
    /**
     * Whether or not the tombstone page is publicly visible.
     */
    is_visible?: boolean;
  };
  internal_notes?: Array<{
    id?: string;
    note?: string;
    /**
     * ISO8601 formatted timestamp in UTC.
     */
    timestamp?: string;
    added_by?: Agent;
    [k: string]: unknown;
  }>;
  /**
   * Record provenance.
   */
  provenance?: {
    created_by?: Agent;
    on_behalf_of?: Agent;
  };
  /**
   * Record access control and ownership.
   */
  access?: {
    /**
     * Record visibility (public or restricted)
     */
    record?: 'public' | 'restricted';
    /**
     * Files visibility (public or restricted)
     */
    files?: 'public' | 'restricted';
    /**
     * Description of the embargo on the record.
     */
    embargo?: {
      /**
       * Whether or not the embargo is (still) active.
       */
      active?: boolean | null;
      /**
       * Embargo date of record (ISO8601 formatted date time in UTC). At this time both metadata and files will be made public.
       */
      until?: string | null;
      /**
       * The reason why the record is under embargo.
       */
      reason?: string | null;
    };
  };
  files?: FilesSimple;
  media_files?: FilesSimple;
  notes?: string[];
  status?: string;
}
/**
 * An internal persistent identifier object.
 */
export interface InternalPid {
  /**
   * Primary key of the PID object.
   */
  pk: number;
  /**
   * The status of the PID (from Invenio-PIDStore).
   */
  status: 'N' | 'K' | 'R' | 'M' | 'D';
  /**
   * The type of the persistent identifier.
   */
  pid_type?: string;
  /**
   * The type of the associated object.
   */
  obj_type?: string;
}
/**
 * An external persistent identifier object.
 */
export interface ExternalPid {
  identifier?: Identifier;
  /**
   * The provider of the persistent identifier.
   */
  provider?: string;
  /**
   * Client identifier for the specific PID.
   */
  client?: string;
}
/**
 * Resource metadata.
 */
export interface ZenodoMetadata {
  resource_type?: ResourceType;
  /**
   * Creators of the resource.
   */
  creators?: Array<{
    person_or_org?: PersonOrOrg;
    role?: Role;
    affiliations?: Affiliations;
  }>;
  /**
   * Primary title of the record.
   */
  title?: string;
  /**
   * Additional record titles.
   */
  additional_titles?: Array<{
    /**
     * Additional title of the record.
     */
    title?: string;
    type?: TitleType;
    lang?: Language;
  }>;
  publisher?: string;
  /**
   * Record publication date (EDTF level 0 format).
   */
  publication_date?: string;
  subjects?: Subjects;
  /**
   * Contributors in order of importance.
   */
  contributors?: Array<{
    person_or_org?: PersonOrOrg;
    role?: Role;
    affiliations?: Affiliations;
  }>;
  /**
   * Date, datetime or date interval.
   */
  dates?: Array<{
    /**
     * Date, datetime or date interval in EDTF level 0 format
     */
    date?: string;
    type?: DateType;
    /**
     * Description of the date, datetime or date interval e.g. 'Accepted' or 'Available' (CV).
     */
    description?: string;
  }>;
  /**
   * The primary languages of the resource. ISO 639-3 language code.
   */
  languages?: Language[];
  /**
   * Alternate identifiers for the record.
   */
  identifiers?: IdentifiersWithScheme[];
  related_identifiers?: Array<{
    identifier?: Identifier;
    scheme?: Scheme;
    relation_type?: RelationType;
    resource_type?: ResourceType;
  }>;
  sizes?: string[];
  formats?: string[];
  /**
   * Record version tag.
   */
  version?: string;
  /**
   * Any license or copyright information for this resource.
   */
  rights?: Array<{
    id?: Identifier;
    /**
     * The license name or license itself. Free text.
     */
    title?: Record<string, unknown>;
    /**
     * The license description Free text.
     */
    description?: Record<string, unknown>;
    link?: string;
  }>;
  /**
   * Copyright for record (may contain HTML).
   */
  copyright?: string;
  /**
   * Description for record (may contain HTML).
   */
  description?: string;
  additional_descriptions?: Array<{
    /**
     * Description for record.
     */
    description?: string;
    type?: DescriptionType;
    lang?: Language;
  }>;
  /**
   * Geographical locations relevant to this record.
   */
  locations?: {
    features?: [
      {
        geometry?: GeoJSONGeometry & {
          type?: unknown;
          coordinates?: unknown;
        };
        identifiers?: IdentifiersWithScheme[];
        /**
         * Place of the location
         */
        place?: string;
        /**
         * Description of the location
         */
        description?: string;
      },
      ...Array<{
        geometry?: GeoJSONGeometry & {
          type?: unknown;
          coordinates?: unknown;
        };
        identifiers?: IdentifiersWithScheme[];
        /**
         * Place of the location
         */
        place?: string;
        /**
         * Description of the location
         */
        description?: string;
      }>,
    ];
  };
  funding?: Array<{
    funder?: {
      name?: string;
      id?: Identifier;
    };
    award?: {
      title?: Record<string, unknown>;
      number?: string;
      id?: Identifier;
      identifiers?: IdentifiersWithScheme[];
    };
  }>;
  references?: Array<{
    /**
     * A reference string.
     */
    reference?: string;
    identifier?: Identifier;
    scheme?: Scheme;
  }>;
}
/**
 * A resource type.
 */
export interface ResourceType {
  id?: Identifier;
}
export interface PersonOrOrg {
  name?: string;
  type?: NameType;
  given_name?: string;
  family_name?: string;
  identifiers?: IdentifiersWithScheme[];
}
/**
 * Identifiers object with identifier value and scheme in separate keys.
 */
export interface IdentifiersWithScheme {
  identifier?: Identifier;
  scheme?: Scheme;
}
/**
 * Role of creator/contributor.
 */
export interface Role {
  id?: Identifier;
}
export interface Affiliation {
  id?: Identifier;
  name?: string;
}
/**
 * Type of title.
 */
export interface TitleType {
  id?: Identifier;
}
export interface Language {
  id?: string;
}
/**
 * Term related to entry.
 */
export interface Subject {
  id?: Identifier;
  subject?: string;
}
/**
 * Type of the date.
 */
export interface DateType {
  id?: Identifier;
}
/**
 * A relation type.
 */
export interface RelationType {
  id?: Identifier;
}
/**
 * A description type.
 */
export interface DescriptionType {
  id?: string;
}
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number, ...number[]];
}
export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [
    [number, number, ...number[]],
    [number, number, ...number[]],
    ...Array<[number, number, ...number[]]>,
  ];
}
export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: Array<
    [
      [number, number, ...number[]],
      [number, number, ...number[]],
      [number, number, ...number[]],
      [number, number, ...number[]],
      ...Array<[number, number, ...number[]]>,
    ]
  >;
}
export interface GeoJSONMultiPoint {
  type: 'MultiPoint';
  coordinates: Array<[number, number, ...number[]]>;
}
export interface GeoJSONMultiLineString {
  type: 'MultiLineString';
  coordinates: Array<
    [
      [number, number, ...number[]],
      [number, number, ...number[]],
      ...Array<[number, number, ...number[]]>,
    ]
  >;
}
export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: Array<
    Array<
      [
        [number, number, ...number[]],
        [number, number, ...number[]],
        [number, number, ...number[]],
        [number, number, ...number[]],
        ...Array<[number, number, ...number[]]>,
      ]
    >
  >;
}
/**
 * User object.
 */
export interface User {
  user?: string | number;
}
/**
 * Files associated with the object.
 */
export interface FilesSimple {
  /**
   * Set to false for metadata only records.
   */
  enabled?: boolean;
}
