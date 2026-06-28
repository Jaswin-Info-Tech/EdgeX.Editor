// api/packages.js

import axiosClient from "./client";

export const getInstalledPackages = async () => {
  const response = await axiosClient.get("/packages/installed");
  return response.data;
};

export const getAvailablePackages = async () => {
  const response = await axiosClient.get("/packages/available");
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