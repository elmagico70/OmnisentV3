import { apiClient } from '@/services/api';

export const useFilesApi = () => {
  return apiClient.files;
};
