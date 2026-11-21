import { ApiClient } from '@repo/api-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = new ApiClient({
  baseUrl: apiUrl,
});
