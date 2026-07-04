import axiosClient from "./client";

export interface SystemKpisResponse {
  timestampUtc: string;
  machineName: string;
  osDescription: string;
  osArchitecture: string;
  processArchitecture: string;
  processorCount: number;
  uptimeSeconds: number;
  cpu: {
    usagePercent: number | null;
    message?: string;
  };
  memory: {
    totalBytes: number;
    availableBytes: number;
    usedBytes: number;
    totalMb: number;
    availableMb: number;
    usedMb: number;
  };
  process: {
    id: number;
    name: string;
    threads: number;
    workingSetBytes: number;
    workingSetMb: number;
    privateMemoryBytes: number;
    privateMemoryMb: number;
    pagedMemoryBytes: number;
    pagedMemoryMb: number;
    cpuTimeSeconds: number;
    managedHeapBytes: number;
    heapSizeBytes: number;
    fragmentedBytes: number;
    totalAvailableMemoryBytes: number;
    memoryLoadBytes: number;
  };
}

export const getSystemKpis = async (): Promise<SystemKpisResponse> => {
  const response = await axiosClient.get("system/kpis", {
    headers: {
      accept: "*/*",
    },
  });
  return response.data;
};
