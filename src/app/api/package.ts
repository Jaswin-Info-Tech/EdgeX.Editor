// api/packages.js

import axiosClient from "./client";

export const getInstalledPackages = async (packageName = "") => {
  const normalizedPackageName = packageName.trim();
  const response = await axiosClient.get(
    normalizedPackageName
      ? `/packages/installed/${encodeURIComponent(normalizedPackageName)}`
      : "/packages/installed"
  );
  return response.data;
};

export const getAvailablePackages = async (search = "") => {
  const normalizedSearch = search.trim();
  const response = await axiosClient.get("/packages/available", {
    params: normalizedSearch ? { search: normalizedSearch } : undefined,
  });
  return response.data.packages; 
};

export const installPackage = async (packageName: string) => {
  const response = await axiosClient.post("/packages/install", [packageName]);
  return response.data;
};

export const uninstallPackage = async (packageName: string) => {
  const response = await axiosClient.post("/packages/uninstall", [packageName]);
  return response.data;
};
