// api/packages.js

import axiosClient from "./client";

export const getInstalledPackages = async () => {
  const response = await axiosClient.get("/packages/installed");
  return response.data;
};