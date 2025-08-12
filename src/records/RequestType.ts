/**
 * An identifier.
 */
export type Identifier = string;

export interface ZenodoReview {
  $schema?: string;
  id?: Identifier;
  created?: string;
  created_by?: {
    user?: Identifier;
  };
  expires_at?: string;
  is_closed?: boolean;
  is_expired?: boolean;
  is_open?: boolean;
  links?: {
    actions?: {
      submit?: string;
    };
    comments?: string;
    self?: string;
    self_html?: string;
    timeline?: string;
  };
  number: string;
  receiver?: {
    community?: Identifier;
  };
  revision_id?: number;
  status?: string;
  topic?: {
    record?: Identifier;
  };
  type?: string;
  updated?: string;
}
