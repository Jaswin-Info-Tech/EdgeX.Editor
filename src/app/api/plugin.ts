// api/users.js

import axiosClient from "./client";

export const getInstalledPlugins = async (search?: string) => {
  const { data } = await axiosClient.get("/plugins", {
    params: search ? { search } : {},
  });
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

export const removePlugin = async (plugin: { pluginName: string; packageName?: string; assembly?: string }) => {
  const response = await axiosClient.delete("/plugins/remove", {
    data: plugin,
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};

export const uploadPlugin = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file); // confirm the field name your backend expects — adjust if it's e.g. "package" or "plugin"
  const response = await axiosClient.post("/plugins/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
