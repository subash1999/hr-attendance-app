import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import { API_EMPLOYEES_ME, API_EMPLOYEES, API_EMPLOYEES_BY_ID, apiPath } from "@hr-attendance-app/types";
import type { Employee } from "@hr-attendance-app/types";

export const useCurrentUser = () => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.employee.me(),
    queryFn: () => api.get<Employee>(API_EMPLOYEES_ME),
  });
};

export const useEmployees = () => {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.employee.all,
    queryFn: () => api.get<Employee[]>(API_EMPLOYEES),
  });
};

export const useUpdateEmployee = () => {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Employee>) =>
      api.patch<Employee>(apiPath(API_EMPLOYEES_BY_ID, { id }), updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employee.all });
    },
  });
};
