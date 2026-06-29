// hooks/usePackages.js
import { useQuery } from "@tanstack/react-query";
import { getAvailablePackages, getInstalledPackages } from "../api/package";

export const usePackages = () => {
  return useQuery({
    queryKey: ["packages"],
    queryFn: getInstalledPackages,
  });
};

export function useAvailablePackages(search: string = "") {
  return useQuery({
    queryKey: ["available-packages", search],
    queryFn: () => getAvailablePackages(search),
  });
}
