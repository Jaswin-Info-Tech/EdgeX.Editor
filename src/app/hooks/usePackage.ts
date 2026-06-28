// hooks/usePackages.js
import { useQuery } from "@tanstack/react-query";
import { getAvailablePackages, getInstalledPackages } from "../api/package";

export const usePackages = (packageName = "") => {
  const normalizedPackageName = packageName.trim();
  return useQuery({
    queryKey: ["packages", normalizedPackageName],
    queryFn: () => getInstalledPackages(normalizedPackageName),
  });
};

export const useAvailablePackages = (search = "") => {
  const normalizedSearch = search.trim();
  return useQuery({
    queryKey: ["available-packages", normalizedSearch],
    queryFn: () => getAvailablePackages(normalizedSearch),
  });
};
