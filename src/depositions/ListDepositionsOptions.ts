export interface ListDepositionsOptions {
  /**
   * Search query (using Elasticsearch query string syntax).
   * Some characters have special meaning here, including `/`, which is also present in full DOIs.
   */
  q?: string;

  /**
   * Filter result based on deposit status.
   * Possible values: 'draft' | 'published'
   */
  status?: 'draft' | 'published';

  /**
   * Sort order.
   * Possible values: 'bestmatch' | 'mostrecent'
   * Prefix with minus to change from ascending to descending (e.g., '-mostrecent').
   */
  sort?: 'bestmatch' | 'mostrecent' | `-${'bestmatch' | 'mostrecent'}`;

  /**
   * Page number for pagination.
   */
  page?: number;

  /**
   * Number of results to return per page.
   */
  size?: number;

  /**
   * Show or hide all versions of deposits.
   * Possible values: 'true' | 'false' | 1 | 0
   */
  all_versions?: 'true' | 'false' | 1 | 0;
}
