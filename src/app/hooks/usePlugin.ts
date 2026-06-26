// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { getSteps } from "../api/plugin";
import type { LibraryItem } from "../types/editor";

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