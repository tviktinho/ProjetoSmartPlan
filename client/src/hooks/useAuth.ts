import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isFetching } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000, // Considera dados frescos por 1 segundo
  });

  return {
    user,
    isLoading,
    isFetching,
    isAuthenticated: !!user,
  };
}
