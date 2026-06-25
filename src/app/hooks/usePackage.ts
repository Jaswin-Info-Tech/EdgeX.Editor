// hooks/usePackages.js
import { useQuery } from "@tanstack/react-query";
import { getInstalledPackages } from "../api/package";

export const usePackages = () => {
  return useQuery({
    queryKey: ["packages"],
    queryFn: getInstalledPackages,
  });
};