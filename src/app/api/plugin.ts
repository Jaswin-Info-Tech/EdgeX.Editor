// api/users.js

import axiosClient from "./client";

export const getInstalledPlugins = async () => {
  const { data } = await axiosClient.get("/plugins");
  return data;
};

export const getSteps = async () => {
  const { data } = await axiosClient.get("/plugins/test-steps");
  return data;
};

export const getInstruments = async () => {
  const { data } = await axiosClient.get("/plugins/instruments");
  return data;
};

export const removePlugin = async (pluginName: string) => {
  console.log("Removing plugin (exact value):", JSON.stringify(pluginName));
  const response = await axiosClient.delete("/plugins/remove", {
    headers: { "Content-Type": "application/json" },
    data: { pluginName },
  });
  return response.data;
};
