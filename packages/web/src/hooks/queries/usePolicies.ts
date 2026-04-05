import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "../useApiClient";
import { queryKeys } from "./keys";
import {
  API_POLICIES, API_POLICY_EFFECTIVE, API_POLICY_COMPANY, API_POLICY_USER,
  apiPath,
} from "@hr-attendance-app/types";
import type { EffectivePolicy, RawPolicy } from "@hr-attendance-app/types";

interface GroupPolicyResponse {
  readonly groupName: string;
  readonly raw: RawPolicy;
}

interface UserPolicyResponse {
  readonly userId: string;
  readonly raw: RawPolicy;
}

export function usePolicies(groupName: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.policies.byGroup(groupName),
    queryFn: () => api.get<GroupPolicyResponse>(apiPath(API_POLICIES, { groupName })),
    enabled: !!groupName,
  });
}

export function useCompanyPolicy() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.policies.company(),
    queryFn: () => api.get<RawPolicy>(API_POLICY_COMPANY),
  });
}

export function useUserPolicy(userId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.policies.byUser(userId),
    queryFn: () => api.get<UserPolicyResponse>(apiPath(API_POLICY_USER, { userId })),
    enabled: !!userId,
  });
}

export function useEffectivePolicy() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.policies.effective(),
    queryFn: () => api.get<EffectivePolicy>(API_POLICY_EFFECTIVE),
  });
}

export function useUpdateGroupPolicy() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { groupName: string; policy: RawPolicy }) =>
      api.put(apiPath(API_POLICIES, { groupName: input.groupName }), input.policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });
}

export function useUpdateCompanyPolicy() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policy: RawPolicy) => api.put(API_POLICY_COMPANY, policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });
}

export function useUpdateUserPolicy() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; policy: RawPolicy }) =>
      api.put(apiPath(API_POLICY_USER, { userId: input.userId }), input.policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
    },
  });
}
