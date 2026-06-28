import axiosClient from "./client";

export const getTestPlans = async (rootPath?: string) => {
  const { data } = await axiosClient.get("/testplans", {
    params: rootPath ? { rootPath } : undefined,
  });
  return data;
};
