
import axiosClient from "./client";

export const postUploadPackages = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosClient.post("/packages/upload-install", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};
