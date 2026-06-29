import axiosClient from "./client";

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
