import { ApiError } from '@/lib/api/types';

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = (body as { message?: string }).message || response.statusText;
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}
