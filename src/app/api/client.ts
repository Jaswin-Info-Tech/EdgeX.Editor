import axios from 'axios';
import { env } from '../config/env';
import { getActiveServerProfile } from '../config/serverSettings';

const axiosClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosClient.interceptors.request.use((config) => {
  const activeServer = getActiveServerProfile();
  if (activeServer?.baseUrl) {
    config.baseURL = activeServer.baseUrl;
  }

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (activeServer?.apiKey) {
    config.headers["x-api-key"] = activeServer.apiKey;
  }

  if (activeServer?.licenseKey) {
    config.headers["x-license-key"] = activeServer.licenseKey;
  }

  if (activeServer?.environment) {
    config.headers["x-edgex-environment"] = activeServer.environment;
  }

  return config;
});

export default axiosClient;