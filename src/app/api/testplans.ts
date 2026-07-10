import axiosClient from "./client";

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

export const getTestPlans = async (rootPath?: string) => {
  const { data } = await axiosClient.get("/testplans", {
    params: rootPath ? { rootPath } : undefined,
  });
  return data;
};

export const getTestPlanEditorModel = async (path: string) => {
  const { data } = await axiosClient.post("/testplans/editor-model", { path });
  return data;
};

export const uploadTapPlan = async (file: File, destinationPath?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (destinationPath?.trim()) {
    formData.append("destinationPath", destinationPath.trim());
  }

  const { data } = await axiosClient.post("/testplans/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
};

export const getStepSchema = async (stepTypeName: string) => {
  const { data } = await axiosClient.get("/testplans/steps/schema", {
    params: {
      stepTypeName,
    },
  });

  return data;
};

export const composeTestPlan = async (payload: any) => {
  const { data } = await axiosClient.post("/testplans/compose", payload);
  return data;
};
export const createTestPlan = async (payload: any) => {
  const { data } = await axiosClient.post("/testplans/create", payload);
  return data;
};


export const runTestPlan = async (payload: any) => {
  const { data } = await axiosClient.post("/testplans/run", payload);
  return data;
};




export const importRemoteTestPlan = async (payload: RemoteTestPlanImportPayload) => {
  const { data } = await axiosClient.post("/testplans/import-remote", payload);
  return data;
};
