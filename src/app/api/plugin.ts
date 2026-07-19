// api/users.js

import axiosClient from "./client";
import { getActiveServerProfile } from "../config/serverSettings";

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
  formData.append("file", file);
  const response = await axiosClient.post("/plugins/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};



export const getRunStatus = async (runId: string) => {
  const { data } = await axiosClient.get(`/runs/${runId}`);
  return data;
};

export const getRunLogs = async (runId: string) => {
  const { data } = await axiosClient.get(`/runs/${runId}/logs`);
  return data;
};

export const getRunLogsStreamUrl = (runId: string) => {
  const active = getActiveServerProfile();
  const base = String(active?.baseUrl ?? axiosClient.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}/runs/${runId}/logs/stream`;
};

export const cancelRun = async (runId: string) => {
  const { data } = await axiosClient.post(`/runs/${runId}/cancel`);
  return data;
};

export const pauseRun = async (runId: string) => {
  const { data } = await axiosClient.post(`/runs/${runId}/pause`);
  return data;
};

export const resumeRun = async (runId: string) => {
  const { data } = await axiosClient.post(`/runs/${runId}/resume`);
  return data;
};


export const getDuts = async () => {
  const { data } = await axiosClient.get("/plugins/duts");
  return data;

};

export const getConnections = async () => {
  const { data } = await axiosClient.get("/plugins/connections");
  return data;
};

export const getResultListeners = async () => {
  const { data } = await axiosClient.get("/plugins/result-listeners");
  return data;
};

export const getTraceListeners = async () => {
  const { data } = await axiosClient.get("/plugins/trace-listeners");
  return data;
};
