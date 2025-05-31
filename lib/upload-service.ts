import axios from "axios";

export interface UploadResponse {
  id: string;
  path: string;
  fullPath: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const UploadService = {
  uploadFile: async (
    file: File,
    password?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (password) formData.append("password", password);

    try {
      const response = await axios.post<UploadResponse>("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage,
            });
          }
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to upload file");
    }
  },
};
