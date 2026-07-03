// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { getInstalledPlugins, getInstruments, getDuts, getSteps, getConnections } from "../api/plugin";
import { getTestPlans } from "../api/testplans";
import type { ConnectionItem, DutItem, InstrumentItem, LibraryItem, TestPlanItem } from "../types/editor";


export const usePlugins = () => {
  return useQuery({
    queryKey: ["steps"],
    queryFn: async () => {
      const data = await getSteps();
      // Ensure all library items have required fields
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          defaultProps: Array.isArray(item.defaultProps) ? item.defaultProps : [],
        } as LibraryItem));
      }
      return data;
    },
  });
};

export const useInstruments = () => {
  return useQuery<InstrumentItem[]>({
    queryKey: ["instruments"],
    queryFn: async () => {
      const data = await getInstruments();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          name: String(item.name ?? ""),
          assembly: String(item.assembly ?? ""),
          baseType: String(item.baseType ?? ""),
          canCreateInstance: Boolean(item.canCreateInstance),
          isBrowsable: Boolean(item.isBrowsable),
        }));
      }
      return [];
    },
  });
};


export function useInstalledPlugins(search: string = "") {
  return useQuery({
    queryKey: ["installed-plugins", search],
    queryFn: () => getInstalledPlugins(search),
  });
}

export const useDuts = () => {
  return useQuery<DutItem[]>({
    queryKey: ["duts"],
    queryFn: async () => {
      const data = await getDuts();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          ...item,
          name: String(item.name ?? item.dutName ?? item.model ?? ""),
          serialNumber: String(item.serialNumber ?? item.serial ?? item.dutSerial ?? ""),
          model: String(item.model ?? item.dutModel ?? ""),
          firmware: String(item.firmware ?? item.firmwareVersion ?? item.dutFirmware ?? ""),
          assembly: item.assembly == null ? undefined : String(item.assembly),
          baseType: item.baseType == null ? undefined : String(item.baseType),
        }));
      }
      return [];
    },
  });
};

export const useTestPlans = (rootPath?: string, enabled = true) => {
  return useQuery<TestPlanItem[]>({
    queryKey: ["testplans", rootPath ?? ""],
    enabled,
    queryFn: async () => {
      const data = await getTestPlans(rootPath);
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          name: String(item.name ?? ""),
          path: String(item.path ?? ""),
          stepCount: Number(item.stepCount ?? 0),
          lastModified: String(item.lastModified ?? ""),
        }));
      }
      return [];
    },
  });
};


export const useConnections = () => {
  return useQuery<ConnectionItem[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const data = await getConnections();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          name: String(item.name ?? ""),
          assembly: String(item.assembly ?? ""),
          baseType: String(item.baseType ?? ""),
          canCreateInstance: Boolean(item.canCreateInstance),
          isBrowsable: Boolean(item.isBrowsable),
        }));
      }
      return [];
    },
  });
};
