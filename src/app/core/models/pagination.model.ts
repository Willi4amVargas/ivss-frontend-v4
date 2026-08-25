export enum Scope {
  ME = 'me',
  ALL = 'all',
}

export interface PaginationQueryParams {
  page?: number;
  limit?: number;
  scope?: Scope;
}

export interface PaginatedMeta {
  page: number;
  page_items: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
