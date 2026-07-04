import { useQuery } from "@tanstack/react-query";
import { getSystemKpis } from "../api/system";

export const useSystemKpis = (enabled = true) => {
  return useQuery({
    queryKey: ["system-kpis"],
    queryFn: getSystemKpis,
    enabled,
    refetchInterval: 5000,
    staleTime: 2000,
  });
};
