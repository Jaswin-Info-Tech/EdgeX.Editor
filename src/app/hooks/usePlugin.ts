// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { getSteps } from "../api/plugin";

export const usePlugins = () => {
  return useQuery({
    queryKey: ["steps"],
    queryFn: getSteps,
  });
};