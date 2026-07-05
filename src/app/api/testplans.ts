import axiosClient from "./client";

export const getTestPlans = async (rootPath?: string) => {
  const { data } = await axiosClient.get("/api/testplans", {
    params: rootPath ? { rootPath } : undefined,
  });
  return data;
};

export const getTestPlanEditorModel = async (path: string) => {
  const { data } = await axiosClient.post("/api/testplans/editor-model", { path });
  return data;
};

export const uploadTapPlan = async (file: File, destinationPath?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (destinationPath?.trim()) {
    formData.append("destinationPath", destinationPath.trim());
  }

  const { data } = await axiosClient.post("/api/testplans/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export interface RemoteTestPlanImportPayload {
  sourceType: "ftp" | "sftp" | "rest";
  sourceUrl: string;
  destinationPath?: string;
  username?: string;
  password?: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
}

export const importRemoteTestPlan = async (payload: RemoteTestPlanImportPayload) => {
  const { data } = await axiosClient.post("/api/testplans/import-remote", payload);
  return data;
};
