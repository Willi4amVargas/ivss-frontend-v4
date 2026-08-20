export interface PaginationQueryParams {
  page?: number;
  limit?: number;
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
