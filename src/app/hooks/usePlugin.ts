// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { getDuts, getInstruments, getSteps } from "../api/plugin";
import type { DutItem, InstrumentItem, LibraryItem } from "../types/editor";

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
