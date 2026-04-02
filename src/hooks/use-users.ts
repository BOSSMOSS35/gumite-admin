import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getInternalUsers,
  createInternalUser,
  inviteInternalUser,
  updateInternalUser,
  archiveInternalUser,
  hardDeleteInternalUser,
  restoreInternalUser,
  type InternalUsersResponse,
  type InternalUserResponse,
  type CreateInternalUserRequest,
  type InviteInternalUserRequest,
  type InviteInternalUserResponse,
  type UpdateInternalUserRequest,
} from "@/lib/api";

// ─── Query key factory ────────────────────────────────────────
export const userKeys = {
  all: ["internal-users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ─── Queries ──────────────────────────────────────────────────

export function useInternalUsers(params?: { limit?: number; offset?: number }) {
  return useQuery<InternalUsersResponse>({
    queryKey: userKeys.list(params ?? {}),
    queryFn: () => getInternalUsers(params),
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation<
    InviteInternalUserResponse,
    Error,
    InviteInternalUserRequest
  >({
    mutationFn: (data) => inviteInternalUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    InternalUserResponse,
    Error,
    { userId: string; data: UpdateInternalUserRequest }
  >({
    mutationFn: ({ userId, data }) => updateInternalUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useArchiveUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (userId) => archiveInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (userId) => hardDeleteInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    InternalUserResponse,
    Error,
    CreateInternalUserRequest
  >({
    mutationFn: (data) => createInternalUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();

  return useMutation<InternalUserResponse, Error, string>({
    mutationFn: (userId) => restoreInternalUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
