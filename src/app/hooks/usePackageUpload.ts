// hooks/usePackageUpload.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postUploadPackages } from "../api/PackageUpload";

export const usePackageUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postUploadPackages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
};
