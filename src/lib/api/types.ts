export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number, options?: { cause?: unknown }) {
    super(message, options);
    this.status = status;
  }
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiOptions {
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  cache?: RequestCache;
  revalidate?: number | false;
  tags?: string[];
}
