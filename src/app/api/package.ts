
import axiosClient from "./client";

export const getInstalledPackages = async () => {
  const response = await axiosClient.get("/packages/installed");
  return Array.isArray(response.data) ? response.data : [];
};

export const getAvailablePackages = async (search?: string) => {
  const response = await axiosClient.get("/packages/available", {
    params: search ? { search } : {},
  });
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.packages)) return payload.packages;
  return [];
};

export const installPackage = async (packageName: string) => {
  const response = await axiosClient.post("/packages/install", [packageName]);
  return response.data;
};

export const uninstallPackage = async (packageName: string) => {
  const response = await axiosClient.post("/packages/uninstall", [packageName]);
  return response.data;
};
